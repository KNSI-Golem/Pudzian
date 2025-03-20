import Video from 'next-video';
import Minimal from 'player.style/minimal/react';
import test from '/videos/test.mp4';

export default function Player() {
  return <Video src={test} theme={Minimal}/>;
}