# MariaDB for Moodle
FROM mariadb:11.4

# Install additional tools
RUN apt-get update && apt-get install -y \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# Copy custom MariaDB configuration
COPY custom.cnf /etc/mysql/conf.d/custom.cnf

# Set default character set and collation
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

EXPOSE 3306

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD healthcheck.sh --connect --innodb_initialized || exit 1
