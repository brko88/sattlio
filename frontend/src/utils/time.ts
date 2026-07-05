/**
 * Centralizovani utility za formatiranje vremena.
 * Koristi timezone iz tenant podešavanja — radi ispravno u svim vremenskim zonama.
 * 
 * VAŽNO: Backend čuva i vraća vrijeme kao UTC bez 'Z' sufiksa.
 * Dodajemo 'Z' ako nedostaje da browser ne tretira kao lokalno vrijeme.
 */

const ensureUTC = (iso: string): string => {
    if (iso.endsWith('Z') || iso.includes('+') || iso.includes('-', 10)) return iso;
    return iso + 'Z';
  };
  
  export const formatDateTime = (iso: string, tz: string = "Europe/Sarajevo"): string => {
    return new Date(ensureUTC(iso)).toLocaleString("bs-BA", {
      timeZone: tz,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  export const formatTime = (iso: string, tz: string = "Europe/Sarajevo"): string => {
    return new Date(ensureUTC(iso)).toLocaleTimeString("bs-BA", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  export const formatDate = (iso: string, tz: string = "Europe/Sarajevo"): string => {
    return new Date(ensureUTC(iso)).toLocaleDateString("bs-BA", {
      timeZone: tz,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  
  /**
   * Pozicioniranje termina u kalendaru (sati i minute u lokalnom timezone-u).
   */
  export const getLocalHoursMinutes = (iso: string, tz: string = "Europe/Sarajevo"): { hours: number; minutes: number } => {
    const d = new Date(ensureUTC(iso));
    const localStr = d.toLocaleString("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const [hours, minutes] = localStr.split(":").map(Number);
    return { hours, minutes };
  };