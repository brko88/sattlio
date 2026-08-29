/**
 * blogConfig.ts — sadržaj javnog bloga (/blog)
 *
 * Isti obrazac kao roadmapConfig.ts/faqConfig.ts: Blog.tsx i BlogPost.tsx
 * samo crtaju ovaj niz, sav tekst se mijenja OVDJE, nikad u komponentama.
 *
 * Redoslijed niza = redoslijed na listi (/blog) — najnoviji prvi.
 */
export interface BlogListItem {
  title: string;
  text: string;
}

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: BlogListItem[] };

export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  /** ISO datum (YYYY-MM-DD) — prikazan na listi i na samom postu. */
  publishedAt: string;
  /** Kratak uvod za listu postova (/blog) — ne mora biti prva rečenica teksta. */
  excerpt: string;
  blocks: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "online-zakazivanje-vs-telefon",
    title: "Online zakazivanje vs. zakazivanje telefonom — šta se isplati vlasniku salona",
    metaDescription:
      "Telefon djeluje jednostavnije, ali svaki poziv ima skrivenu cijenu. Poređenje online zakazivanja i klasičnog telefonskog termina za vlasnike salona.",
    publishedAt: "2026-08-29",
    excerpt:
      "Telefon je besplatan, ali nije bez cijene — evo šta zakazivanje preko telefona stvarno košta salon, i šta se dobije prelaskom na online.",
    blocks: [
      {
        type: "paragraph",
        text: "Telefon je star, provjeren način zakazivanja — svi ga znaju, ne traži nikakvu promjenu navika. Ali \"besplatan\" nije isto što i \"bez cijene\". Evo šta telefonsko zakazivanje stvarno košta, a šta se dobije prelaskom na online.",
      },
      {
        type: "list",
        items: [
          {
            title: "Vrijeme koje krade od posla.",
            text: "Svaki poziv za zakazivanje znači da frizer/kozmetičar stane usred klijenta, opere ruke, odgovori, upiše termin u rokovnik ili telefon, vrati se poslu. Pomnožite to sa brojem poziva dnevno — to je vrijeme koje ne radi ništa produktivno, a plaća se satima rada.",
          },
          {
            title: "Pozivi van radnog vremena su izgubljeni.",
            text: "Neko ko poželi termin u 22h, nedjeljom, ili dok ste na godišnjem — jednostavno neće zakazati. Online rezervacija radi 0-24, bez pauze, bez \"javite se u radno vrijeme\".",
          },
          {
            title: "Greške u prenosu informacije.",
            text: "\"Rekao sam utorak u tri\" naspram \"mislio sam da si rekla četvrtak\" — klasičan nesporazum koji se dešava kad se termin prenosi usmeno i upisuje ručno. Kad klijent sam klikne na tačan datum i sat na ekranu, ta vrsta greške praktično nestaje.",
          },
          {
            title: "Nema uvida u istoriju.",
            text: "Ko je bio zadnji put, šta je radio, kad mu \"dolazi red\" za novu turu — sve to teško je pratiti iz rokovnika ili niza SMS poruka. Kad su svi termini na jednom mjestu, ovi podaci su tu kad zatrebaju, bez prekopavanja starih poruka.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Ovo ne znači da telefon treba potpuno ukinuti — neki klijenti (posebno stariji) će uvijek radije nazvati, i to je u redu. Poenta je da online opcija POSTOJI za sve ostale, umjesto da svaki termin prolazi kroz vas lično.",
      },
      {
        type: "paragraph",
        text: "Sattlio uz rad salona dodaje javnu stranicu za rezervaciju (klijent bira uslugu, radnika i termin sam), dok vi i dalje možete ručno ubaciti termin za onog ko ipak nazove telefonom — oba kanala vode u isti kalendar.",
      },
    ],
  },
  {
    slug: "smanjiti-nedolaske-na-termine",
    title: "Kako smanjiti broj nedolazaka (no-show) na termine u salonu",
    metaDescription:
      "Nedolasci koštaju salon više nego što izgleda na prvi pogled. Evo koliko realno, i konkretni koraci da ih smanjite.",
    publishedAt: "2026-08-29",
    excerpt:
      "Svaki prazan termin je izgubljen prihod koji niko drugi nije mogao rezervisati. Evo koliko to realno košta, i šta stvarno pomaže.",
    blocks: [
      {
        type: "paragraph",
        text: "Svaki prazan termin je izgubljen prihod koji niko drugi nije mogao rezervisati — klijent koji je htio termin u to vrijeme je otišao kod konkurencije, jer je vaš kalendar izgledao popunjen.",
      },
      {
        type: "paragraph",
        text: "Uzmimo prosječan primjer: salon sa uslugom od 25 KM i samo 3 nedolaska sedmično. To je 75 KM sedmično, oko 300 KM mjesečno, preko 3.600 KM godišnje — bez ijedne dodatne mušterije, bez marketinga, samo od termina koji su \"nestali\" bez otkazivanja. (Ako želite tačnu cifru za vaš salon, na sattlio.com postoji kalkulator gdje samo pomjerite dva klizača.)",
      },
      {
        type: "list",
        items: [
          {
            title: "Podsjetnik neposredno prije termina.",
            text: "Najveći dio nedolazaka nije zloba nego zaborav — dan pun obaveza i termin jednostavno ispadne iz glave. Automatski podsjetnik uoči termina rješava veliki dio ovog problema bez ijednog telefonskog poziva.",
          },
          {
            title: "Jasna politika otkazivanja, ali dostupna za jedan klik.",
            text: "Klijent koji zna da MOŽE lako otkazati (a ne treba da zove i \"pravda se\") će to i uraditi na vrijeme — što vama ostavlja priliku da termin popunite nekim drugim.",
          },
          {
            title: "Online rezervacija umjesto telefona.",
            text: "Kad klijent sam bira termin sa ekrana (a ne diktira ga preko telefona), manja je šansa za nesporazum oko datuma/vremena — čest, potcijenjen uzrok nedolazaka.",
          },
          {
            title: "Pratite ko su vam \"problematični\" klijenti.",
            text: "Nekoliko ljudi obično pravi većinu nedolazaka. Kad imate istoriju rezervacija na jednom mjestu, lako je uočiti obrazac i eventualno tražiti avans ili potvrdu za te klijente.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Sattlio pokriva prva tri koraka odmah po uključivanju — online rezervacije, samostalno otkazivanje termina od strane klijenta i automatski email podsjetnik prije termina, bez ikakvog dodatnog podešavanja.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
