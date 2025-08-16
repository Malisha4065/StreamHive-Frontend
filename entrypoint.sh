#!/bin/sh

# Find the main JavaScript bundle file
# Vite usually puts it in assets/index-*.js
JS_BUNDLE=$(find /usr/share/nginx/html/assets -name "index-*.js")

# Check if we found the bundle
if [ -z "$JS_BUNDLE" ]; then
  echo "Error: Could not find the main JS bundle file."
  exit 1
fi

echo "Found JS bundle: $JS_BUNDLE"

# Replace the placeholders with the actual environment variable values
# The 'g' flag ensures all occurrences are replaced
sed -i "s|__VITE_API_UPLOAD__|${VITE_API_UPLOAD}|g" $JS_BUNDLE
sed -i "s|__VITE_API_CATALOG__|${VITE_API_CATALOG}|g" $JS_BUNDLE
sed -i "s|__VITE_API_PLAYBACK__|${VITE_API_PLAYBACK}|g" $JS_BUNDLE
sed -i "s|__VITE_JWT__|${VITE_JWT}|g" $JS_BUNDLE

echo "Configuration has been injected."

# Start the Nginx server in the foreground
# This is the original CMD of the nginx image, it's important to end with this
exec nginx -g 'daemon off;'