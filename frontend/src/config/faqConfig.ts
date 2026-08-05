/**
 * faqConfig.ts — sadržaj za /faq (unutar aplikacije, vlasnik + radnik)
 *
 * Isti obrazac kao roadmapConfig.ts/videoTutorialsConfig.ts: FAQ.tsx samo
 * crta ovaj niz, sav sadržaj se mijenja OVDJE.
 *
 * youtubeId je opciono — kad se snimi video uputstvo za neko pitanje (vidi
 * config/videoTutorialsConfig.ts za javnu /video-uputstva stranicu), isti
 * youtubeId se može upisati ovdje da se embed prikaže unutar odgovora.
 * Dok god je undefined, prikazuje se samo tekstualni odgovor.
 */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  youtubeId?: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "kako-klijenti-rezervisu",
    question: "Kako klijenti sami rezervišu termin?",
    answer:
      "Svaki salon ima javnu stranicu (sattlio.com/naziv-vaseg-salona) sa spiskom zaposlenih i usluga. Podijelite taj link sa klijentima (npr. na Instagram profilu ili Google Business stranici) — oni biraju zaposlenog, uslugu i slobodan termin, bez zvanja telefonom.",
  },
  {
    id: "status-termina",
    question: "Šta znače statusi termina?",
    answer:
      "Zakazano — nov termin, čeka se odvijanje. Završeno — termin je odrađen. Otkazano — otkazano od strane klijenta ili osoblja. Isteklo — termin je prošao bez ikakve akcije (sistem ga automatski tako obilježi na kraju dana). Nije se pojavio — klijent nije došao, osoblje ga ručno tako obilježi.",
  },
  {
    id: "nedolazak",
    question: "Šta ako klijent ne dođe na termin?",
    answer:
      "U Kalendaru ili Rezervacijama otvorite termin i kliknite „Nije se pojavio”. Ako termin ostane bez ikakve akcije, sistem ga sam obilježi kao „Isteklo” na kraju dana — bilo koji od ta dva statusa kasnije možete ručno promijeniti.",
  },
  {
    id: "radno-vrijeme",
    question: "Kako se podešava radno vrijeme?",
    answer:
      "U meniju „Radno vrijeme” — vlasnik podešava radno vrijeme svih zaposlenih, a zaposleni kojima je to omogućeno mogu sami mijenjati svoje. Tu se dodaju i specijalni dani (praznik, godišnji odmor, izmijenjeno radno vrijeme).",
  },
  {
    id: "usluge-zaposleni",
    question: "Kako dodam uslugu ili novog zaposlenog?",
    answer:
      "Ovo radi vlasnik: „Usluge” za cijene i trajanje, „Zaposleni” za dodavanje/uklanjanje tima i uključivanje online rezervacija po zaposlenom.",
  },
  {
    id: "prijava-problema",
    question: "Našao/la sam grešku ili imam prijedlog — šta sad?",
    answer:
      "Kliknite „Prijavi problem” u meniju — opis i eventualni screenshot idu direktno podršci. Za pregled šta je već planirano, pogledajte javni roadmap na sattlio.com/roadmap.",
  },
];
