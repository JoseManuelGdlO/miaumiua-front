#!/bin/bash

# Script para construir la imagen Docker con limpieza de cache
echo "🧹 Limpiando cache local..."

# Limpiar cache de npm
npm cache clean --force

# Limpiar node_modules y reinstalar
rm -rf node_modules
rm -rf dist

# Limpiar cache de Docker
echo "🐳 Limpiando cache de Docker..."
docker system prune -f
docker builder prune -f

# Construir la imagen
echo "🔨 Construyendo imagen Docker..."
docker build -f dockerizer/Dockerfile \
  --build-arg VITE_API_BASE_URL \
  --build-arg VITE_GOOGLE_MAPS_API_KEY \
  --build-arg VITE_IMAGE_BASE_URL \
  -t miau-miau-center:latest .

echo "✅ Build completado con cache limpio!"
