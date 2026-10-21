"""Local preview of the static site, including its existing extensionless URLs."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parent.parent


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        resolved = Path(super().translate_path(path))
        if not resolved.exists() and not resolved.suffix:
            html = resolved.with_suffix('.html')
            if html.is_file():
                return str(html)
        return str(resolved)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    options = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', options.port), PreviewHandler)
    print(f'Preview: http://localhost:{options.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
