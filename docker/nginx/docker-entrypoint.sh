#!/bin/sh
set -e

# Set default PHP-FPM host if not provided
export PHP_FPM_HOST=${PHP_FPM_HOST:-php}

echo "Configuring Nginx to use PHP-FPM at: ${PHP_FPM_HOST}:9000"

# Substitute environment variables in the template
envsubst '${PHP_FPM_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Nginx configuration ready. Starting Nginx..."

# Start nginx
exec nginx -g 'daemon off;'
