import type { Metadata } from 'next';


export function generatePageMetadata(
  title: string,
  description: string,
  additionalMetadata?: Partial<Metadata>
): Metadata {
  return {
    title,
    description,
    ...additionalMetadata,
  };
}


export const METADATA = {
  DEFAULT_TITLE: "Koło Naukowe AI GOLEM",
  DEFAULT_DESCRIPTION: "Sztuczna inteligencja i detekcja pozy",
  KEYWORDS: ["AI", "Sztuczna Inteligencja", "MediaPipe", "Detekcja pozy", "Computer Vision"],
} as const;