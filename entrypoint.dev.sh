#!/bin/sh

# Ejecutar migraciones en modo desarrollo
echo "Running database migrations..."
npx typeorm migration:run -d dist/database/data-source.js

echo "Ejecutando seeder inicial..."
node dist/database/seed.js

# Iniciar aplicación en modo debug
echo "Starting application in debug mode..."
npm run start:debug
