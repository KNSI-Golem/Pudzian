# ciąg kalkulacji wygląda następująco

1. usePoseDetection/useMediaPipe
    - poseRef
2. useThreeScene
    - używa `process.ts` do calc kątów itd (np. linia 107 używa `processAnimateJoint)
    - używane są również utils i wogóle.
    - ogólnie z folderu components/lib/animate