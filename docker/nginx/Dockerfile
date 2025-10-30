# Nginx for Moodle
FROM nginx:alpine

# Copy custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Create directory for logs
RUN mkdir -p /var/log/nginx

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/nginx-health || exit 1

# Add a basic health check endpoint in the nginx config if needed
RUN echo 'server { listen 80; location /nginx-health { access_log off; return 200 "healthy\n"; add_header Content-Type text/plain; } }' > /etc/nginx/conf.d/health.conf

CMD ["nginx", "-g", "daemon off;"]
