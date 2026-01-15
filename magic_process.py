import cv2
import numpy as np
import os

def magic_process(filename, output_name, rotate=False):
    if not os.path.exists(filename):
        print(f"⚠️  Missing file: {filename}")
        return

    # 1. Load the image
    img = cv2.imread(filename)
    if rotate:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)

    # 2. Find the edges (The "Banana" Logic)
    # Resize slightly for better detection
    h, w = img.shape[:2]
    ratio = h / 1500.0
    img_resized = cv2.resize(img, (int(w / ratio), 1500))
    
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 200)
    
    cnts, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

    screenCnt = None
    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            screenCnt = approx
            break

    # 3. Transform & Flatten (Perspective Correction)
    if screenCnt is not None:
        pts = screenCnt.reshape(4, 2) * ratio
        rect = np.zeros((4, 2), dtype="float32")
        
        # Order points: TL, TR, BR, BL
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
        dst = np.array([[0, 0], [maxWidth-1, 0], [maxWidth-1, maxHeight-1], [0, maxHeight-1]], dtype="float32")
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
    else:
        # Fallback if edges aren't sharp
        print(f"⚠️  Could not auto-detect corners for {filename}, cropping center.")
        warped = img[int(h*0.05):int(h*0.95), int(w*0.05):int(w*0.95)]

    # 4. Enhance (Web Ready)
    # Brightness/Contrast boost
    lab = cv2.cvtColor(warped, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    final = cv2.cvtColor(cv2.merge((cl,a,b)), cv2.COLOR_LAB2BGR)

    cv2.imwrite(output_name, final)
    print(f"✅ Created perfect scan: {output_name}")

# Run the magic
magic_process("rtb_images/PXL_20260114_092741116.jpg", "web_ready_construction.jpg")
# magic_process("1000626303.jpg", "web_ready_surveyor.jpg")
# magic_process("1000626307.jpg", "web_ready_solar.jpg", rotate=True)
