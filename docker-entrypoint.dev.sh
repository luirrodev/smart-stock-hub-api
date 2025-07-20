#!/bin/sh

# Ejecutar migraciones
echo "Ejecutando migraciones..."
pnpm run migration:run

# Iniciar aplicación en modo desarrollo
echo "Iniciando aplicación en modo desarrollo..."
exec pnpm run start:dev 