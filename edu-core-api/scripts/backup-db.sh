#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
DB_NAME="edu_core"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${DB_NAME}_${TIMESTAMP}"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Perform dump
mongodump --db=$DB_NAME --out="${BACKUP_DIR}/${BACKUP_NAME}"

# Compress
tar -czvf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C $BACKUP_DIR $BACKUP_NAME

# Cleanup uncompressed folder
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Optional: Keep only last 7 days of backups
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
