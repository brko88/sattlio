import { useTenant } from "../contexts/TenantContext";

/**
 * Baner koji se prikazuje vlasniku/zaposlenom kad je salon u read-only stanju
 * (istekao trial / neplaćena pretplata). Backend blokira sve write akcije (403);
 * ovo je vidljivo objašnjenje zašto. Dok je globalni prekidač naplate ugašen
 * (test period), read_only je uvijek false pa se baner ne prikazuje nikome.
 */
function ReadOnlyBanner() {
  const { readOnly } = useTenant();

  if (!readOnly) return null;

  return (
    <div className="bg-amber-500 text-white text-sm px-4 py-2.5 flex items-center justify-center gap-2 text-center">
      <span aria-hidden="true">🔒</span>
      <span>
        Pristup je ograničen na <strong>samo pregled</strong> — probni period je istekao ili pretplata
        nije aktivna. Pretplatite se da ponovo možete kreirati i mijenjati podatke.
      </span>
    </div>
  );
}

export default ReadOnlyBanner;
