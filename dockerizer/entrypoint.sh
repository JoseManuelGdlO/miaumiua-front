#!/bin/sh
set -e
if [ -z "$VITE_GOOGLE_MAPS_API_KEY" ]; then
  for f in /.env /app/.env /usr/share/nginx/html/.env; do
    if [ -f "$f" ]; then
      line=$(grep -E '^VITE_GOOGLE_MAPS_API_KEY=' "$f" | tail -n 1) || true
      if [ -n "$line" ]; then
        VITE_GOOGLE_MAPS_API_KEY=${line#VITE_GOOGLE_MAPS_API_KEY=}
        VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY#\"}
        VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY%\"}
        VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY#\'}
        VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY%\'}
      fi
    fi
  done
fi
ESCAPED=$(printf '%s' "${VITE_GOOGLE_MAPS_API_KEY:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.__MAPS_KEY__="%s";\n' "$ESCAPED" > /usr/share/nginx/html/maps-config.js
exec nginx -g 'daemon off;'
