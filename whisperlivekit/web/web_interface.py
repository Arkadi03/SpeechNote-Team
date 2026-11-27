"""Package the SpeechNote page and the upstream audio workers for GET /."""

from importlib import resources


def _read(name: str) -> str:
    return resources.files("whisperlivekit.web").joinpath(name).read_text(encoding="utf-8")


def get_web_interface_html():
    return _read("speechnote.html")


def get_inline_ui_html():
    """Bundle local assets so a single request works without a static mount or CDN."""
    page = get_web_interface_html().replace(
        '<link rel="stylesheet" href="speechnote.css">',
        f'<style>{_read("speechnote.css")}</style>',
    )
    for name in ("speechnote", "sn-settings", "sn-transcript", "sn-status", "sn-mic", "sn-file", "sn-actions", "sn-questions"):
        filename = f"{name}.js"
        page = page.replace(f'<script src="{filename}"></script>', f"<script>{_read(filename)}</script>")

    for element, filename in (("pcm-worklet", "pcm_worklet.js"), ("pcm-worker", "recorder_worker.js")):
        tag = f'<script type="text/plain" id="{element}">'
        page = page.replace(tag + "</script>", tag + _read(filename) + "</script>")
    return page


if __name__ == '__main__':

    import pathlib

    import uvicorn
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse
    from starlette.staticfiles import StaticFiles

    import whisperlivekit.web as webpkg

    app = FastAPI()
    web_dir = pathlib.Path(webpkg.__file__).parent
    app.mount("/web", StaticFiles(directory=str(web_dir)), name="web")

    @app.get("/")
    async def get():
        return HTMLResponse(get_inline_ui_html())

    uvicorn.run(app=app)
