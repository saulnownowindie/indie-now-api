#!/usr/bin/env python3
"""Worker de previews para Reels.

Reclama reels pendientes desde la API, descarga el video con yt-dlp,
recorta un clip sin audio con ffmpeg, sube clip + poster a Cloudinary y
notifica el resultado. El video original nunca se sube.
"""

from __future__ import annotations

import argparse
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
import requests
from dotenv import load_dotenv

PREVIEW_SECONDS = 4
MAX_REELS_PER_CYCLE = 5
LOOP_SECONDS = 5 * 60
MIN_PAUSE_SECONDS = 20
MAX_PAUSE_SECONDS = 40
HTTP_TIMEOUT = 60
DOWNLOAD_TIMEOUT = 600
FFMPEG_TIMEOUT = 300

RESERVED_INSTAGRAM_PATHS = {
    "p",
    "reel",
    "reels",
    "tv",
    "stories",
    "share",
    "explore",
}

load_dotenv()


def log(message: str) -> None:
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{stamp}] {message}", flush=True)


class WorkerError(Exception):
    """Error de procesamiento que debe marcar el reel como failed."""


class Config:
    def __init__(self) -> None:
        self.api_url = os.getenv("API_URL", "").strip().rstrip("/")
        self.worker_token = os.getenv("WORKER_TOKEN", "").strip()
        self.cloudinary_cloud_name = os.getenv(
            "CLOUDINARY_CLOUD_NAME", ""
        ).strip()
        self.cloudinary_api_key = os.getenv(
            "CLOUDINARY_API_KEY", ""
        ).strip()
        self.cloudinary_api_secret = os.getenv(
            "CLOUDINARY_API_SECRET", ""
        ).strip()
        self.allowed_hosts = {
            host.strip().lower()
            for host in os.getenv(
                "ALLOWED_HOSTS",
                "instagram.com,tiktok.com,youtube.com,youtu.be",
            ).split(",")
            if host.strip()
        }
        self.allowed_users = {
            user.strip().lstrip("@").lower()
            for user in os.getenv("ALLOWED_USERS", "").split(",")
            if user.strip()
        }
        self.cookies_browser = os.getenv("COOKIES_BROWSER", "").strip()

    def validate(self) -> None:
        missing = [
            name
            for name, value in {
                "API_URL": self.api_url,
                "WORKER_TOKEN": self.worker_token,
                "CLOUDINARY_CLOUD_NAME": self.cloudinary_cloud_name,
                "CLOUDINARY_API_KEY": self.cloudinary_api_key,
                "CLOUDINARY_API_SECRET": self.cloudinary_api_secret,
            }.items()
            if not value
        ]

        if missing:
            raise SystemExit(
                "Faltan variables de entorno: " + ", ".join(missing)
            )

        if not self.allowed_hosts:
            raise SystemExit("ALLOWED_HOSTS no puede estar vacío.")

    def configure_cloudinary(self) -> None:
        cloudinary.config(
            cloud_name=self.cloudinary_cloud_name,
            api_key=self.cloudinary_api_key,
            api_secret=self.cloudinary_api_secret,
            secure=True,
        )


class ApiClient:
    def __init__(self, config: Config) -> None:
        self.base_url = config.api_url
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {config.worker_token}",
                "Content-Type": "application/json",
            }
        )

    def claim_previews(self) -> list[dict[str, Any]]:
        response = self.session.get(
            f"{self.base_url}/api/worker/pending-previews",
            params={"limit": MAX_REELS_PER_CYCLE},
            timeout=HTTP_TIMEOUT,
        )

        if response.status_code >= 400:
            raise WorkerError(
                f"No se pudieron reclamar previews: "
                f"HTTP {response.status_code} {response.text[:300]}"
            )

        payload = response.json()

        return payload.get("reels", [])

    def complete(
        self,
        reel_id: int,
        *,
        preview_url: str | None = None,
        poster_url: str | None = None,
        status: str,
        error: str | None = None,
    ) -> None:
        body: dict[str, Any] = {"status": status}

        if preview_url:
            body["previewUrl"] = preview_url

        if poster_url:
            body["posterUrl"] = poster_url

        if error:
            log(f"Reel {reel_id}: {error}")

        response = self.session.patch(
            f"{self.base_url}/api/worker/reels/{reel_id}/preview",
            json=body,
            timeout=HTTP_TIMEOUT,
        )

        if response.status_code >= 400:
            raise WorkerError(
                f"No se pudo actualizar el reel {reel_id}: "
                f"HTTP {response.status_code} {response.text[:300]}"
            )

    def fail(self, reel_id: int, message: str) -> None:
        try:
            self.complete(reel_id, status="failed", error=message)
        except Exception as exc:  # noqa: BLE001 - el worker debe seguir vivo
            log(f"Reel {reel_id}: no se pudo reportar el fallo: {exc}")


def normalize_host(host: str) -> str:
    return host.lower().lstrip(".").replace("www.", "", 1)


def host_is_allowed(host: str, allowed_hosts: set[str]) -> bool:
    normalized = normalize_host(host)

    return any(
        normalized == allowed or normalized.endswith(f".{allowed}")
        for allowed in allowed_hosts
    )


def extract_social_user(host: str, path: str) -> str | None:
    normalized = normalize_host(host)
    parts = [part for part in path.split("/") if part]

    if normalized.endswith("tiktok.com"):
        match = re.match(r"^/@([^/]+)", path)

        return match.group(1) if match else None

    if normalized.endswith("instagram.com"):
        if not parts or parts[0].lower() in RESERVED_INSTAGRAM_PATHS:
            return None

        return parts[0]

    return None


def validate_reel_url(url: str, config: Config) -> None:
    if not url:
        raise WorkerError("El reel no tiene un enlace.")

    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise WorkerError("Solo se aceptan enlaces HTTPS.")

    if not parsed.hostname:
        raise WorkerError("El enlace no tiene un host válido.")

    if not host_is_allowed(parsed.hostname, config.allowed_hosts):
        raise WorkerError(
            f"Host no permitido: {parsed.hostname}. "
            f"Permitidos: {', '.join(sorted(config.allowed_hosts))}"
        )

    user = extract_social_user(parsed.hostname, parsed.path)

    if user and config.allowed_users:
        if user.lstrip("@").lower() not in config.allowed_users:
            raise WorkerError(
                f"Usuario no permitido: @{user.lstrip('@')}"
            )


def run_command(
    command: list[str],
    *,
    timeout: int,
    label: str,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )

    if result.returncode != 0:
        output = (result.stderr or result.stdout or "").strip()
        tail = output[-1200:] if output else "sin salida"

        raise WorkerError(f"{label} falló: {tail}")

    return result


def clear_partial_downloads(tmp_dir: Path, reel_id: int) -> None:
    for path in tmp_dir.glob(f"{reel_id}.*"):
        if path.is_file():
            path.unlink(missing_ok=True)


def find_downloaded_video(tmp_dir: Path, reel_id: int) -> Path:
    candidates = sorted(
        path
        for path in tmp_dir.glob(f"{reel_id}.*")
        if path.is_file()
        and path.suffix.lower() in {".mp4", ".webm", ".mkv", ".mov", ".m4v"}
    )

    if not candidates:
        raise WorkerError("yt-dlp no generó ningún archivo de video.")

    return candidates[0]


def download_video(url: str, tmp_dir: Path, reel_id: int, config: Config) -> Path:
    output_template = str(tmp_dir / f"{reel_id}.%(ext)s")
    base_command = [
        "yt-dlp",
        "--no-playlist",
        "--no-warnings",
        "-f",
        "bv*[height<=720]/b",
        "--merge-output-format",
        "mp4",
        "-o",
        output_template,
        url,
    ]

    attempts: list[list[str]] = [base_command]

    if config.cookies_browser:
        attempts.append(
            [
                *base_command[:-1],
                "--cookies-from-browser",
                config.cookies_browser,
                url,
            ]
        )

    last_error: Exception | None = None

    for index, command in enumerate(attempts):
        clear_partial_downloads(tmp_dir, reel_id)

        try:
            run_command(
                command,
                timeout=DOWNLOAD_TIMEOUT,
                label=f"yt-dlp (intento {index + 1})",
            )

            return find_downloaded_video(tmp_dir, reel_id)
        except (WorkerError, subprocess.TimeoutExpired) as exc:
            last_error = exc
            log(f"Reel {reel_id}: {exc}")

    raise WorkerError(
        f"No se pudo descargar el video: {last_error}"
    )


def cut_preview(
    input_path: Path,
    tmp_dir: Path,
    reel_id: int,
    preview_start: float,
) -> tuple[Path, Path]:
    preview_path = tmp_dir / f"{reel_id}_preview.mp4"
    poster_path = tmp_dir / f"{reel_id}_poster.jpg"
    start = str(max(float(preview_start or 0), 0))

    run_command(
        [
            "ffmpeg",
            "-y",
            "-ss",
            start,
            "-i",
            str(input_path),
            "-t",
            str(PREVIEW_SECONDS),
            "-vf",
            "scale=360:-2,fps=24",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "28",
            "-preset",
            "slow",
            "-movflags",
            "+faststart",
            str(preview_path),
        ],
        timeout=FFMPEG_TIMEOUT,
        label="ffmpeg (preview)",
    )

    run_command(
        [
            "ffmpeg",
            "-y",
            "-ss",
            start,
            "-i",
            str(input_path),
            "-vframes",
            "1",
            "-vf",
            "scale=360:-2",
            "-q:v",
            "4",
            str(poster_path),
        ],
        timeout=FFMPEG_TIMEOUT,
        label="ffmpeg (poster)",
    )

    for path, label in (
        (preview_path, "clip"),
        (poster_path, "poster"),
    ):
        if not path.exists() or path.stat().st_size == 0:
            raise WorkerError(
                f"ffmpeg no generó el {label}. "
                "Probá con otro segundo inicial."
            )

    return preview_path, poster_path


def upload_assets(
    preview_path: Path,
    poster_path: Path,
    reel_id: int,
) -> tuple[str, str]:
    stamp = int(time.time())
    preview_result = cloudinary.uploader.upload(
        str(preview_path),
        resource_type="video",
        folder="reels-previews",
        public_id=f"reel-{reel_id}-preview-{stamp}",
        overwrite=False,
    )
    poster_result = cloudinary.uploader.upload(
        str(poster_path),
        resource_type="image",
        folder="reels-previews",
        public_id=f"reel-{reel_id}-poster-{stamp}",
        overwrite=False,
    )

    preview_url = preview_result.get("secure_url")
    poster_url = poster_result.get("secure_url")

    if not preview_url or not poster_url:
        raise WorkerError(
            "Cloudinary no devolvió las URLs del preview y el poster."
        )

    return preview_url, poster_url


def process_reel(
    api: ApiClient,
    reel: dict[str, Any],
    config: Config,
) -> None:
    reel_id = int(reel["id"])
    url = reel.get("url") or ""
    preview_start = reel.get("previewStart") or 0

    log(f"Reel {reel_id}: procesando {url} (inicio {preview_start}s)")

    tmp_dir = Path(tempfile.mkdtemp(prefix=f"reel-{reel_id}-"))

    try:
        validate_reel_url(url, config)
        video_path = download_video(url, tmp_dir, reel_id, config)
        preview_path, poster_path = cut_preview(
            video_path,
            tmp_dir,
            reel_id,
            preview_start,
        )
        preview_url, poster_url = upload_assets(
            preview_path,
            poster_path,
            reel_id,
        )
        api.complete(
            reel_id,
            preview_url=preview_url,
            poster_url=poster_url,
            status="ready",
        )
        log(f"Reel {reel_id}: preview listo.")
    except Exception as exc:  # noqa: BLE001 - se reporta como failed
        message = str(exc) or exc.__class__.__name__
        log(f"Reel {reel_id}: ERROR {message}")
        api.fail(reel_id, message[:900])
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def run_cycle(api: ApiClient, config: Config) -> int:
    reels = api.claim_previews()

    if not reels:
        log("No hay previews pendientes.")
        return 0

    log(f"Reclamados {len(reels)} reels.")

    for index, reel in enumerate(reels):
        process_reel(api, reel, config)

        if index < len(reels) - 1:
            pause = random.uniform(MIN_PAUSE_SECONDS, MAX_PAUSE_SECONDS)
            log(f"Pausa de {pause:.1f}s antes del siguiente reel.")
            time.sleep(pause)

    return len(reels)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Worker de previews de Reels para Indie Now.",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Procesa los pendientes una vez y termina.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config = Config()
    config.validate()
    config.configure_cloudinary()

    api = ApiClient(config)

    log(
        "Worker iniciado. "
        f"API: {config.api_url}. "
        f"Hosts: {', '.join(sorted(config.allowed_hosts))}."
    )

    if args.once:
        run_cycle(api, config)
        return 0

    while True:
        try:
            run_cycle(api, config)
        except KeyboardInterrupt:
            log("Worker detenido por el usuario.")
            return 0
        except Exception as exc:  # noqa: BLE001 - el bucle debe continuar
            log(f"Error en el ciclo: {exc}")

        log(f"Esperando {LOOP_SECONDS // 60} minutos...")
        time.sleep(LOOP_SECONDS)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("Worker detenido por el usuario.")
        sys.exit(0)
