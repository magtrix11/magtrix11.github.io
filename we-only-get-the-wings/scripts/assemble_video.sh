#!/usr/bin/env bash
# Assemble numbered PNG frames into a review movie.
#   scripts/assemble_video.sh renders/study01_1080 output/study01/study01_1080.mp4
# Uses $FFMPEG, else system ffmpeg, else the binary shipped with the
# imageio-ffmpeg Python package (pip install imageio-ffmpeg).
set -euo pipefail
SRC="${1:-renders/study01_1080}"
OUT="${2:-output/study01/study01_1080.mp4}"
FF="${FFMPEG:-}"
if [ -z "$FF" ]; then
  if command -v ffmpeg >/dev/null 2>&1; then FF=ffmpeg
  else FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"; fi
fi
mkdir -p "$(dirname "$OUT")"
# H.264 High, 4:2:0 for compatibility, near-lossless CRF for review.
"$FF" -y -loglevel error -framerate 24 -i "$SRC/frames/f_%03d.png" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$OUT"
# Optional mastering intermediate (large): ProRes 4444
if [ "${PRORES:-0}" = "1" ]; then
  "$FF" -y -loglevel error -framerate 24 -i "$SRC/frames/f_%03d.png" -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le "${OUT%.mp4}.mov"
fi
echo "wrote $OUT"
