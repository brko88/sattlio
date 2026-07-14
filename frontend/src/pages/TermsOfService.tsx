import { Link } from "react-router-dom";

function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-sm text-slate-500 hover:text-blue-600 mb-6 inline-block">
          ← Nazad na početnu
        </Link>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
          <strong>Napomena:</strong> Ovo je radni nacrt Uslova korištenja, pripremljen kao polazna
          osnova. Prije javnog lansiranja platforme, tekst treba pregledati advokat kako bi se
          potvrdilo da je usklađen sa važećim zakonima u Bosni i Hercegovini.
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Uslovi korištenja</h1>
          <p className="text-sm text-slate-400 mb-6">Posljednje ažurirano: 13.7.2026.</p>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">1. Prihvatanje uslova</h2>
              <p>
                Korištenjem platforme Sattlio ("Platforma", "Usluga") prihvatate ove Uslove
                korištenja u cjelosti. Ako se ne slažete sa bilo kojim dijelom ovih uslova,
                nemojte koristiti Platformu.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">2. Opis usluge</h2>
              <p>
                Sattlio je softver kao usluga (SaaS) koji poslovnim subjektima iz uslužnih
                djelatnosti (frizerski i kozmetički saloni, i slično) omogućava upravljanje
                terminima, zaposlenima, klijentima i online rezervacijama.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">3. Registracija i nalog</h2>
              <p>
                Za korištenje Platforme potrebno je kreirati korisnički nalog sa tačnim i
                istinitim podacima. Odgovorni ste za čuvanje povjerljivosti svoje lozinke i za
                sve aktivnosti koje se dese pod vašim nalogom. Obavezni ste odmah obavijestiti
                Sattlio ako posumnjate na neovlašten pristup vašem nalogu.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                4. Podaci vaših klijenata
              </h2>
              <p>
                Ako u ime svog poslovnog subjekta unosite podatke o svojim klijentima (ime,
                telefon, email, napomene), vi ste odgovorni za zakonitost prikupljanja i
                obrade tih podataka, uključujući postojanje pravnog osnova i, gdje je
                primjenjivo, saglasnost samih klijenata. Sattlio u ovom odnosu ima ulogu
                tehničkog obrađivača podataka koje unesete, ne i vlasnika tih podataka.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                5. Probni period i pretplata
              </h2>
              <p>
                Novi korisnici dobijaju besplatan probni period. Nakon isteka probnog perioda,
                nastavak korištenja određenih funkcionalnosti može zahtijevati plaćenu
                pretplatu, u skladu sa važećim cjenovnikom objavljenim na Platformi. Cijene i
                paketi mogu biti izmijenjeni uz razumno prethodno obavještenje.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                6. Zabranjeno ponašanje
              </h2>
              <p>
                Zabranjeno je: korištenje Platforme u nezakonite svrhe; pokušaj neovlaštenog
                pristupa tuđim nalozima ili podacima; automatizovano preopterećenje sistema
                (npr. masovno kreiranje naloga ili rezervacija radi ometanja rada drugih
                korisnika); i svako drugo zloupotrebljavanje funkcionalnosti Platforme.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                7. Intelektualno vlasništvo
              </h2>
              <p>
                Sav softver, dizajn i sadržaj Platforme (osim podataka koje sami unesete)
                vlasništvo je Sattlia i zaštićen je važećim propisima. Nije dozvoljeno
                kopiranje, distribuiranje ili reinženjering Platforme bez izričite pismene
                saglasnosti.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                8. Ograničenje odgovornosti
              </h2>
              <p>
                Platforma se pruža "kakva jeste", bez garancija neprekidnog rada bez grešaka.
                Sattlio ne odgovara za indirektnu štetu (npr. izgubljenu zaradu) nastalu usljed
                privremene nedostupnosti usluge, u mjeri dozvoljenoj važećim zakonom.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                9. Raskid i ukidanje naloga
              </h2>
              <p>
                Možete u svakom trenutku zatvoriti svoj nalog. Sattlio zadržava pravo da
                suspenduje ili ukine nalog koji krši ove Uslove, uz prethodno obavještenje osim
                u slučaju ozbiljne ili hitne zloupotrebe.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">10. Izmjene uslova</h2>
              <p>
                Zadržavamo pravo izmjene ovih Uslova. O značajnim izmjenama obavijestit ćemo
                korisnike putem emaila ili obavještenja unutar Platforme. Nastavak korištenja
                nakon izmjene smatra se prihvatanjem novih uslova.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">
                11. Mjerodavno pravo
              </h2>
              <p>
                Na ove Uslove primjenjuje se pravo Bosne i Hercegovine. Eventualni sporovi
                rješavaju se pred nadležnim sudom u Bosni i Hercegovini.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-2">12. Kontakt</h2>
              <p>
                Za sva pitanja u vezi sa ovim Uslovima, kontaktirajte nas na{" "}
                <a href="mailto:podrska@sattlio.com" className="text-blue-600 hover:underline">
                  podrska@sattlio.com
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

export default TermsOfService;
