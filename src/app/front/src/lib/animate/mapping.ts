import {AnimateMappingConfig, HAND_POINTS} from "@/types";

export const MEDIAPIPE_JOINTS_CONFIG: AnimateMappingConfig = {
    // Ręce
    handLeft: 19,
    handRight: 20,
    foreArmLeft: 15,     
    foreArmRight: 16,
    armLeft: 13,    
    armRight: 14,
    shoulderLeft: 11,    
    shoulderRight: 12,
    
    // Nogi
    hipLeft: 23,
    hipRight: 24,
    upLegLeft: 25,
    upLegRight: 26,
    legLeft: 27,
    legRight: 28,
    footLeft: 29,
    footRight: 30,
    heelLeft: 29,  // Używamy kostki jako punktu bazowego pięty dla uproszczenia
    heelRight: 30,
    footIndexLeft: 31,
    footIndexRight: 32,
}

// Format: [P0_Start, P1_End_Dla_Rurki, P2_Punkt_Referencyjny_Plaszyzny]
export const JOINT_POINTS_CONFIG: {[key: string]: number[]} = {
    // Ramiona (P0: Shoulder, P1: Elbow, P2: Hip - tułów wyznacza roll)
    'arm_left': [MEDIAPIPE_JOINTS_CONFIG.shoulderLeft, MEDIAPIPE_JOINTS_CONFIG.armLeft, MEDIAPIPE_JOINTS_CONFIG.hipLeft],
    'arm_right': [MEDIAPIPE_JOINTS_CONFIG.shoulderRight, MEDIAPIPE_JOINTS_CONFIG.armRight, MEDIAPIPE_JOINTS_CONFIG.hipRight],
    
    // Przedramiona (P0: Elbow, P1: Wrist, P2: Shoulder - ramię wyznacza roll)
    'forearm_left': [MEDIAPIPE_JOINTS_CONFIG.armLeft, MEDIAPIPE_JOINTS_CONFIG.foreArmLeft, MEDIAPIPE_JOINTS_CONFIG.shoulderLeft],
    'forearm_right': [MEDIAPIPE_JOINTS_CONFIG.armRight, MEDIAPIPE_JOINTS_CONFIG.foreArmRight, MEDIAPIPE_JOINTS_CONFIG.shoulderRight],
    
    // Nogi górne (P0: Hip, P1: Knee, P2: Drugie Biodro - płaska miednica wyznacza roll)
    'upleg_left': [MEDIAPIPE_JOINTS_CONFIG.hipLeft, MEDIAPIPE_JOINTS_CONFIG.upLegLeft, MEDIAPIPE_JOINTS_CONFIG.hipRight],
    'upleg_right': [MEDIAPIPE_JOINTS_CONFIG.hipRight, MEDIAPIPE_JOINTS_CONFIG.upLegRight, MEDIAPIPE_JOINTS_CONFIG.hipLeft],
    
    // Nogi dolne (P0: Knee, P1: Ankle, P2: Hip)
    'leg_left': [MEDIAPIPE_JOINTS_CONFIG.upLegLeft, MEDIAPIPE_JOINTS_CONFIG.legLeft, MEDIAPIPE_JOINTS_CONFIG.hipLeft],
    'leg_right': [MEDIAPIPE_JOINTS_CONFIG.upLegRight, MEDIAPIPE_JOINTS_CONFIG.legRight, MEDIAPIPE_JOINTS_CONFIG.hipRight],
    
    // Stopy (P0: Ankle, P1: Toe, P2: Knee)
    'foot_left': [MEDIAPIPE_JOINTS_CONFIG.legLeft, MEDIAPIPE_JOINTS_CONFIG.footIndexLeft, MEDIAPIPE_JOINTS_CONFIG.upLegLeft],
    'foot_right': [MEDIAPIPE_JOINTS_CONFIG.legRight, MEDIAPIPE_JOINTS_CONFIG.footIndexRight, MEDIAPIPE_JOINTS_CONFIG.upLegRight],
}
