#!/bin/sh

# Ejecutar migraciones
echo "Ejecutando migraciones..."
pnpm run migration:run

# Iniciar aplicación
echo "Iniciando aplicación..."
exec node dist/main.js