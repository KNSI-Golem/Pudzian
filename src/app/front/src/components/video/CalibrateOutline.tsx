import React, { useState, useEffect } from 'react';
import { useCalibrate } from '@/hooks';
import { PoseDetectionResult } from '@/types';

interface CalibrateOutlineOptions {
    poseRef?: React.RefObject<PoseDetectionResult | null>;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
}

type CalibrationStatus = 'NO' | 'STARTED' | 'YES';

export function CalibrateOutline(options: CalibrateOutlineOptions) {
    const { poseRef, videoRef } = options;
    const { success } = useCalibrate({ poseRef, videoRef});

    const [calibrateStatus, setCalibrateStatus] = useState<CalibrationStatus>('NO');
    const [isVisible, setIsVisible] = useState<boolean>(true);

    useEffect(() => {

        if (success) {
            setCalibrateStatus('STARTED');

            const timer = setTimeout(() => {
                setCalibrateStatus('YES');
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            setCalibrateStatus('NO');
            setIsVisible(true);
        }
    }, [success]);

    useEffect(() => {
        if (calibrateStatus === 'YES') {
            const fadeTimer = setTimeout(() => {
                setIsVisible(false);
            }, 2000);

            return () => clearTimeout(fadeTimer);
        }
    }, [calibrateStatus]);

    if (!isVisible) return null;

    let outlineSrc;
    if (calibrateStatus === 'NO') {
        outlineSrc = '/calibrate/golem-outline-red.svg'
    } else if (calibrateStatus === 'STARTED') {
        outlineSrc ='/calibrate/golem-outline-orange.svg'
    } else if (calibrateStatus === 'YES') {
        outlineSrc = '/calibrate/golem-outline-green.svg'
    }

    return ( 
        <div className="golem-outline w-3/4 max-w-lg h-auto flex items-center justify-center">
            <img 
                src={outlineSrc} 
                alt={'Golem Outline'} 
                className="w-full h-full object-contain" 
            />
        </div>
    );
}