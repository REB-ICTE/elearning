#!/bin/sh
set -e

# Set defaults if not provided
export PHP_FPM_HOST=${PHP_FPM_HOST:-php}
export NGINX_PORT=${NGINX_PORT:-8080}
export SSL_CERT_CN=${SSL_CERT_CN:-localhost}

# SSL certificate paths
SSL_CERT="/etc/nginx/certs/server.crt"
SSL_KEY="/etc/nginx/certs/server.key"

echo "Configuring Nginx:"
echo "  - HTTP port: ${NGINX_PORT}"
echo "  - HTTPS port: 443"
echo "  - PHP-FPM upstream: ${PHP_FPM_HOST}:9000"

# Generate self-signed SSL certificate if it doesn't exist
if [ ! -f "$SSL_CERT" ] || [ ! -f "$SSL_KEY" ]; then
    echo "SSL certificates not found. Generating self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_KEY" \
        -out "$SSL_CERT" \
        -subj "/C=US/ST=State/L=City/O=Development/CN=${SSL_CERT_CN}" \
        2>/dev/null
    echo "Self-signed certificate generated for CN=${SSL_CERT_CN}"
else
    echo "Using existing SSL certificates"
fi

# Substitute environment variables in the template
envsubst '${PHP_FPM_HOST} ${NGINX_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Nginx configuration ready. Starting Nginx..."

# Start nginx
exec nginx -g 'daemon off;'
