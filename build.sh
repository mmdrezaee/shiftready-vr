#!/usr/bin/env bash
# Bundle src/main.js and inline it into a single self-contained HTML file.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build
npx esbuild src/main.js --bundle --minify --format=iife --target=es2020 --outfile=build/bundle.js --log-level=warning
python3 - <<'PY'
src = open('src/index.html', encoding='utf-8').read()
js = open('build/bundle.js', encoding='utf-8').read().replace('</script>', '<\\/script>')
out = src.replace('<script>/*BUNDLE*/</script>', '<script>' + js + '</script>')
open('build/trainer.html', 'w', encoding='utf-8').write(out)
print('build/trainer.html', round(len(out) / 1e6, 2), 'MB')
PY
