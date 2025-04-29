# Etapa de construcción
FROM node:20-alpine3.19 AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

#Configuraciones necesarias de pnpm
RUN pnpm config set fetch-retry-mintimeout=100
RUN pnpm config set fetch-retry-maxtimeout=100
RUN pnpm config set fetch-retries=1000000

# Instalar dependencias con pnpm
RUN pnpm install --frozen-lockfile

# Copiar el resto del código de la aplicación
COPY . .

# Construir la aplicación NestJS
RUN pnpm run build

# Etapa de producción
FROM node:20-alpine3.19 AS production

# Establecer NODE_ENV a producción
ENV NODE_ENV=prod

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de paquetes
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm globalmente
RUN npm install -g pnpm

#Configuraciones necesarias de pnpm
RUN pnpm config set fetch-retry-mintimeout=100
RUN pnpm config set fetch-retry-maxtimeout=100
RUN pnpm config set fetch-retries=1000000

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Copiar la aplicación construida desde la etapa de builder
COPY --from=builder /usr/src/app/dist ./dist

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
# Las variables de entorno se pasarán al ejecutar el contenedor con:
# docker run -e DATABASE_URL=xxx -e JWT_SECRET=yyy ...
# Copiar el script de entrada
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Comando para ejecutar el script de entrada
ENTRYPOINT ["./docker-entrypoint.sh"]
