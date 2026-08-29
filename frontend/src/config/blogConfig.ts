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
  /** Putanja do cover ilustracije (frontend/public/blog/*.png, vidi brand/make_blog_covers.py). */
  coverImage: string;
  blocks: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "zasto-salon-treba-online-rezervacije",
    title: "5 razloga zašto vaš salon treba sistem za online rezervacije",
    metaDescription:
      "Instagram poruke, telefonski pozivi, papirni rokovnik — evo pet konkretnih razloga zašto salon danas treba jedan sistem za sve rezervacije.",
    publishedAt: "2026-08-30",
    excerpt:
      "Ako rezervacije danas primate kroz Instagram, Viber, telefon i papirni rokovnik, niste jedini — evo zašto se isplati sve svesti na jedno mjesto.",
    coverImage: "/blog-covers/zasto-salon-treba-online-rezervacije.png",
    blocks: [
      {
        type: "paragraph",
        text: "Ako vaš salon danas prima rezervacije kroz Instagram poruke, Viber, telefon i po koji papirni rokovnik — niste jedini. Ali svaki od tih kanala je posebno mjesto koje treba provjeriti, i lako je nešto propustiti. Evo zašto se isplati sve to svesti na jedno mjesto.",
      },
      {
        type: "list",
        items: [
          {
            title: "Klijenti danas očekuju opciju online rezervacije.",
            text: "Sve više ljudi jednostavno preskoči salon koji nema tu opciju — ne zato što je salon loš, nego zato što je zvanje telefonom postalo nezgodno, posebno mlađoj populaciji. Salon koji nudi online rezervaciju djeluje pristupačnije već na prvi utisak.",
          },
          {
            title: "Kraj haosa poruka na više mjesta.",
            text: "Instagram DM za jednog klijenta, Viber poruka za drugog, poziv za trećeg — sve razbacano, ništa na jednom mjestu. Kad sve rezervacije prolaze kroz isti sistem, ne morate pamtiti gdje ste šta dogovorili.",
          },
          {
            title: "Automatska provjera preklapanja.",
            text: "Čak i najorganizovaniji ljudi ponekad upišu dva klijenta u isti termin greškom. Sistem to spriječi sam — ne dozvoljava da se dva termina poklope za istog zaposlenog.",
          },
          {
            title: "Lakše upravljanje sa više zaposlenih.",
            text: "Kad salon ima dva, tri ili više zaposlenih, ručno pamtiti čiji je koji termin postaje nepregledno. Svaki zaposleni ima svoj kalendar, klijent bira i osobu i termin, bez zabune.",
          },
          {
            title: "Profesionalniji utisak prema novim klijentima.",
            text: "Javna stranica sa uslugama, cijenama i slobodnim terminima djeluje ozbiljnije od \"pošaljite poruku za cijenu i termin\". Novom klijentu je lakše da se odluči kad odmah vidi sve što mu treba.",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Sattlio pokriva sve navedeno iz jednog mjesta — javnu stranicu za rezervaciju, automatsku provjeru preklapanja i poseban kalendar po zaposlenom, bez potrebe da žonglirate sa više kanala.",
      },
    ],
  },
  {
    slug: "online-zakazivanje-vs-telefon",
    title: "Online zakazivanje vs. zakazivanje telefonom — šta se isplati vlasniku salona",
    metaDescription:
      "Telefon djeluje jednostavnije, ali svaki poziv ima skrivenu cijenu. Poređenje online zakazivanja i klasičnog telefonskog termina za vlasnike salona.",
    publishedAt: "2026-08-29",
    excerpt:
      "Telefon je besplatan, ali nije bez cijene — evo šta zakazivanje preko telefona stvarno košta salon, i šta se dobije prelaskom na online.",
    coverImage: "/blog-covers/online-zakazivanje-vs-telefon.png",
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
    coverImage: "/blog-covers/smanjiti-nedolaske-na-termine.png",
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

const MONTH_NAMES = [
  "januar", "februar", "mart", "april", "maj", "juni",
  "juli", "avgust", "septembar", "oktobar", "novembar", "decembar",
];

/**
 * Ručno formatiranje datuma umjesto toLocaleDateString("bs-BA", ...) — na
 * dijelu Android/Chrome verzija ICU podaci za "bs-BA" fale, pa mjesec ispadne
 * kao skraćenica tipa "M08" umjesto "avgust" (otkriveno 29.08.2026. na
 * telefonu, screenshot).
 */
export function formatBlogDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day}. ${MONTH_NAMES[month - 1]} ${year}.`;
}
