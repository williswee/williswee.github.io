#!/usr/bin/env python3
"""Synthesize the gifgpt reel's 20-second lo-fi score from scratch."""

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import butter, sosfilt


RATE = 48_000
DURATION = 20
BPM = 96
BEAT = 60 / BPM
TARGET_LUFS = -23
MAX_PEAK_DBTP = -9
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "public/music-gifgpt-lofi.wav"


def time_axis(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def frequency(note):
    return 440 * 2 ** ((note - 69) / 12)


def soft_envelope(t, attack, release):
    rise = np.sin(np.pi / 2 * np.minimum(t / attack, 1)) ** 2
    fall = np.sin(np.pi / 2 * np.minimum((t[-1] - t) / release, 1)) ** 2
    return rise * fall


def piano(note, duration):
    t = time_axis(duration)
    phase = 2 * np.pi * frequency(note) * t
    tone = np.sin(phase + 0.18 * np.sin(2 * phase) * np.exp(-3.2 * t))
    tone += 0.12 * np.sin(2 * phase) * np.exp(-4.2 * t)
    tremolo = 0.97 + 0.03 * np.sin(2 * np.pi * 3.9 * t)
    return tone * tremolo * np.exp(-1.65 * t) * soft_envelope(t, 0.038, 0.25)


def bass(note, duration):
    t = time_axis(duration)
    phase = 2 * np.pi * frequency(note) * t
    tone = np.sin(phase) + 0.24 * np.sin(2 * phase) + 0.07 * np.sin(3 * phase)
    return tone * np.exp(-1.8 * t) * soft_envelope(t, 0.034, 0.16)


def kick():
    t = time_axis(0.30)
    pitch = 53 + 27 * np.exp(-21 * t)
    phase = 2 * np.pi * np.cumsum(pitch) / RATE
    return np.sin(phase) * np.exp(-11 * t) * soft_envelope(t, 0.024, 0.085)


def brush(rng):
    t = time_axis(0.20)
    bandpass = butter(2, [210, 780], "bandpass", fs=RATE, output="sos")
    noise = sosfilt(bandpass, rng.standard_normal(len(t)))
    noise /= np.max(np.abs(noise))
    body = np.sin(2 * np.pi * 163 * t)
    return (0.62 * noise + 0.38 * body) * np.exp(-12 * t) * soft_envelope(t, 0.022, 0.07)


def place(mix, sample, seconds, gain, pan=0):
    start = round(seconds * RATE)
    length = min(len(sample), len(mix) - start)
    angle = (pan + 1) * np.pi / 4
    mix[start:start + length] += sample[:length, None] * gain * [np.cos(angle), np.sin(angle)]


def arrange():
    keys = np.zeros((DURATION * RATE, 2))
    rhythm = np.zeros_like(keys)
    rng = np.random.default_rng(20261111)
    chords = [
        (38, [53, 57, 60, 64]),  # Dm9
        (43, [53, 57, 59, 64]),  # G13
        (36, [52, 55, 59, 62]),  # Cmaj9
        (45, [55, 59, 60, 64]),  # Am9
        (38, [53, 57, 60, 64]),
        (43, [53, 57, 59, 64]),
        (36, [52, 55, 59, 62]),
        (36, [52, 55, 57, 62]),  # C6/9
    ]
    melody = [
        [(1.58, 69), (2.52, 67)], [(0.58, 64), (2.58, 62), (3.5, 64)],
        [(1.58, 67), (2.54, 64)], [(0.58, 60), (2.58, 64), (3.5, 67)],
        [(1.58, 69), (2.52, 72)], [(0.58, 69), (2.58, 67), (3.5, 64)],
        [(1.58, 67), (2.54, 64)], [(1.58, 62), (2.54, 60)],
    ]
    for bar, (root, chord) in enumerate(chords):
        start = bar * 4 * BEAT
        for index, note in enumerate(chord):
            pan = (index - 1.5) * 0.20
            place(keys, piano(note, 2.37), start + index * 0.012, 0.075, pan)
            if bar < 7:
                place(keys, piano(note, 0.86), start + 2.25 * BEAT + index * 0.009, 0.030, pan)
        for offset, note in melody[bar]:
            place(keys, piano(note, 0.79), start + offset * BEAT, 0.066, 0.14)
        place(rhythm, bass(root, 1.06), start, 0.105)
        place(rhythm, bass(root + (7 if bar in [1, 5] else 0), 0.76), start + 2.23 * BEAT, 0.081)
        for offset, gain in [(0, 0.14), (2.22, 0.104)]:
            place(rhythm, kick(), start + offset * BEAT, gain)
        for offset in [1.037, 3.032]:
            place(rhythm, brush(rng), start + offset * BEAT, 0.082, -0.08)

    # A short, quiet reflection gives the piano some space without a bright wash.
    mix = keys + rhythm
    delay = round(0.116 * RATE)
    mix[delay:] += keys[:-delay, ::-1] * 0.12
    bandpass = butter(3, [34, 1850], "bandpass", fs=RATE, output="sos")
    mix = sosfilt(bandpass, mix, axis=0)
    return mix * soft_envelope(time_axis(DURATION), 0.32, 1.03)[:, None]


def write_wav(path, mix):
    pcm = np.round(np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
        output.writeframes(pcm.tobytes())


def measure(path):
    ffmpeg = os.environ.get("FFMPEG", "ffmpeg")
    result = subprocess.run(
        [ffmpeg, "-hide_banner", "-i", str(path), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
        check=True, capture_output=True, text=True,
    )
    return json.loads(re.findall(r"\{[\s\S]*?\}", result.stderr)[-1])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    output = parser.parse_args().output
    output.parent.mkdir(parents=True, exist_ok=True)
    mix = arrange()
    with tempfile.TemporaryDirectory() as temporary:
        draft = Path(temporary) / "draft.wav"
        write_wav(draft, mix)
        measured = measure(draft)
    gain_db = min(TARGET_LUFS - float(measured["input_i"]), MAX_PEAK_DBTP - float(measured["input_tp"]))
    write_wav(output, mix * 10 ** (gain_db / 20))
    final = measure(output)
    print(json.dumps({
        "file": str(output), "seconds": DURATION, "bpm": BPM,
        "integrated_lufs": float(final["input_i"]), "true_peak_dbtp": float(final["input_tp"]),
    }))


if __name__ == "__main__":
    main()
