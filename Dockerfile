# Stage 1: Build the Node.js app
FROM node:20-slim as builder

# Aumenta el límite de memoria de Node.js
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia los archivos package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm ci

# Copia el código fuente
COPY . .

# Crea el directorio de datos y mueve el archivo JSON si existe
RUN mkdir -p /app/public/data && \
    if [ -f "/app/src/data/consolidated_data.json" ]; then \
      mv /app/src/data/consolidated_data.json /app/public/data/; \
    fi

# Compila la aplicación
RUN npm run build

# Stage 2: Configuración de NGINX para servir la aplicación de Node.js
FROM nginx:1.25-alpine as nginx

# Copia la configuración de NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos compilados del primer stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/data /usr/share/nginx/html/data

# Crea directorios de caché y ajusta permisos
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /usr/share/nginx/html

# Stage 3: Ejecutar la aplicación de Python con Uvicorn
FROM python:3.9-slim as uvicorn

# Directorio de trabajo en el contenedor
WORKDIR /app/server

# Copia los archivos del directorio 'server'
COPY server/ /app/server

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Expone los puertos necesarios
EXPOSE 8000 31110

# Comando para ejecutar uvicorn y NGINX
CMD uvicorn main:app --host 0.0.0.0 --port 8000 & nginx -g "daemon off;"
