"""
Osnovni resursi servera (disk/memorija/CPU) za /admin/health. Citaju se
direktno iz kontejnera - kako nismo postavili memory/cpu cgroup limite u
docker-compose.yml, /proc i shutil.disk_usage ovdje vide STVARNE brojeve
hosta, ne izolovane kontejnerske. Sve best-effort (try/except -> None) jer
/proc/meminfo i os.getloadavg ne postoje na Windowsu (lokalni dev van
Docker-a).
"""
import os
import shutil
import time

# Oracle Always Free izlazni saobracaj limit - vidi deploy checklist /
# project_production_deploy memoriju.
FREE_TIER_MONTHLY_BYTES = 10 * 1024 ** 4  # 10 TB
NETWORK_USAGE_LOG = "infra/network_usage.csv"
NETWORK_LOOKBACK_SECONDS = 30 * 24 * 3600  # ~30 dana


def get_disk_usage() -> dict | None:
    try:
        total, used, free = shutil.disk_usage("/")
        return {
            "total_gb": round(total / (1024 ** 3), 1),
            "used_gb": round(used / (1024 ** 3), 1),
            "used_pct": round(used / total * 100),
        }
    except Exception:
        return None


def get_memory_usage() -> dict | None:
    try:
        info = {}
        with open("/proc/meminfo") as f:
            for line in f:
                key, value = line.split(":", 1)
                info[key] = int(value.strip().split()[0])  # kB
        total_kb = info["MemTotal"]
        available_kb = info["MemAvailable"]
        used_kb = total_kb - available_kb
        return {
            "total_gb": round(total_kb / (1024 ** 2), 1),
            "used_gb": round(used_kb / (1024 ** 2), 1),
            "used_pct": round(used_kb / total_kb * 100),
        }
    except Exception:
        return None


def get_network_usage() -> dict | None:
    """
    Priblizna potrosnja mreznog saobracaja u zadnjih ~30 dana, naspram
    Oracle Always Free limita (10TB/mj). Brojaci u /sys su OD BOOT-a, ne od
    pocetka mjeseca - zbrajamo POZITIVNE razlike izmedju uzastopnih satnih
    snapshotova (infra/network_usage.sh), sto ispravno prezivi restart
    servera (ta jedna razlika se samo preskoci, ne pokvari cijeli racun).
    Nije precizno kao OCI-jeva sopstvena billing metrika - samo gruba
    procjena za brzi uvid.
    """
    try:
        with open(NETWORK_USAGE_LOG) as f:
            rows = [tuple(map(int, line.strip().split(","))) for line in f if line.strip()]
        if len(rows) < 2:
            return None

        cutoff = rows[-1][0] - NETWORK_LOOKBACK_SECONDS
        window = [r for r in rows if r[0] >= cutoff]
        if len(window) < 2:
            window = rows

        total_bytes = 0
        for (_, prx, ptx), (_, rx, tx) in zip(window, window[1:]):
            total_bytes += max(0, (rx - prx) + (tx - ptx))

        return {
            "total_gb": round(total_bytes / (1024 ** 3), 1),
            "limit_tb": round(FREE_TIER_MONTHLY_BYTES / (1024 ** 4)),
            "used_pct": round(min(total_bytes / FREE_TIER_MONTHLY_BYTES * 100, 100), 1),
        }
    except Exception:
        return None


def get_cpu_load() -> dict | None:
    try:
        load_1min, _, _ = os.getloadavg()
        cores = os.cpu_count() or 1
        return {
            "load_1min": round(load_1min, 2),
            "cores": cores,
            "used_pct": round(min(load_1min / cores * 100, 100)),
        }
    except Exception:
        return None
