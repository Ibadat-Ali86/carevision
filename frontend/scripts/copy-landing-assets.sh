#!/usr/bin/env bash
# Run this once to copy generated landing page images into public/landing/
set -e
BRAIN_DIR="/home/ibadat/.gemini/antigravity/brain/ac5d775a-7c0b-4eb6-be40-86fd84169b8c"
DEST="$(dirname "$0")/../public/landing"
mkdir -p "$DEST"
cp "$BRAIN_DIR/carevision_hero_3d_1777836273766.png"    "$DEST/hero_3d.png"
cp "$BRAIN_DIR/carevision_features_3d_1777836292668.png" "$DEST/features_3d.png"
cp "$BRAIN_DIR/carevision_chw_photo_1777836460490.png"   "$DEST/chw_photo.png"
echo "✅ Landing assets copied to $DEST"
