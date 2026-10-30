# Worker de previews de Reels

Procesa los reels que quedaron en `previewStatus = "pending"` usando
`yt-dlp` + `ffmpeg`, sube un clip de 4 s sin audio y su poster a
Cloudinary, y actualiza el reel en la API. El video original **nunca**
se sube.

## Requisitos en la PC

- Python 3.10 o superior.
- `ffmpeg` y `ffprobe` en el `PATH`.
- `yt-dlp` en el `PATH`.

En Windows, una forma simple es descargar los binarios de
[ffmpeg](https://ffmpeg.org/download.html) y
[yt-dlp](https://github.com/yt-dlp/yt-dlp/releases), y agregar la
carpeta que los contiene al `PATH`.

## Instalación

```bash
cd worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

En Linux/macOS el activate es `source .venv/bin/activate`.

Copiá `.env.example` a `.env` y completá:

- `API_URL`: URL pública de la API, sin barra final.
- `WORKER_TOKEN`: el mismo token configurado en Vercel.
- `CLOUDINARY_*`: las mismas credenciales de la API.
- `ALLOWED_HOSTS`: hosts permitidos.
- `ALLOWED_USERS`: opcional, usuarios permitidos separados por coma.
- `COOKIES_BROWSER`: opcional (`chrome`, `edge`, `firefox`, etc.).

El `.env` real no se versiona.

## Uso

```bash
python worker.py --once   # procesa pendientes y termina
python worker.py          # bucle cada 5 minutos
```

En Windows también podés usar `run_once.bat` o `run_worker.bat`.

El worker reclama hasta 5 reels por ciclo. El reclamo es atómico en la
API, por lo que se pueden tener varias PC ejecutando el worker al mismo
tiempo sin que procesen el mismo reel. Entre reel y reel espera 20–40 s
para no forzar las plataformas.

## Actualizar yt-dlp

YouTube cambia seguido. Si aparecen errores de descarga, actualizá:

```bash
yt-dlp -U
```

En Linux/macOS, si se instaló con pip:

```bash
python -m pip install -U yt-dlp
```

## Copiar el worker a otra PC

1. Copiá la carpeta `worker` completa (sin `.venv` ni `.env`).
2. Instalá Python, ffmpeg y yt-dlp.
3. Creá el `.env` con las mismas credenciales.
4. Ejecutá `pip install -r requirements.txt`.
5. Iniciá `run_worker.bat` o `python worker.py`.

## Qué hace con cada reel

1. Valida que el enlace sea HTTPS y de un host permitido.
2. Si `ALLOWED_USERS` no está vacío, valida el usuario de TikTok o
   Instagram. Los enlaces sin usuario se permiten.
3. Descarga solo el video con `yt-dlp` (máximo 720p).
4. Recorta 4 s desde `previewStart` y genera el poster con `ffmpeg`.
5. Sube clip y poster a Cloudinary.
6. Envía `status: "ready"` a la API.
7. Borra siempre los temporales, incluso si falla.
8. Si algo falla, envía `status: "failed"` y registra el motivo.
