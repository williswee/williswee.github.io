import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  OffthreadVideo,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import mobbin from '../captures/mobbin/capture.json';

const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;
const SECONDS = 20;
const PLAYBACK_RATE = 1.3;

type Tap = {t: number; x: number; y: number};

function Taps({events}: {events: Tap[]}) {
  const time = useCurrentFrame() / FPS;
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {events.map((event) => {
        const delta = time - event.t / PLAYBACK_RATE;
        if (delta < -0.25 || delta > 0.42) return null;
        const approaching = delta < 0;
        const size = approaching
          ? interpolate(delta, [-0.25, 0], [31, 20], clamp)
          : interpolate(delta, [0, 0.42], [20, 62], clamp);
        const opacity = approaching
          ? interpolate(delta, [-0.25, -0.08], [0, 0.7], clamp)
          : interpolate(delta, [0, 0.42], [0.85, 0], clamp);
        return (
          <div
            key={event.t}
            style={{
              position: 'absolute',
              left: event.x * WIDTH / 540 - size / 2,
              top: event.y * HEIGHT / 960 - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              border: '2.5px solid white',
              background: approaching ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.06)',
              boxShadow: '0 0 0 1px rgba(0,0,0,.32)',
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function Walkthrough({source, music, events}: {source: string; music: string; events: Tap[]}) {
  return (
    <AbsoluteFill style={{backgroundColor: '#050b13'}}>
      <OffthreadVideo
        src={staticFile(source)}
        playbackRate={PLAYBACK_RATE}
        muted
        style={{width: '100%', height: '100%', objectFit: 'contain'}}
      />
      <Taps events={events} />
      <Audio src={staticFile(music)} />
    </AbsoluteFill>
  );
}

function Root() {
  return (
    <>
      <Composition
        id="MobbinWalkthrough"
        component={Walkthrough}
        defaultProps={{source: 'mobbin-raw.mp4', music: 'music-mobbin.wav', events: mobbin.events}}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={SECONDS * FPS}
      />
    </>
  );
}

registerRoot(Root);
