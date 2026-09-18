#!/usr/bin/env bash
# Prime Design — asset optimization script
# Requires: cwebp (from webp package), csso-cli, terser
# Install: brew install webp && npm i -g csso-cli terser
#
# Usage: cd /Users/zhanat/Downloads/Prime\ Design/site && bash optimize.sh
#
# Produces:
#   images/*.webp — WebP versions of JPG/PNG (retain originals)
#   styles.min.css — minified CSS
#   script.min.js — minified JS

set -e
cd "$(dirname "$0")"

echo "=== 1. WebP conversion ==="
if ! command -v cwebp &> /dev/null; then
  echo "cwebp not installed. Install: brew install webp"
else
  count=0
  for img in images/*.jpg images/*.png; do
    [ -f "$img" ] || continue
    out="${img%.*}.webp"
    if [ ! -f "$out" ] || [ "$img" -nt "$out" ]; then
      cwebp -q 82 -m 6 -mt "$img" -o "$out" 2>/dev/null
      count=$((count + 1))
    fi
  done
  echo "  Generated: $count WebP files"
  echo "  Original size: $(du -sh images | cut -f1)"
  echo "  WebP total:    $(du -ch images/*.webp 2>/dev/null | tail -1 | cut -f1)"
fi

echo ""
echo "=== 2. CSS minification ==="
if ! command -v csso &> /dev/null; then
  echo "csso not installed. Install: npm i -g csso-cli"
else
  csso styles.css --output styles.min.css --comments none
  echo "  styles.css: $(wc -c < styles.css) B → styles.min.css: $(wc -c < styles.min.css) B"
fi

echo ""
echo "=== 3. JS minification ==="
if ! command -v terser &> /dev/null; then
  echo "terser not installed. Install: npm i -g terser"
else
  terser script.js --compress --mangle --output script.min.js
  echo "  script.js: $(wc -c < script.js) B → script.min.js: $(wc -c < script.min.js) B"
fi

echo ""
echo "=== 4. To use minified in HTML ==="
echo "  Replace in all *.html:"
echo "    href=\"/styles.css\"       → href=\"/styles.min.css\""
echo "    src=\"/script.js?v=3d11\"  → src=\"/script.min.js?v=3d11\""
echo ""
echo "  Or run the bulk-replace:"
echo "    find . -name '*.html' -not -path './images/*' -exec sed -i '' 's|styles\\.css|styles.min.css|g;s|script\\.js?v=|script.min.js?v=|g' {} +"

echo ""
echo "=== 5. To add <picture> WebP fallback in HTML ==="
echo "  Manually replace <img src=\"images/X.jpg\"> with:"
echo "    <picture>"
echo "      <source srcset=\"images/X.webp\" type=\"image/webp\">"
echo "      <img src=\"images/X.jpg\" alt=\"...\" loading=\"lazy\">"
echo "    </picture>"
