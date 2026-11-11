# Play walkthroughs

The gifgpt reel cuts between 16 animations from the site's media library. Go back
in time uses recorded app interactions with tap rings. Both Remotion exports
run for 20 seconds at 720×1280 and 30 fps, with footage at 1.3× speed.

The Play page uses the exported MP4s and WebP posters in `videos/` and `images/`.
Published filenames include content hashes. Provenance is in
[creative-project-previews.json](../../.impeccable/assets/creative-project-previews.json).

## Capture and render

Use Node.js 22 or newer, Python 3.9–3.12, Google Chrome, and FFmpeg with the
`libx264`, `aac`, and `libwebp` encoders. From the repository root, start
`python3 scripts/preview.py --port 4173` in a separate terminal for Mobbin.

```sh
cd scripts/play-walkthroughs
npm ci
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-audio.txt

python generate-gifgpt-lofi.py
npm run render:gifgpt

npm run capture:mobbin
python generate-scores.py
npm run render:mobbin
```

The gifgpt render reads the shot order and durations from `src/gifgpt-shots.json`
and copies the selected animations from `gifgpt/media/`. Its original 96 BPM
score uses soft keys, bass and muted drums. The generator caps true peak at
−9 dBTP and reports the measured loudness.

The Mobbin capture opens `http://127.0.0.1:4173/mobbin/` to use the checkout's
archived screens. The composition reads tap timings from the Mobbin capture.
Set `PLAY_CAPTURE_ORIGIN` to override a capture origin, `REMOTION_BROWSER` to
use a specific Chrome executable, and `FFMPEG` if FFmpeg is outside your PATH.

## Finish the MP4s and posters

Trim the AAC stream to exactly 20 seconds, reset its timestamps, and move the
MP4 index to the start for browser playback. This step copies the Remotion video
stream and re-encodes the already normalized audio.

```sh
ffmpeg_bin=${FFMPEG:-ffmpeg}
for app in gifgpt mobbin; do
  "$ffmpeg_bin" -i "out/$app-demo.mp4" -map 0:v:0 -map 0:a:0 \
    -c:v copy -c:a aac -b:a 192k -af 'atrim=duration=20,asetpts=PTS-STARTPTS' \
    -t 20 -movflags +faststart "out/$app-demo-final.mp4"
done

"$ffmpeg_bin" -ss 0.5 -i out/gifgpt-demo-final.mp4 -frames:v 1 \
  -c:v libwebp -quality 85 out/gifgpt-demo-poster.webp
"$ffmpeg_bin" -ss 3.2 -i out/mobbin-demo-final.mp4 -frames:v 1 \
  -c:v libwebp -quality 85 out/mobbin-demo-poster.webp
```

Use `ffprobe` to check that each final MP4 has 600 H.264 frames at 30 fps,
720×1280 dimensions, stereo AAC audio, and 20.000000-second video and audio
streams. Check the cuts, soundtrack and closing frames in the final videos.
