import {AnimateMappingConfig} from "@/types";

export const MEDIAPIPE_JOINTS_CONFIG: AnimateMappingConfig = {
    // Głowa
    nose: 0,
    eyeInnerLeft: 1,
    eyeLeft: 2,
    eyeOuterLeft: 3,
    eyeInnerRight: 4,
    eyeRight: 5,
    eyeOuterRight: 6,
    earLeft: 7,
    earRight: 8,
    mouthLeft: 9,
    mouthRight: 10,

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
export const JOINT_POINTS_CONFIG: Record<string, number[]> = {
    // Lewa strona anatomiczna MediaPipe kontroluje lewą stronę anatomiczną Modelu.
    // Dzięki temu, przy obróconym kamerą ujęciu, to co jest po Prawej stronie ekranu w kamerze (User Left)
    // kontroluje to co jest po Prawej stronie ekranu na robocie (Model Left).
    // Idealne, wprost 1:1 zachowanie odbicia przestrzennego bez krzyżowania.
    'arm_left': [MEDIAPIPE_JOINTS_CONFIG.shoulderLeft, MEDIAPIPE_JOINTS_CONFIG.armLeft, MEDIAPIPE_JOINTS_CONFIG.hipLeft],
    'forearm_left': [MEDIAPIPE_JOINTS_CONFIG.armLeft, MEDIAPIPE_JOINTS_CONFIG.foreArmLeft, MEDIAPIPE_JOINTS_CONFIG.shoulderLeft],
    'upleg_left': [MEDIAPIPE_JOINTS_CONFIG.hipLeft, MEDIAPIPE_JOINTS_CONFIG.upLegLeft, MEDIAPIPE_JOINTS_CONFIG.legLeft], // Zmieniono p2 na Kostkę dla poprawnego wylosowania płaszczyzny ugięcia
    'leg_left': [MEDIAPIPE_JOINTS_CONFIG.upLegLeft, MEDIAPIPE_JOINTS_CONFIG.legLeft, MEDIAPIPE_JOINTS_CONFIG.footLeft], // Zmieniono z hip na stopę
    'foot_left': [MEDIAPIPE_JOINTS_CONFIG.legLeft, MEDIAPIPE_JOINTS_CONFIG.footLeft, MEDIAPIPE_JOINTS_CONFIG.heelLeft],

    'arm_right': [MEDIAPIPE_JOINTS_CONFIG.shoulderRight, MEDIAPIPE_JOINTS_CONFIG.armRight, MEDIAPIPE_JOINTS_CONFIG.hipRight],
    'forearm_right': [MEDIAPIPE_JOINTS_CONFIG.armRight, MEDIAPIPE_JOINTS_CONFIG.foreArmRight, MEDIAPIPE_JOINTS_CONFIG.shoulderRight],
    'upleg_right': [MEDIAPIPE_JOINTS_CONFIG.hipRight, MEDIAPIPE_JOINTS_CONFIG.upLegRight, MEDIAPIPE_JOINTS_CONFIG.legRight], // LegRight
    'leg_right': [MEDIAPIPE_JOINTS_CONFIG.upLegRight, MEDIAPIPE_JOINTS_CONFIG.legRight, MEDIAPIPE_JOINTS_CONFIG.footRight],
    'foot_right': [MEDIAPIPE_JOINTS_CONFIG.legRight, MEDIAPIPE_JOINTS_CONFIG.footRight, MEDIAPIPE_JOINTS_CONFIG.heelRight]
};
