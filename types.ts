export enum AppState {
  IDLE,
  CAPTURING,
  ANALYZING,
  SELECTING_TYPE,
  GENERATING_OVERLAY,
  RECOLORING,
  RESTYLING,
  RESULT,
  ERROR,
}

export type GlassType = 'vista' | 'sol';

export interface EyeCoordinates {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
}

export type FrameShape = 'Aviator' | 'Wayfarer' | 'Round' | 'Cat-eye' | 'Rectangular' | 'Oval' | 'Square' | 'Clubmaster' | 'Rimless';

export type FrameMaterial = 'metal' | 'acetate';
export type Gender = 'Hombre' | 'Mujer';

export interface FrameRecommendation {
  faceShape: string;
  recommendedFrameShape: FrameShape;
  recommendedMaterial: FrameMaterial;
  gender: Gender;
  recommendedColor: string;
  justification: string;
  eyeCoordinates: EyeCoordinates;
}