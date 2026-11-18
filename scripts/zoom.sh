#!/bin/sh
# Zoomed sheet with a 0.1 m grid: scripts/zoom.sh out.png id,id,... [scale]
COLS=${COLS:-3} GRID=1 npx tsx scripts/carsheet.ts "$1" "$2" "${3:-6}" >/dev/null
