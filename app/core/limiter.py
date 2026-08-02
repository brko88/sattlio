from slowapi import Limiter
from slowapi.util import get_remote_address


def user_or_ip(request) -> str:
    """
    Kljuc za rate limiting: user_id iz Bearer tokena kad postoji, inace IP.

    Razlog: BH mobilni operateri (CGNAT) guraju hiljade korisnika kroz istu
    javnu IP adresu - limit po IP-u bi znacilo da svi ONI dijele jedan budzet
    i legitimni korisnici dobijaju 429. Po user_id-u svako nosi svoj limit.
    Anonimni zahtjevi (login, register, javni pregled bez naloga) ostaju po
    IP-u - tu identiteta jos nema, a upravo su te rute meta zloupotrebe.
    Nevalidan/istekao token pada nazad na IP (napadac ne moze izmisljenim
    tokenima dobiti svjez budzet).
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Import unutar funkcije - izbjegava kruzni import pri startu
        # (security -> database -> ... vs. rute koje vuku i limiter i security).
        from app.core.security import decode_access_token

        payload = decode_access_token(auth_header[7:])
        if payload and payload.get("user_id"):
            return f"user:{payload['user_id']}"
    return get_remote_address(request)


limiter = Limiter(key_func=user_or_ip)
