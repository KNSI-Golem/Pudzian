import React, { useState, useEffect } from 'react';
import { useCalibrate } from '@/hooks';
import { PoseDetectionResult } from '@/types';
import {CalibrationStatus} from '@/types/calibrate';

interface CalibrateOutlineOptions {
    calibrateStatus: CalibrationStatus;
}

export function CalibrateOutline(options: CalibrateOutlineOptions) {
    const { calibrateStatus } = options;

    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [outlineSrc, setOutlineSrc] = useState<string>('/calibrate/golem-outline-red.svg');


    useEffect(() => {
                if (calibrateStatus === 'NO') {
            setOutlineSrc('/calibrate/golem-outline-red.svg')
        } else if (calibrateStatus === 'STARTED') {
            setOutlineSrc('/calibrate/golem-outline-orange.svg')
        } else if (calibrateStatus === 'YES') {
            setOutlineSrc('/calibrate/golem-outline-green.svg')
        }
    }, [calibrateStatus]);

    useEffect(() => {
        if (calibrateStatus === 'YES') {
            const fadeTimer = setTimeout(() => {
                setIsVisible(false);
            }, 2000);

            return () => clearTimeout(fadeTimer);
        }

        if (calibrateStatus === 'NO') {
            setIsVisible(true);
        }
    }, [calibrateStatus]);

    if (!isVisible) return null;

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