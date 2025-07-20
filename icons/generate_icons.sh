#!/bin/bash

/**
 * @fileoverview Generate PNG icons from SVG for ForgetfulMe extension
 * @description Script to generate PNG icons at different sizes from SVG source
 * Requires ImageMagick to be installed
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

echo "Generating ForgetfulMe extension icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Generate icons at different sizes
echo "Creating 16x16 icon..."
convert -background transparent -size 16x16 icon.svg icon16.png

echo "Creating 32x32 icon..."
convert -background transparent -size 32x32 icon.svg icon32.png

echo "Creating 48x48 icon..."
convert -background transparent -size 48x48 icon.svg icon48.png

echo "Creating 128x128 icon..."
convert -background transparent -size 128x128 icon.svg icon128.png

echo "Icons generated successfully!"
echo "Files created:"
ls -la *.png 