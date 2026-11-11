import React from 'react';
import {AbsoluteFill, Audio, Composition, OffthreadVideo, Series, registerRoot, staticFile} from 'remotion';
import shots from './gifgpt-shots.json';

function GifgptReel() {
  return (
    <AbsoluteFill>
      <Series>
        {shots.map(({id, frames, trimBefore}) => (
          <Series.Sequence key={id} durationInFrames={frames}>
            <OffthreadVideo
              src={staticFile(`gifgpt/${id}.mp4`)}
              trimBefore={trimBefore}
              playbackRate={1.3}
              muted
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          </Series.Sequence>
        ))}
      </Series>
      <Audio src={staticFile('music-gifgpt-lofi.wav')} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <Composition
    id="GifgptReel"
    component={GifgptReel}
    width={720}
    height={1280}
    fps={30}
    durationInFrames={shots.reduce((total, shot) => total + shot.frames, 0)}
  />
));
