#!/bin/sh

# Esperar a que la base de datos esté lista
echo "Waiting for database to be ready..."
sleep 5

# Ejecutar migraciones en modo desarrollo
echo "Running database migrations..."
npm run migration:run

# Iniciar aplicación en modo debug
echo "Starting application in debug mode..."
npm run start:debug
