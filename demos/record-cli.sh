#!/bin/bash
# CLI Demo - demonstrates command-line usage
cd "$(dirname "$0")/.."

echo "# 📖 quran.sh - CLI Demo"
echo ""
sleep 1

echo '$ quran read 1'
sleep 0.5
bun run src/index.ts read 1
sleep 2

echo ""
echo '$ quran read 2:255'
sleep 0.5
bun run src/index.ts read 2:255
sleep 2

echo ""
echo '$ quran search "merciful"'
sleep 0.5
bun run src/index.ts search "merciful"
sleep 2

echo ""
echo '$ quran streak'
sleep 0.5
bun run src/index.ts streak
sleep 2

echo ""
echo "# That's quran.sh CLI! Run 'quran' for the interactive TUI."
sleep 1
