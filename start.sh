#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] node: $(node -v)"
echo "[start.sh] npm:  $(npm -v)"
echo "[start.sh] pwd:  $(pwd)"

# 安全のため：container直下にいることを想定
cd /home/container

echo "[start.sh] installing deps (already handled by startup sometimes, but safe)"
npm install

echo "[start.sh] build (tsc -> dist/)"
npm run build

echo "[start.sh] start bot"
node dist/index.js
