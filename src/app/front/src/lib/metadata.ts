import type { Metadata } from 'next';

/**
 * Generates metadata for Next.js pages
 */
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

/**
 * App-specific metadata constants
 */
export const METADATA = {
  DEFAULT_TITLE: "Koło Naukowe AI GOLEM",
  DEFAULT_DESCRIPTION: "Sztuczna inteligencja i rozpoznawanie postawy ciała",
  KEYWORDS: ["AI", "Sztuczna Inteligencja", "MediaPipe", "Rozpoznawanie Postawy", "Computer Vision"],
} as const;