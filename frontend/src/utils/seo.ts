/**
 * setPageMeta — postavlja <title> + meta description/og:* po stranici,
 * i vraća funkciju koja ih vraća na prethodnu vrijednost (za useEffect cleanup).
 *
 * NAPOMENA: ovo pomaže kod Google-a (koji renderuje JS) i kod dijeljenja
 * linka unutar aplikacija koje takođe renderuju JS (dio Twitter/X-a), ALI NE
 * kod Facebook/WhatsApp bot-ova koji čitaju SAMO statični HTML sa servera
 * (ne izvršavaju JS) — oni će uvijek vidjeti podrazumijevane og: vrijednosti
 * iz index.html, bez obzira na ovu funkciju. Za tačan og:image/og:title po
 * postu i na tim platformama bi trebalo server-side renderovanje, što je
 * veći zahvat i namjerno nije urađeno sada.
 */
interface PageMeta {
  title: string;
  description: string;
  /** Apsolutni URL slike (og:image mora biti apsolutan, ne relativan). */
  image?: string;
}

function setMetaTag(selector: string, content: string): string | null {
  const tag = document.querySelector(selector);
  if (!tag) return null;
  const previous = tag.getAttribute("content");
  tag.setAttribute("content", content);
  return previous;
}

export function setPageMeta({ title, description, image }: PageMeta): () => void {
  const previousTitle = document.title;
  const previousDescription = setMetaTag('meta[name="description"]', description);
  const previousOgTitle = setMetaTag('meta[property="og:title"]', title);
  const previousOgDescription = setMetaTag('meta[property="og:description"]', description);
  const previousOgImage = image ? setMetaTag('meta[property="og:image"]', image) : null;

  document.title = title;

  return () => {
    document.title = previousTitle;
    if (previousDescription !== null) setMetaTag('meta[name="description"]', previousDescription);
    if (previousOgTitle !== null) setMetaTag('meta[property="og:title"]', previousOgTitle);
    if (previousOgDescription !== null) setMetaTag('meta[property="og:description"]', previousOgDescription);
    if (image && previousOgImage !== null) setMetaTag('meta[property="og:image"]', previousOgImage);
  };
}
