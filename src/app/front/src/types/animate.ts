import {PoseDetectionResult} from "@/types/mediapipe";

export type AnimateProps =  {
    poseResultRef: PoseDetectionResult;
}

export type ModelAnimConfig = {
  hips: string;
  spine: string;
  spine1: string;
  spine2: string;
  neck: string;
  head: string;
  shoulderLeft: string;
  shoulderRight: string;
  upLegLeft: string;
  legLeft: string;
  footLeft: string;
  upLegRight: string;
  legRight: string;
  footRight: string;

  armLeft: string;
  foreArmLeft: string;
  handLeft: string;
  
  armRight: string;
  foreArmRight: string;
  handRight: string;

  thumbThumb1Left: string;
  thumbThumb2Left: string;
  thumbThumb3Left: string;
  index1Left: string;
  index2Left: string;
  index3Left: string;
  middle1Left: string;
  middle2Left: string;
  middle3Left: string;
  ring1Left: string;
  ring2Left: string;
  ring3Left: string;
  pinky1Left: string;
  pinky2Left: string;
  pinky3Left: string;

  thumbThumb1Right: string;
  thumbThumb2Right: string;
  thumbThumb3Right: string;
  index1Right: string;
  index2Right: string;
  index3Right: string;
  middle1Right: string;
  middle2Right: string;
  middle3Right: string;
  ring1Right: string;
  ring2Right: string;
  ring3Right: string;
  pinky1Right: string;
  pinky2Right: string;
  pinky3Right: string;
}
