/**
 * roadmapConfig.ts — JEDINI izvor sadržaja za javni roadmap
 *
 * Koriste ga i mini sekcija na landing stranici (Landing.tsx → RoadmapSection)
 * i puna stranica /roadmap (Roadmap.tsx). Ažuriranje roadmapa = izmjena OVOG
 * fajla; komponente se ne diraju.
 *
 * PRAVILA (dogovoreno 03.08.2026.):
 * 1. Samo DVA kvartala nose datum (tekući + sljedeći). Sve dalje ide u
 *    "future"/"ideas" BEZ datuma — što dalje planiraš, veća je šansa da ćeš
 *    prioritete promijeniti nakon razgovora sa stvarnim korisnicima, a javno
 *    obećan kvartal se teško povlači. Isti princip stoji i u docs/15.
 * 2. Ovo je MARKETING dokument, ne interni checklist — ništa sigurnosno,
 *    infrastrukturno ni tehnički dug ovdje ne ide.
 * 3. Jezik vlasnika salona, ne razvojni žargon ("podsjetnik na termin", ne
 *    "background job za notifikacije").
 * 4. U "released" ide SAMO ono što stvarno radi u aplikaciji — provjereno
 *    protiv koda, ne po sjećanju. Javni roadmap koji tvrdi nepostojeće je
 *    gori od nikakvog.
 */

/** Status stavke. Boja NIJE jedini nosilac informacije — svaki status ima i
 *  tekstualnu oznaku (WCAG AA, Dok. 24 sekcija 16). */
export type RoadmapStatus = "released" | "in_progress" | "planned" | "future" | "idea";

export const ROADMAP_STATUS_META: Record<
  RoadmapStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  released: {
    label: "Završeno",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  in_progress: {
    label: "U izradi",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  planned: {
    label: "Planirano",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  future: {
    label: "Vizija",
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
  idea: {
    label: "Razmatramo",
    dotClass: "bg-slate-300",
    badgeClass: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

export interface RoadmapItem {
  /** Kratak naziv — ono što korisnik vidi kao stavku */
  title: string;
  /** Jedna rečenica objašnjenja, jezikom vlasnika salona */
  description?: string;
  /** Istaknuto u mini roadmapu na landing stranici (max 5 po grupi) */
  highlight?: boolean;
}

export interface RoadmapGroup {
  /** Stabilan ključ za React key i buduće linkovanje (#released) */
  key: string;
  /** Naslov grupe */
  title: string;
  /** Vremenska oznaka — namjerno prazna za future/ideas */
  period?: string;
  status: RoadmapStatus;
  /** Uvodna rečenica grupe */
  intro?: string;
  items: RoadmapItem[];
}

export const ROADMAP: RoadmapGroup[] = [
  {
    key: "released",
    title: "Dostupno danas",
    period: "Q2–Q3 2026",
    status: "released",
    intro: "Sve ispod radi u aplikaciji i koriste ga saloni u beta fazi.",
    items: [
      {
        title: "Online rezervacije i kalendar",
        description: "Svi termini na jednom mjestu, pregledno po danu.",
        highlight: true,
      },
      {
        title: "Automatska provjera preklapanja",
        description: "Sistem ne dozvoljava dvije rezervacije u isto vrijeme kod istog zaposlenog.",
        highlight: true,
      },
      {
        title: "Javni profil salona",
        description: "Vlastita stranica na kojoj klijenti vide usluge i zakazuju termin.",
        highlight: true,
      },
      {
        title: "Klijenti rezervišu sami",
        description: "Bez poziva i dopisivanja — klijent bira slobodan termin i potvrdi ga.",
        highlight: true,
      },
      {
        title: "Aplikacija na telefonu",
        description: "Dodaje se na početni ekran i radi kao mobilna aplikacija.",
        highlight: true,
      },
      {
        title: "Zaposleni, usluge i klijenti",
        description: "Kompletna evidencija tima, cjenovnika i baze klijenata.",
      },
      {
        title: "Radno vrijeme sa pauzama",
        description: "Individualno radno vrijeme po zaposlenom, uključujući pauze.",
      },
      {
        title: "Specijalni dani",
        description: "Praznici, godišnji odmor i izmijenjeno radno vrijeme.",
      },
      {
        title: "Automatsko obavještenje klijentima",
        description: "Kad promjena rasporeda pogodi zakazane termine, klijenti dobiju email.",
      },
      {
        title: "Moji termini za klijente",
        description: "Klijent vidi svoje termine u svim salonima i može ih otkazati.",
      },
      {
        title: "Dijeljenje linka salona",
        description: "Link za rezervacije se dijeli jednim klikom na društvene mreže.",
      },
      {
        title: "Više salona sa jednog naloga",
        description: "Ako vodite više lokacija ili poslova, prebacujete se bez odjave.",
      },
      {
        title: "Sigurna prijava i verifikacija emaila",
        description: "Podaci svakog salona su potpuno odvojeni od ostalih.",
      },
      {
        title: "Provjera legitimnosti salona",
        description: "Svaki salon prolazi provjeru po JIB-u prije verifikacije.",
      },
      {
        title: "Besplatan probni period",
        description: "Bez obaveze i bez unosa kartice, besplatno tokom cijelog beta perioda.",
      },
      {
        title: "Prijava problema iz aplikacije",
        description: "Formular sa mogućnošću slanja slike ekrana — podrška odgovara direktno.",
      },
      {
        title: "Podsjetnici na termin",
        description: "Automatski email klijentu prije termina — manje zaboravljenih dolazaka.",
        highlight: true,
      },
    ],
  },
  {
    key: "q4-2026",
    title: "Sljedeće na redu",
    period: "Q4 2026",
    status: "in_progress",
    intro: "Na ovome se radi upravo sada.",
    items: [
      {
        title: "Pomjeranje termina",
        description: "Izmjena vremena postojeće rezervacije bez otkazivanja i ponovnog unosa.",
        highlight: true,
      },
      {
        title: "Istorija posjeta klijenta",
        description: "Pregled svih ranijih termina jednog klijenta na njegovom profilu.",
        highlight: true,
      },
      {
        title: "Izvoz podataka",
        description: "Preuzimanje rezervacija i klijenata u Excel/CSV formatu.",
        highlight: true,
      },
      {
        title: "Video uputstva i baza znanja",
        description: "Kratki vodiči kroz svaku funkciju platforme.",
      },
      {
        title: "Online plaćanje pretplate",
        description: "Plaćanje karticom, bez uplatnica i ručnog praćenja.",
      },
      {
        title: "Evidencija administrativnih radnji",
        description: "Transparentan zapis izmjena na nivou platforme.",
      },
    ],
  },
  {
    key: "q1-2027",
    title: "Planirano",
    period: "Q1 2027",
    status: "planned",
    items: [
      {
        title: "Mobilna aplikacija",
        description: "Android, zatim iOS — puna podrška za rad u pokretu.",
        highlight: true,
      },
      {
        title: "Sedmični i mjesečni kalendar",
        description: "Pored dnevnog pregleda, širi uvid u popunjenost.",
        highlight: true,
      },
      {
        title: "Lista čekanja",
        description: "Kad se termin oslobodi, klijenti sa liste dobiju priliku prvi.",
        highlight: true,
      },
      {
        title: "Napredni izvještaji",
        description: "Promet po zaposlenom, najtraženije usluge, iskorištenost termina.",
        highlight: true,
      },
      {
        title: "Termin u ličnom kalendaru",
        description: "Dodavanje rezervacije u Google, Apple ili Outlook kalendar.",
      },
      {
        title: "Interne napomene",
        description: "Bilješke uz termin ili klijenta, vidljive samo zaposlenima.",
      },
      {
        title: "Više jezika",
        description: "Engleski, uz postojeći jezik platforme.",
      },
    ],
  },
  {
    key: "future",
    title: "Vizija",
    // Namjerno bez perioda — vidi PRAVILO 1 na vrhu fajla.
    status: "future",
    intro:
      "Pravac u kojem Sattlio ide. Redoslijed zavisi od toga šta saloni budu stvarno tražili — zato ovdje nema datuma.",
    items: [
      { title: "Marketplace", description: "Pretraga salona po gradu, usluzi i lokaciji." },
      { title: "Sistem recenzija", description: "Ocjene i utisci klijenata na profilu salona." },
      { title: "Program preporuke", description: "Pogodnosti za salone koji dovedu nove korisnike." },
      { title: "Loyalty program i kuponi", description: "Nagrađivanje stalnih klijenata, promo kodovi." },
      { title: "Poklon kartice", description: "Usluga kao poklon, plaćena unaprijed." },
      { title: "SMS obavještenja", description: "Podsjetnici porukom, za klijente bez pametnog telefona." },
      { title: "WhatsApp obavještenja", description: "Podsjetnici kanalom koji klijenti već koriste." },
      { title: "Plaćanje rezervacije unaprijed", description: "Depozit ili puna cijena pri zakazivanju — manje nedolazaka." },
      { title: "Više lokacija po salonu", description: "Centralni pregled za lance sa više poslovnica." },
      { title: "Više vlasnika i naprednije uloge", description: "Precizne dozvole po osobi." },
      { title: "Galerija radova", description: "Fotografije radova na javnom profilu salona." },
      { title: "Napredna analitika", description: "Predviđanje potražnje i preporuke za raspored." },
      { title: "AI pomoćnik", description: "Pomoć pri rasporedu i odgovaranju klijentima." },
      { title: "API za integracije", description: "Povezivanje sa drugim alatima koje salon koristi." },
      { title: "Lokalni načini plaćanja", description: "Podrška za platne sisteme u regionu." },
      {
        title: "Nove djelatnosti",
        description: "Ordinacije, sportski centri, rent-a-car, smještaj — isti sistem, drugi posao.",
      },
    ],
  },
  {
    key: "ideas",
    title: "Ideje koje razmatramo",
    status: "idea",
    intro: "Još nisu planirane. Ako vam neka od njih treba — javite, to mijenja prioritete.",
    items: [
      {
        title: "AI agent za rezervacije preko WhatsApp/Viber",
        description: "Klijent zakazuje porukom, bez otvaranja aplikacije — agent provjeri slobodan termin i rezerviše direktno u vaš kalendar.",
      },
      {
        title: "Pretvori rokovnik u digitalni kalendar",
        // Bez konkretne brojke (npr. "30 sekundi") - vidi razgovor 03.08.2026.:
        // uparivanje rukom pisanih zapisa sa stvarnim zaposlenim/uslugom/
        // klijentom + prolazak kroz sve postojece provjere (radno vrijeme,
        // preklapanje) je mnogo teze nego "OCR procita tekst", pa konkretno
        // vremensko obecanje na javnoj stranici nosi rizik da ga ne ispunimo.
        description: "Uslikaj svoj rokovnik. AI prepozna termine i sam ih prenese u aplikaciju.",
      },
      { title: "Glasovno zakazivanje" },
      { title: "Video konsultacije" },
      { title: "Prodaja proizvoda kroz aplikaciju" },
      { title: "Digitalni obrasci i saglasnosti" },
      { title: "Povezivanje sa fiskalnim sistemima" },
      { title: "Edukacije i online kursevi" },
    ],
  },
];

/** Grupe koje se prikazuju u mini roadmapu na landing stranici. */
export const MINI_ROADMAP_KEYS = ["released", "q4-2026", "q1-2027"] as const;

/** Stavke označene sa highlight — za mini prikaz (max 5 po grupi). */
export function miniRoadmapItems(group: RoadmapGroup): RoadmapItem[] {
  return group.items.filter((item) => item.highlight).slice(0, 5);
}

/** Poziv na akciju ispod roadmapa — faza 1 vodi na postojeći support kanal
 *  (formular + email); pravo glasanje za funkcionalnosti je zaseban feature. */
export const ROADMAP_CTA = {
  title: "Nedostaje vam nešto?",
  description:
    "Prioriteti se mijenjaju na osnovu onoga što saloni stvarno traže. Ako vam neka funkcionalnost treba, javite nam — to ima težinu.",
  buttonLabel: "Predložite funkcionalnost",
} as const;
