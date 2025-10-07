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
docker build -f dockerizer/Dockerfile -t catmate-control-center:latest .

echo "✅ Build completado con cache limpio!"
