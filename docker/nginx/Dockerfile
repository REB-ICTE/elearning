# Nginx for Moodle
FROM nginx:alpine

# Copy custom Nginx configuration template
COPY default.conf.template /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create directory for logs
RUN mkdir -p /var/log/nginx

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Set default PHP-FPM host (can be overridden)
ENV PHP_FPM_HOST=php

# Use custom entrypoint to substitute env vars
ENTRYPOINT ["/docker-entrypoint.sh"]
