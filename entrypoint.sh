#!/bin/sh

# Ejecutar migraciones
echo "Running database migrations..."
npx typeorm migration:run -d dist/database/data-source.js

# Iniciar aplicación
echo "Starting application..."
npm run start:prod