# Nginx for Moodle
FROM nginx:alpine

# Install openssl for self-signed certificate generation
RUN apk add --no-cache openssl

# Create directory for SSL certificates
RUN mkdir -p /etc/nginx/certs

# Copy custom Nginx configuration template
COPY default.conf.template /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create directory for logs
RUN mkdir -p /var/log/nginx

# Set default environment variables (can be overridden)
ENV PHP_FPM_HOST=php
ENV NGINX_PORT=8080

# Expose HTTP and HTTPS ports
EXPOSE ${NGINX_PORT} 443

# Health check using HTTPS on port 443
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD sh -c 'wget --quiet --tries=1 --spider --no-check-certificate https://localhost:443/ || exit 1'

# Use custom entrypoint to substitute env vars
ENTRYPOINT ["/docker-entrypoint.sh"]
