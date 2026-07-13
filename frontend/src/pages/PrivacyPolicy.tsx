import { Link } from "react-router-dom";

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-sm text-slate-500 hover:text-blue-600 mb-6 inline-block">
          ← Nazad na početnu
        </Link>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
          <strong>Napomena:</strong> Ovo je radni nacrt Politike privatnosti, pripremljen kao
          polazna osnova. Prije javnog lansiranja platforme, tekst treba pregledati advokat kako
          bi se potvrdilo da je usklađen sa Zakonom o zaštiti ličnih podataka BiH i drugim
          važećim propisima.
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Politika privatnosti</h1>
          <p className="text-sm text-slate-400 mb-6">Posljednje ažurirano: 13.7.2026.</p>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">1. Uvod</h2>
              <p>
                Ova Politika privatnosti objašnjava koje podatke Sattlio prikuplja, kako ih
                koristi i čuva, i koja prava imate u vezi sa svojim podacima.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                2. Koje podatke prikupljamo
              </h2>
              <p className="mb-2">
                <strong>Podaci vašeg naloga:</strong> ime, prezime, email adresa, telefon
                (opciono) i lozinka (čuvana u heširanom obliku, nikad kao čisti tekst).
              </p>
              <p className="mb-2">
                <strong>Podaci vašeg poslovnog subjekta:</strong> naziv salona, adresa, grad,
                JIB, kontakt telefon i email, opis i logo salona.
              </p>
              <p>
                <strong>Podaci koje sami unosite o svojim klijentima:</strong> ime, prezime,
                telefon, email i napomene o klijentima vašeg salona, koje unosite vi ili vaši
                zaposleni.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                3. Kako koristimo podatke
              </h2>
              <p>
                Podatke koristimo isključivo da bismo omogućili osnovnu funkcionalnost
                Platforme: prijavu na nalog, upravljanje terminima i klijentima, slanje
                email obavještenja (npr. potvrda emaila, otkazivanje termina) i podršku
                korisnicima. Ne prodajemo vaše podatke trećim stranama.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                4. Uloga Sattlia kod podataka vaših klijenata
              </h2>
              <p>
                Za podatke koje unesete o svojim klijentima, vi (vlasnik poslovnog subjekta)
                ste kontrolor podataka, a Sattlio djeluje kao tehnički obrađivač — čuvamo i
                obrađujemo te podatke isključivo po vašem nalogu, radi pružanja usluge
                zakazivanja termina.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                5. Dijeljenje podataka sa trećim stranama
              </h2>
              <p>
                Radi pružanja usluge, koristimo pouzdane vanjske servise (npr. provajder za
                slanje email obavještenja i hosting infrastrukturu). Ovi servisi imaju pristup
                podacima isključivo u mjeri potrebnoj za pružanje svoje usluge i ne smiju ih
                koristiti u druge svrhe.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                6. Sigurnost podataka
              </h2>
              <p>
                Lozinke se čuvaju isključivo u heširanom obliku. Tokeni za verifikaciju emaila
                i reset lozinke se takođe heširaju prije čuvanja u bazi. Pristup podacima
                unutar Platforme ograničen je prema ulozi korisnika (vlasnik, zaposleni,
                klijent).
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                7. Čuvanje podataka i brisanje naloga
              </h2>
              <p>
                Podatke čuvamo dok god je vaš nalog aktivan. Ako zatražite brisanje naloga,
                obrisaćemo ili anonimizovati vaše lične podatke u razumnom roku, osim podataka
                koje smo po zakonu obavezni čuvati duže (npr. iz poreskih ili računovodstvenih
                razloga).
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">8. Vaša prava</h2>
              <p>
                Imate pravo zatražiti pristup svojim podacima, njihovu ispravku, brisanje, ili
                ograničenje obrade. Zahtjev možete poslati na email naveden ispod.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">9. Kolačići</h2>
              <p>
                Platforma za prijavu koristi lokalno skladištenje u vašem browseru (localStorage)
                radi čuvanja sesije, umjesto tradicionalnih kolačića za praćenje. Ne koristimo
                kolačiće trećih strana za oglašavanje.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                10. Izmjene politike
              </h2>
              <p>
                Zadržavamo pravo izmjene ove Politike. O značajnim izmjenama obavijestit ćemo
                korisnike putem emaila ili obavještenja unutar Platforme.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">11. Kontakt</h2>
              <p>
                Za sva pitanja u vezi sa obradom vaših podataka, kontaktirajte nas na{" "}
                <a href="mailto:sattlio.app@gmail.com" className="text-blue-600 hover:underline">
                  sattlio.app@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
