import logging
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text

from app.core.database import SessionLocal, get_pool_status
from app.core.timezone_utils import get_tenant_timezone
from app.models.appointment import Appointment
from app.models.refresh_token import RefreshToken

scheduler = BackgroundScheduler()

# Proizvoljan konstantan broj - identifikuje OVAJ posao za Postgres advisory
# lock. Sa vise uvicorn worker procesa (--workers N), svaki proces pokrece
# svoju kopiju BackgroundScheduler-a (on_startup se izvrsava po procesu), pa
# bi se expire_past_appointments inace izvrsavao N puta paralelno na isti
# tick. Lock osigurava da u datom trenutku posao stvarno radi samo JEDAN
# worker - ostali ga preskoce (bezopasno, sljedeci tick za 30min ce ga
# svakako pokupiti bilo koji slobodan worker).
EXPIRE_JOB_LOCK_ID = 918273645
CLEANUP_TOKENS_LOCK_ID = 918273646

POOL_LOG_INTERVAL_MINUTES = 2
POOL_WARN_THRESHOLD_PCT = 75

# Vlastiti logger sa vlastitim handlerom: default root logger je na WARNING
# nivou pa bi INFO linije (trend popunjenosti) bile tiho progutane i nikad
# ne bi stigle u docker logs.
pool_logger = logging.getLogger("sattlio.pool")
if not pool_logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(levelname)s:     %(message)s"))
    pool_logger.addHandler(_handler)
    pool_logger.setLevel(logging.INFO)
    pool_logger.propagate = False


def expire_past_appointments():
    """
    Termin koji ostane created/confirmed nakon sto prodje njegov tenant-ov
    lokalni dan automatski prelazi u "expired" - neutralno "ne znamo sta se
    desilo", za razliku od "no_show" koji je svjesna odluka osoblja.
    Osoblje kasnije moze rucno prebaciti expired u completed/cancelled/no_show.

    Ne bira "expired" cim prodje vrijeme termina - ceka kraj kalendarskog
    dana (u tenant-ovoj zoni) da ostavi osoblju vremena da tokom istog dana
    sami oznace sta se desilo.
    """
    db = SessionLocal()
    try:
        # pg_try_advisory_xact_lock je transakciono-skopiran - automatski se
        # oslobadja na commit/rollback, bez rucnog unlock-a (sigurno i uz
        # connection pooling, gdje bi rucno "unlock" na recikliranoj konekciji
        # moglo pogoditi pogresnu sesiju).
        got_lock = db.execute(text("SELECT pg_try_advisory_xact_lock(:id)"), {"id": EXPIRE_JOB_LOCK_ID}).scalar()
        if not got_lock:
            return

        candidates = db.query(Appointment).filter(Appointment.status.in_(["created", "confirmed"])).all()
        tz_cache: dict[int, ZoneInfo] = {}
        now_utc = datetime.now(timezone.utc)

        for a in candidates:
            if a.tenant_id not in tz_cache:
                tz_cache[a.tenant_id] = get_tenant_timezone(db, a.tenant_id)
            tz = tz_cache[a.tenant_id]

            local_date = a.start_time.replace(tzinfo=timezone.utc).astimezone(tz).date()
            day_end_utc = datetime.combine(local_date + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)

            if now_utc >= day_end_utc:
                a.status = "expired"

        db.commit()
    finally:
        db.close()


def cleanup_expired_refresh_tokens():
    """
    Brise ISTEKLE redove iz refresh_tokens - bez ovoga tabela raste neograniceno
    (svaki login/refresh dodaje red, a niko nikad ne brise; korisnik koji samo
    zatvori browser bez logout-a ostavlja red koji ceka expires_at + 30 dana).

    NAMJERNO ne brise opozvane (is_revoked=true) a jos neistekle tokene: na
    njima pociva replay detekcija - kad neko podnese opozvan token, sistem
    prepozna kradju i ponisti cijelu family_id porodicu sesija. Obrisan red bi
    replay pretvorio u obican "nije pronadjen" 401, bez alarma. Isteknu li,
    ionako postaju beskorisni napadacu, pa ih je tad bezbjedno pocistiti.
    """
    db = SessionLocal()
    try:
        got_lock = db.execute(text("SELECT pg_try_advisory_xact_lock(:id)"), {"id": CLEANUP_TOKENS_LOCK_ID}).scalar()
        if not got_lock:
            return

        deleted = (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at < datetime.now(timezone.utc))
            .delete(synchronize_session=False)
        )
        db.commit()
        if deleted:
            import logging
            logging.info(f"refresh_tokens cleanup: obrisano {deleted} isteklih redova.")
    finally:
        db.close()


def log_pool_status():
    """
    Periodicni snimak popunjenosti DB connection pool-a: INFO za trend,
    WARNING kad se priblizi iscrpljenju (rano upozorenje - 503 handler u
    main.py se javi tek kad je pool VEC prazan).

    NAMJERNO BEZ advisory locka, za razliku od ostala dva posla: pool je PO
    WORKER PROCESU (4 odvojena pool-a od po 40), a stress test 21.07.2026. je
    pokazao da se sistem rusi kad JEDAN worker potrosi svoj pool dok su ostali
    mirni. Lock bi ostavio tri workera kao slijepu tacku - svaki worker mora
    logovati svoje brojeve (pid u liniji kaze ciji su).
    """
    stats = get_pool_status()
    message = (
        f"DB pool [pid {stats['worker_pid']}]: "
        f"{stats['checked_out']}/{stats['capacity']} ({stats['utilization_pct']}%)"
    )
    if stats["utilization_pct"] >= POOL_WARN_THRESHOLD_PCT:
        pool_logger.warning(
            f"{message} - blizu iscrpljenja! Ako se ponavlja, povecati "
            f"pool_size/max_overflow (app/core/database.py) i max_connections (Postgres)."
        )
    else:
        pool_logger.info(message)


def start_scheduler():
    scheduler.add_job(expire_past_appointments, "interval", minutes=30, id="expire_past_appointments")
    # Jednom dnevno je dovoljno - tabela raste sporo (red po loginu/refresh-u).
    scheduler.add_job(cleanup_expired_refresh_tokens, "interval", hours=24, id="cleanup_expired_refresh_tokens")
    scheduler.add_job(log_pool_status, "interval", minutes=POOL_LOG_INTERVAL_MINUTES, id="log_pool_status")
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown()
