# build stage
FROM node:20 as build
WORKDIR /app

# Limpiar cache de npm y apt
RUN npm cache clean --force && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Limpiar cache de build y construir
RUN rm -rf node_modules/.cache dist && \
    npm run build && \
    npm cache clean --force && \
    # Eliminar devDependencies después del build para reducir tamaño
    npm prune --production

# production stage
FROM nginx:stable as production

# Limpiar cache de nginx
RUN rm -rf /var/cache/nginx/* /tmp/* /var/tmp/*

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./dockerizer/nginx.conf /etc/nginx/conf.d/default.conf

# Configurar nginx para no cachear archivos estáticos en desarrollo
RUN echo "add_header Cache-Control 'no-cache, no-store, must-revalidate';" >> /etc/nginx/conf.d/default.conf && \
    echo "add_header Pragma 'no-cache';" >> /etc/nginx/conf.d/default.conf && \
    echo "add_header Expires '0';" >> /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]