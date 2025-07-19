#!/bin/bash

# Create very basic, guaranteed-to-work icons
echo "Creating basic icons..."

# Create a simple colored square with "FM" text for 16x16
convert -size 16x16 xc:'#667eea' \
  -fill white -gravity center -pointsize 8 -annotate +0+0 "FM" \
  icons/icon16.png

# Create a simple colored square with "FM" text for 32x32
convert -size 32x32 xc:'#667eea' \
  -fill white -gravity center -pointsize 16 -annotate +0+0 "FM" \
  icons/icon32.png

# Create a simple colored square with "FM" text for 48x48
convert -size 48x48 xc:'#667eea' \
  -fill white -gravity center -pointsize 24 -annotate +0+0 "FM" \
  icons/icon48.png

# Create a simple colored square with "FM" text for 128x128
convert -size 128x128 xc:'#667eea' \
  -fill white -gravity center -pointsize 64 -annotate +0+0 "FM" \
  icons/icon128.png

echo "Basic icons created successfully!"
ls -la icons/*.png 