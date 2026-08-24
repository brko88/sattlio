/**
 * videoTutorialsConfig.ts — sadržaj za javnu stranicu /video-uputstva
 *
 * Isti obrazac kao roadmapConfig.ts: stranica (VideoTutorials.tsx) samo crta
 * ovaj niz, sav sadržaj se mijenja OVDJE.
 *
 * Kako dodati novo uputstvo:
 * 1. Objavi video na YouTube-u.
 * 2. Iz URL-a (npr. https://www.youtube.com/watch?v=dQw4w9WgXcQ) uzmi dio iza
 *    "v=" — to je youtubeId (ovdje "dQw4w9WgXcQ").
 * 3. Dodaj novi objekat u niz ispod.
 *
 * Prazan niz = stranica prikazuje "uskoro" stanje (nema polomljenih embed-ova
 * dok se prvi video ne snimi).
 */
export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
}

export const VIDEO_TUTORIALS: VideoTutorial[] = [];
