#!/bin/bash

# Create simple, colored PNG icons for ForgetfulMe extension
echo "Creating simple colored icons..."

# Create 16x16 icon - simple circle with bookmark
convert -size 16x16 xc:transparent \
  -fill '#667eea' -draw 'circle 8,8 8,2' \
  -fill white -draw 'polygon 4,4 4,12 8,8 12,12 12,4' \
  icons/icon16.png

# Create 32x32 icon
convert -size 32x32 xc:transparent \
  -fill '#667eea' -draw 'circle 16,16 16,4' \
  -fill white -draw 'polygon 8,8 8,24 16,16 24,24 24,8' \
  icons/icon32.png

# Create 48x48 icon
convert -size 48x48 xc:transparent \
  -fill '#667eea' -draw 'circle 24,24 24,6' \
  -fill white -draw 'polygon 12,12 12,36 24,24 36,36 36,12' \
  icons/icon48.png

# Create 128x128 icon
convert -size 128x128 xc:transparent \
  -fill '#667eea' -draw 'circle 64,64 64,16' \
  -fill white -draw 'polygon 32,32 32,96 64,64 96,96 96,32' \
  icons/icon128.png

echo "Simple icons created successfully!"
ls -la icons/*.png 