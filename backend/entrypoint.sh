#!/bin/bash
set -e

echo "Esperando a PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  sleep 2
done
echo "PostgreSQL listo."

echo "Ejecutando migraciones..."
python /app/migrate.py

echo "Iniciando servidor..."
exec uvicorn Main:app --host 0.0.0.0 --port 8000
