#!/bin/bash

# Script para desplegar con limpieza completa de cache
echo "🚀 Iniciando despliegue con limpieza de cache..."

# Limpiar todo el cache local
echo "🧹 Limpiando cache local completo..."
npm cache clean --force
rm -rf node_modules
rm -rf dist
rm -rf .next
rm -rf .vite

# Limpiar cache de Docker completamente
echo "🐳 Limpiando cache de Docker..."
docker system prune -af
docker builder prune -af
docker volume prune -f

# Construir imagen sin cache
echo "🔨 Construyendo imagen Docker sin cache..."
docker build --no-cache -f dockerizer/Dockerfile -t catmate-control-center:latest .

# Parar contenedores existentes
echo "⏹️ Parando contenedores existentes..."
docker stop catmate-control-center 2>/dev/null || true
docker rm catmate-control-center 2>/dev/null || true

# Ejecutar nuevo contenedor
echo "▶️ Ejecutando nuevo contenedor..."
docker run -d \
  --name catmate-control-center \
  -p 80:80 \
  --restart unless-stopped \
  catmate-control-center:latest

echo "✅ Despliegue completado con cache completamente limpio!"
echo "🌐 Aplicación disponible en: http://localhost"
