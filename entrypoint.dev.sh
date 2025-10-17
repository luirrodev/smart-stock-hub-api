#!/bin/sh

# Ejecutar migraciones en modo desarrollo
echo "Running database migrations..."
npx typeorm migration:run -d src/database/data-source.ts

echo "Ejecutando seeder inicial..."
npx run seed:dev

# Iniciar aplicación en modo debug
echo "Starting application in debug mode..."
npm run start:debug
