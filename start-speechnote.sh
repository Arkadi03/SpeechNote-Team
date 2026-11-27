#!/bin/sh
set -eu
cd "$(dirname "$0")"
python="${SPEECHNOTE_PYTHON:-.venv/bin/python}"
[ -x "$python" ] || { echo "Create a Linux .venv as described in README.md." >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "FFmpeg is required." >&2; exit 1; }
export CUDA_VISIBLE_DEVICES=-1 OMP_NUM_THREADS=4
if [ -f .venv/faster-whisper-tiny/model.bin ]; then
    set -- --model_dir .venv/faster-whisper-tiny "$@"
fi
exec "$python" -B -m whisperlivekit.basic_server --host 127.0.0.1 --port 8002 \
    --model tiny --language ru --backend faster-whisper --backend-policy localagreement \
    --pcm-input --log-level INFO --warmup-file examples/speechnote-ru.wav "$@"
