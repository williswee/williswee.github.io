import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ChefBobDemo} from './ChefBobDemo';

const Root = () => <Composition id="ChefBobDemo" component={ChefBobDemo} durationInFrames={960} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
