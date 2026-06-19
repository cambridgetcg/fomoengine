#!/bin/bash
# fomoengine heartbeat — the authenticity shield
# Rhythm: 2h if site down, daily if active, weekly if quiet

cd "$(dirname "$0")"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://fomoengine-cambridgetcgs-projects.vercel.app/check" 2>/dev/null)

if [ "$HTTP_STATUS" != "200" ]; then
  echo "SITE DOWN (HTTP $HTTP_STATUS)"
  echo "NEXT:120"
  exit 0
fi

DAYS_SINCE=$(( ( $(date +%s) - $(git log -1 --format=%ct 2>/dev/null || echo 0) ) / 86400 ))

if [ "$DAYS_SINCE" -lt 2 ]; then
  echo "NEXT:1440"
else
  echo "NEXT:10080"
fi

exit 0