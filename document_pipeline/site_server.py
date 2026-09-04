"""Serve the static exam library and its repository-local source files."""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class LibraryHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, repository: Path, website: Path, **kwargs):
        self.repository = repository
        self.website = website
        super().__init__(*args, directory=str(website), **kwargs)

    def translate_path(self, path: str) -> str:
        clean = unquote(urlsplit(path).path).lstrip("/")
        root = self.repository if clean.startswith(("content/", "source/")) else self.website
        relative = clean[7:] if clean.startswith("source/") else clean
        candidate = (root / relative).resolve()
        if root.resolve() not in candidate.parents and candidate != root.resolve():
            return str(root / "index.html")
        return str(candidate)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    repository = args.root.resolve()
    website = repository / "website"
    handler = lambda *request_args, **kwargs: LibraryHandler(*request_args, repository=repository, website=website, **kwargs)
    server = ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    print(f"Serving exam library at http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
