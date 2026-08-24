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
