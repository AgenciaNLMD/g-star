#!/bin/bash

CRON_SECRET="g5tart_cr0n_9xK2mPqNvLwRjHdYeZbAoFuIcTsX8n4"
CRON_URL="http://localhost:3001/api/eapi/cron/inactividad"

echo "Iniciando servidor Next.js..."
npm run dev &
SERVER_PID=$!

echo "Esperando que el server este listo en :3001"
until curl -s -o /dev/null -X POST "$CRON_URL" \
  -H "Authorization: Bearer $CRON_SECRET"; do
  printf "."
  sleep 3
done

echo ""
echo "Server listo. Cron iniciado (cada 5 min)."

while true; do
  RESP=$(curl -s -X POST "$CRON_URL" -H "Authorization: Bearer $CRON_SECRET")
  echo "$(date '+%H:%M:%S') cron → $RESP"
  sleep 300
done
