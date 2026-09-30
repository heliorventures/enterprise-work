#!/bin/sh
set -e
npx prisma migrate deploy
npx prisma db seed || true
node apps/api/dist/main.js
