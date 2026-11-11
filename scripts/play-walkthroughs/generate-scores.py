#!/usr/bin/env python3
"""Generate original sample-free 20-second Play walkthrough soundtracks.

All melodies, drums, and instruments are synthesized here from deterministic
oscillators/noise. No recordings, loops, samples, or external music are used.
Requires NumPy and SciPy; FFmpeg performs transparent two-pass loudness gain.
"""
from pathlib import Path
import hashlib
import json
import math
import os
import re
import subprocess
import wave

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
OUT = ROOT / "out" / "audio"
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
SR = 48_000
DURATION = 20
BPM = 120
BEAT = 60 / BPM
N = SR * DURATION
RNG = np.random.default_rng(20261111)


def midi(note):
    return 440 * 2 ** ((note - 69) / 12)


def filt(signal, hz, kind="lowpass", order=2):
    return sosfilt(butter(order, hz, btype=kind, fs=SR, output="sos"), signal)


def fade_env(length, attack=0.004, release=0.04):
    env = np.ones(length)
    a = min(length, int(attack * SR))
    r = min(length, int(release * SR))
    if a:
        env[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        env[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def pluck(note, length=0.45, bright=False):
    t = np.arange(int(length * SR)) / SR
    freq = midi(note)
    y = np.zeros_like(t)
    # Band-limited additive pluck, with faster decay on upper partials.
    for partial in range(1, 8 if bright else 6):
        amp = (0.7 if partial == 1 else 0.42 / partial ** 1.65)
        detune = 1 + (partial - 1) * 0.0005
        decay = (6.6 if bright else 4.5) + partial * (1.7 if bright else 1.4)
        y += amp * np.sin(2 * np.pi * freq * partial * detune * t) * np.exp(-t * decay)
    if bright:
        # Quiet tuned bell adds a rounded, playful transient without a sharp beep.
        y += 0.11 * np.sin(2 * np.pi * freq * t + 0.7 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 20)) * np.exp(-t * 11)
    return y * fade_env(len(y), 0.003 if bright else 0.006, 0.055)


def epiano(note, length=1.6):
    t = np.arange(int(length * SR)) / SR
    f = midi(note)
    y = np.sin(2 * np.pi * f * t + 0.20 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 5))
    y += 0.15 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 6)
    return y * np.exp(-t * 1.9) * fade_env(len(t), .018, .20)


def bass(note, length=.24, bright=False):
    t = np.arange(int(length * SR)) / SR
    f = midi(note)
    y = 0.90 * np.sin(2 * np.pi * f * t) + .18 * np.sin(2 * np.pi * f * 2 * t)
    if bright:
        y += .065 * np.sin(2 * np.pi * f * 3 * t)
    return y * np.exp(-t * 3.4) * fade_env(len(t), .006, .055)


def kick():
    t = np.arange(int(.28 * SR)) / SR
    f = 46 + 82 * np.exp(-t * 34)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    y += .035 * filt(RNG.normal(size=len(t)), 2000) * np.exp(-t * 110)
    return y * fade_env(len(t), .001, .035)


def clap():
    t = np.arange(int(.17 * SR)) / SR
    noise = filt(filt(RNG.normal(size=len(t)), 950, "highpass"), 7000)
    env = np.exp(-t * 35)
    env += .4 * np.exp(-np.maximum(0, t - .011) * 80) * (t > .011)
    env += .3 * np.exp(-np.maximum(0, t - .023) * 70) * (t > .023)
    return noise * env * .37 * fade_env(len(t), .001, .03)


def hat(opened=False):
    dur = .16 if opened else .062
    t = np.arange(int(dur * SR)) / SR
    noise = filt(filt(RNG.normal(size=len(t)), 6100, "highpass"), 11200)
    return noise * np.exp(-t * (24 if opened else 65)) * fade_env(len(t), .001, .015)


def click():
    t = np.arange(int(.05 * SR)) / SR
    return (.6 * np.sin(2 * np.pi * 980 * t) + .25 * np.sin(2 * np.pi * 1470 * t)) * np.exp(-t * 105) * fade_env(len(t), .001, .01)


def add(track, signal, start, gain=1., pan=0.):
    begin = int(round(start * SR))
    if begin < 0 or begin >= N:
        return
    length = min(len(signal), N - begin)
    # Equal-power pan, preserving the centre image of bass and kick.
    angle = (pan + 1) * np.pi / 4
    track[begin:begin + length, 0] += signal[:length] * gain * np.cos(angle)
    track[begin:begin + length, 1] += signal[:length] * gain * np.sin(angle)


def render(name):
    gif = name == "gifgpt"
    music = np.zeros((N, 2), dtype=np.float64)
    lead_bus = np.zeros_like(music)
    drum_bus = np.zeros_like(music)
    # Ten original two-second bars. Last bar is a clear tonic resolution.
    if gif:
        chords = [[53,57,60,64],[50,53,57,60],[46,53,58,60],[48,55,57,62],
                  [53,57,60,64],[50,53,57,60],[46,53,57,62],[48,55,57,62],
                  [46,53,57,60],[53,57,60,62]]
        roots = [41,38,34,36,41,38,34,36,34,41]
        motifs = [
            [(0,77),(.5,81),(.75,84),(1.5,81),(2,79),(2.5,77),(3.25,76)],
            [(0,77),(.75,81),(1.5,84),(2,86),(2.75,84),(3.5,81)],
            [(0,82),(.5,81),(1.25,77),(2,79),(2.5,81),(3.25,77)],
            [(0,79),(.75,76),(1.5,79),(2.25,81),(3,79),(3.5,76)],
        ]
    else:
        chords = [[50,57,61,66],[47,54,57,62],[43,50,54,59],[45,52,54,61],
                  [50,57,61,66],[47,54,57,62],[43,50,54,59],[45,52,54,61],
                  [52,55,59,62],[50,57,61,64]]
        roots = [38,35,31,33,38,35,31,33,40,38]
        motifs = [
            [(0,74),(.75,81),(1.5,78),(2,76),(2.75,73),(3.5,76)],
            [(0,78),(.5,81),(1.25,85),(2,83),(2.75,81),(3.5,78)],
            [(0,79),(.75,78),(1.5,74),(2.25,78),(3,81)],
            [(0,76),(.5,73),(1.5,76),(2.25,78),(3,76),(3.5,73)],
        ]
    for bar, chord in enumerate(chords):
        at = bar * 4 * BEAT
        for idx, note in enumerate(chord):
            add(music, epiano(note,1.85 if bar == 9 else 1.6), at + idx * .007, .085 if gif else .105, (idx - 1.5) * .30)
        # Short chord stabs off the beat support motion while leaving UI taps clear.
        if bar < 9:
            for pulse in ([1.5,3] if gif else [2.5]):
                for idx,note in enumerate(chord[1:]):
                    add(music, pluck(note+12,.22,gif), at+pulse*BEAT, .045, (idx-1)*.35)
        bass_pattern = [(0,0,.34),(1.5,0,.20),(2,0,.24),(2.75,12,.16),(3.5,0,.17)] if gif else [(0,0,.36),(1.5,0,.20),(2.5,0,.28),(3.5,7,.16)]
        if bar == 9:
            bass_pattern = [(0,0,.72),(2,0,.50)]
        for offset, interval, dur in bass_pattern:
            add(music,bass(roots[bar]+interval,dur,gif),at+offset*BEAT,.22)
        motif = motifs[bar%4]
        if bar == 8:
            motif = [(0,82 if gif else 79),(.75,81 if gif else 78),(1.5,79 if gif else 76),(2.5,77 if gif else 74),(3.5,76 if gif else 73)]
        if bar == 9:
            motif = [(0,77 if gif else 74),(1,81 if gif else 78),(2,84 if gif else 81),(2.75,77 if gif else 74)]
        for idx,(offset,note) in enumerate(motif):
            add(lead_bus,pluck(note,.46 if gif else .57,gif),at+offset*BEAT,.23 if gif else .21,math.sin((bar*7+idx)*1.4)*.24)
        kicks = [0,1.5,2,2.75,3.5] if gif else [0,1,2,3]
        if bar == 9:
            kicks = [0,2]
        for offset in kicks:
            add(drum_bus,kick(),at+offset*BEAT,.33 if gif else .30)
        for offset in ([1,3] if bar < 9 else [1]):
            add(drum_bus,clap(),at+offset*BEAT,.19 if gif else .155,0.025)
        for step in range(8 if bar < 9 else 5):
            offset = step*.5
            add(drum_bus,hat(opened=step in [3,7]),at+offset*BEAT,.14 if step%2 else .075,(-1 if step%2 else 1)*.35)
        if gif and bar in [1,3,5,7]:
            for offset in [3.25,3.75]:
                add(drum_bus,hat(),at+offset*BEAT,.065,-.20)
        if bar in [0,2,4,6,8]:
            add(drum_bus,click(),at,.09 if gif else .065,-.25)
    # Small ping-pong delays give the pluck room, without washing out the cuts.
    music += lead_bus
    for seconds, gain in [(BEAT*.75,.115),(BEAT*1.5,.052)]:
        delay = int(seconds*SR)
        music[delay:,0] += lead_bus[:-delay,1]*gain
        music[delay:,1] += lead_bus[:-delay,0]*gain
    # Very low early reflections make a dry synthetic source feel less sterile.
    for seconds,gain in [(.037,.032),(.061,.025),(.094,.015)]:
        delay = int(seconds*SR)
        music[delay:] += music[:-delay,::-1]*gain
    music += drum_bus
    music = np.tanh(music*1.12)/1.12
    # A quick start is click-free; quarter-second final fade lands exactly at 20s.
    music -= music.mean(axis=0,keepdims=True)
    music[:int(.007*SR)] *= np.linspace(0,1,int(.007*SR))[:,None]
    music[-int(.25*SR):] *= np.cos(np.linspace(0,np.pi/2,int(.25*SR)))[:,None]**2
    music *= .87/max(np.max(np.abs(music)),1e-12)
    raw = OUT/f"music-{name}-raw.wav"
    write_wav(raw,music)
    return raw


def write_wav(path,signal):
    pcm=np.round(np.clip(signal,-1,1)*32767).astype("<i2")
    with wave.open(str(path),"wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def loudness(path):
    result=subprocess.run([FFMPEG,"-hide_banner","-i",str(path),"-af","loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json","-f","null","-"],text=True,capture_output=True,check=True)
    return json.loads(re.findall(r"\{[\s\S]*?\}",result.stderr)[-1])


def normalize(raw,name):
    analysis=loudness(raw)
    options=("loudnorm=I=-16:TP=-1.5:LRA=8:linear=true:"
        f"measured_I={analysis['input_i']}:measured_TP={analysis['input_tp']}:"
        f"measured_LRA={analysis['input_lra']}:measured_thresh={analysis['input_thresh']}:"
        f"offset={analysis['target_offset']}")
    target=PUBLIC/f"music-{name}.wav"
    subprocess.run([FFMPEG,"-hide_banner","-loglevel","error","-y","-i",str(raw),"-af",options,"-ar",str(SR),"-ac","2","-c:a","pcm_s16le",str(target)],check=True)
    measured=loudness(target)
    with wave.open(str(target),"rb") as w:
        frames=w.getnframes()
        samples=np.frombuffer(w.readframes(frames),dtype="<i2").reshape(-1,2)/32768
    spectrum=np.abs(np.fft.rfft(samples.mean(axis=1)))**2
    hz=np.fft.rfftfreq(len(samples),1/SR)
    bands={f"{lo}-{hi}Hz":round(float(spectrum[(hz>=lo)&(hz<hi)].sum()/spectrum.sum()*100),2) for lo,hi in [(20,120),(120,500),(500,2000),(2000,6000),(6000,20000)]}
    report={"file":str(target),"duration_seconds":frames/SR,"sample_rate":SR,"channels":2,"bpm":BPM,"bars":10,
        "integrated_lufs":float(measured["input_i"]),"true_peak_dbtp":float(measured["input_tp"]),"loudness_range_lu":float(measured["input_lra"]),
        "sample_peak_dbfs":round(float(20*np.log10(np.max(np.abs(samples)))),3),"rms_dbfs":round(float(20*np.log10(np.sqrt(np.mean(samples**2)))),3),
        "stereo_correlation":round(float(np.corrcoef(samples.T)[0,1]),4),"spectral_power_bands_percent":bands,
        "sha256":hashlib.sha256(target.read_bytes()).hexdigest(),"origin":"Original deterministic synthesized notes, percussion and oscillators; no external samples."}
    assert frames == N
    assert np.max(np.abs(samples)) < 1
    assert abs(report["integrated_lufs"]+16) < .6
    assert report["true_peak_dbtp"] <= -1.45
    return report


if __name__ == "__main__":
    PUBLIC.mkdir(exist_ok=True)
    OUT.mkdir(parents=True,exist_ok=True)
    reports=[]
    for name in ["gifgpt","mobbin"]:
        reports.append(normalize(render(name),name))
    (OUT/"scores-report.json").write_text(json.dumps(reports,indent=2)+"\n")
    print(json.dumps(reports,indent=2))
