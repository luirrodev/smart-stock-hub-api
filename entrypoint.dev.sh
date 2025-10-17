#!/bin/sh

# Ejecutar migraciones en modo desarrollo
echo "Running database migrations..."
npm run migration:run

echo "Ejecutando seeder inicial..."
npm run seed:dev

# Iniciar aplicación en modo debug
echo "Starting application in debug mode..."
npm run start:debug
