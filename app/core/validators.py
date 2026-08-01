def normalize_email(value: str) -> str:
    return value.strip().lower()


# Minimum je isti kao onaj koji je change-password ruta oduvijek provjeravala i
# koji frontend forme vec traze (minLength={8}) - backend ga samo nije primjenjivao
# na registraciji i resetu. Maksimum postoji jer bcrypt tiho odsijeca sve poslije
# 72 bajta, pa bi duza lozinka korisnika lazno uvjerila da ima jacu zastitu.
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_BYTES = 72


def validate_password(value: str) -> str:
    """
    Zajednicka provjera jacine za SVAKO mjesto gdje korisnik postavlja lozinku
    (registracija, reset, promjena). Namjerno na jednom mjestu da se tri putanje
    vise nikad ne raziđu.
    """
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Lozinka mora imati najmanje {MIN_PASSWORD_LENGTH} karaktera.")

    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError("Lozinka je predugačka (maksimalno 72 bajta).")

    if not value.strip():
        raise ValueError("Lozinka ne može biti sastavljena samo od razmaka.")

    return value
