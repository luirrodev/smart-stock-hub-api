#!/bin/sh

# Ejecutar migraciones
echo "Running database migrations..."
npx typeorm migration:run -d dist/database/typeorm.config.js

# Iniciar aplicación
echo "Starting application..."
npm run start:prod