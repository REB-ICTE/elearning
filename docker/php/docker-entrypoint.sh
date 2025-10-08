#!/bin/bash
set -e

# Create and fix permissions for moodledata directory
echo "Creating moodledata directory if it doesn't exist..."
mkdir -p /var/www/moodledata

echo "Setting permissions for moodledata..."
chown -R www-data:www-data /var/www/moodledata
chmod -R 0777 /var/www/moodledata

# Copy Moodle config if it doesn't exist
if [ ! -f "/var/www/html/moodle_app/config.php" ] && [ -f "/var/www/html/config.php.docker" ]; then
    echo "Copying config.php.docker to moodle_app/config.php..."
    cp /var/www/html/config.php.docker /var/www/html/moodle_app/config.php
    chown www-data:www-data /var/www/html/moodle_app/config.php
    echo "Config file created successfully."
fi

echo "Starting PHP-FPM..."

# Execute PHP-FPM (it will run worker processes as www-data based on php-fpm.conf)
exec "$@"
