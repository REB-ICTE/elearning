# SSL Certificates

This directory contains SSL certificates for the nginx web server.

## Development (Self-Signed)

On first startup, if no certificates exist, the nginx container will automatically generate self-signed certificates:
- `server.crt` - Self-signed certificate
- `server.key` - Private key

These are suitable for local development but will show browser warnings.

## Production

To use real SSL certificates:

1. Obtain your SSL certificate and private key from your certificate authority
2. Place the files in this directory:
   - `server.crt` - Your SSL certificate (may include intermediate chain)
   - `server.key` - Your private key
3. Restart the nginx container:
   ```bash
   docker compose restart nginx
   ```

The self-signed certificates will NOT be regenerated if these files already exist.

## Certificate Format

- **Certificate (`server.crt`)**: PEM format, may include intermediate certificates
- **Private Key (`server.key`)**: PEM format, unencrypted (no passphrase)

## Security Notes

- Keep `server.key` secure and never commit it to version control
- Certificate files in this directory are gitignored by default
- Ensure proper file permissions (readable only by root/nginx user)
