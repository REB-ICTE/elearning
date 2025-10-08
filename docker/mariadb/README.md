# MariaDB Configuration

This directory contains the MariaDB configuration for the Moodle application.

## Current Status

✅ **Production database successfully migrated and upgraded:**
- Source: Moodle 5.0.2 on MariaDB 10.x
- Target: Moodle 5.1 (Build: 20251006) on MariaDB 11.4
- Migration method: SQL dump → Auto-load on first start
- Admin credentials: `admin` / `Admin123!`

## Directory Structure

```
docker/mariadb/
├── Dockerfile          # Custom MariaDB image (MariaDB 11.4)
├── custom.cnf          # MariaDB configuration optimized for Moodle
├── initdb.d/           # SQL scripts executed on first start
└── README.md           # This file
```

## Usage

### Starting Services

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f mariadb
```

### Loading Migration Data

Place SQL dump files in `initdb.d/` directory. They will be executed alphabetically when the container is first created:

```bash
# Example: Load production dump
cp dev_migration.sql docker/mariadb/initdb.d/01-migration.sql

# Recreate database with migration
docker compose down -v
docker compose up -d
```

### Post-Migration: Upgrade Moodle Database

After loading a production database dump, you must run the Moodle upgrade script to update the database schema to match Moodle 5.1:

```bash
# Run the upgrade (required after migration)
docker compose exec php php /var/www/html/moodle_app/admin/cli/upgrade.php --non-interactive

# Purge all caches
docker compose exec php php /var/www/html/moodle_app/admin/cli/purge_caches.php
```

**Note:** The upgrade process will automatically create any missing system records (system context, site course, etc.)

### Known Post-Migration Issues

When migrating from Moodle 5.0.2 to 5.1, you may need to:

1. **Remove missing plugins:**
   ```bash
   # Production had custom plugins that don't exist in standard Moodle 5.1
   docker compose exec -T mariadb mariadb -u moodleuser -pmoodlepass moodle -e \
     "DELETE FROM mdl_config_plugins WHERE plugin IN ('auth_externalid', 'auth_antihammer');"

   # Update enabled auth plugins
   docker compose exec -T mariadb mariadb -u moodleuser -pmoodlepass moodle -e \
     "UPDATE mdl_config SET value='manual,email,oauth2' WHERE name='auth';"
   ```

2. **Switch to standard theme:**
   ```bash
   # Production used custom 'moove' theme, switch to 'boost'
   docker compose exec -T mariadb mariadb -u moodleuser -pmoodlepass moodle -e \
     "UPDATE mdl_config SET value='boost' WHERE name='theme';"
   ```

3. **Reset admin password if needed:**
   ```bash
   # Generate password hash
   docker compose exec php php -r "echo password_hash('Admin123!', PASSWORD_DEFAULT);"

   # Update password (replace <hash> with output from above)
   docker compose exec -T mariadb mariadb -u moodleuser -pmoodlepass moodle -e \
     "UPDATE mdl_user SET password='<hash>' WHERE username='admin';"
   ```

### Security Warning

⚠️ **If migrating from production, check for security issues:**

The production database was found to contain a malicious backdoor in `mdl_config.aspellpath`:
```bash
# Check for malicious code
docker compose exec -T mariadb mariadb -u moodleuser -pmoodlepass moodle -e \
  "SELECT name, value FROM mdl_config WHERE name='aspellpath';"

# Clean if found
docker compose exec -T mariadb mariadb -u moodleuser -pmoodlepass moodle -e \
  "DELETE FROM mdl_config WHERE name='aspellpath';"
```

### Connecting to MariaDB

From host machine:
```bash
docker compose exec mariadb mariadb -u moodleuser -p moodle
# Password: moodlepass (or what you set in .env)
```

From PHP container:
```bash
docker compose exec php mariadb -h mariadb -u moodleuser -p moodle
```

### Database Backup

```bash
# Backup database
docker compose exec mariadb mariadb-dump -u root -p moodle > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T mariadb mariadb -u root -p moodle < backup.sql
```

## Configuration

The `custom.cnf` file contains MariaDB settings optimized for Moodle:

- UTF-8 character set (utf8mb4)
- InnoDB optimizations
- Increased max_allowed_packet for large uploads
- Connection pooling settings
- Slow query logging

Adjust these settings in `custom.cnf` based on your server resources.

## Switching Databases

To switch from MariaDB to PostgreSQL:

1. Edit `.env` file:
   ```bash
   DB_TYPE=pgsql
   DB_HOST=postgres
   DB_PORT=5432
   ```

2. Add PostgreSQL service to `docker-compose.yml`

3. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

## See Also

- **[MIGRATION.md](../../MIGRATION.md)** - Complete database migration guide from production to development
- **[DOCKER.md](../../DOCKER.md)** - Docker setup and usage instructions
- **[CLAUDE.md](../../CLAUDE.md)** - Project overview and current status
- **[Moodle Documentation](https://docs.moodle.org/)** - Official Moodle documentation
