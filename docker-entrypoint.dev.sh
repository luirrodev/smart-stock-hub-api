#!/bin/sh

# Ejecutar migraciones usando TypeScript directamente
echo "Ejecutando migraciones..."
pnpm run migration:run

# Ejecutar el seeder
echo "Ejecutando seeder inicial..."
pnpm run seed:dev

# Iniciar aplicación en modo desarrollo
echo "Iniciando aplicación en modo desarrollo..."
exec pnpm run start:dev 