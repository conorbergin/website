#!/usr/bin/env python3
"""
Usage:
  python3 build.py          # build
  python3 build.py clean    # remove output and cache
  python3 build.py serve    # serve on :8080
"""
import json
import shutil
import subprocess
import sys
import tomllib
from itertools import groupby
from pathlib import Path

SRC = Path("src")
OUT = Path(".output")
CACHE = Path(".cache")


goblin = Path("goblin.svg").read_text()

SKIP_SUFFIXES = {".dj", ".json", ".yaml", ".toml", ".zon", ".md", ".jinja"}


_META_TEMPLATE = CACHE / "meta.html"

def pandoc_meta(md: Path) -> dict:
    if not _META_TEMPLATE.exists():
        _META_TEMPLATE.parent.mkdir(exist_ok=True)
        _META_TEMPLATE.write_text("$meta-json$")
    return json.loads(subprocess.run(
        ["pandoc", str(md), "--template", str(_META_TEMPLATE)],
        capture_output=True, text=True, check=True
    ).stdout)

# Plain string (not f-string) to avoid escaping JS template literals like `${x}px`
_JS = """\
  var dx = 0;
  var dy = 0;
  const eye_data = JSON.parse(localStorage.getItem("cursorState"));
  if (eye_data) {
    dx = eye_data.dx;
    dy = eye_data.dy;
  }

  function update(e) {
    if (e) {
      const bbox = document.querySelector("#eye-root").getBoundingClientRect();
      dx = bbox.left + bbox.width / 2 - e.clientX;
      dy = bbox.top + bbox.height / 2 - e.clientY;
    }

    const clamp_x = 200;
    const clamp_y = 200;

    const dx2 = Math.max(-clamp_x, Math.min(clamp_x, dx)) / clamp_x
    const dy2 = Math.max(-clamp_y, Math.min(clamp_y, dy)) / clamp_y

    const x_factor = 10;
    const y_factor = 10;

    document.documentElement.style.setProperty("--pupil-x",`${-x_factor*dx2}px`);
    document.documentElement.style.setProperty("--pupil-y",`${-y_factor*dy2}px`);
  }

  update(null);

  document.onpointermove = update;
  document.onpointerdown = update;

  window.addEventListener('beforeunload', () => {
      localStorage.setItem("cursorState", JSON.stringify({
          dx,
          dy,
      }))
  })
"""


def page(title: str, content: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" href="/c.png">
<link rel=stylesheet href="/styles.css"/>
<title>{title}</title>
<script>
{_JS}</script>
</head>
<body>
<header style="width:100%;">
<nav style="display:flex;gap:0.25rem;">
<a href="/">Home</a>
<a href="/blog/">Blog</a>
<a href="/bookmarks/">Bookmarks</a>
</nav>
<div style="width:100%;display:flex;justify-content:center;">
<a href="/">{goblin}</a>
</div>
</header>
<main>
{content}
</main>
<footer>
<hr>
</footer>
by Conor Bergin, site updated August 2026, <a href="/ai-policy/">AI Policy</a>
</body>
</html>"""


def stale(output: Path, *inputs: Path) -> bool:
    if not output.exists():
        return True
    t = output.stat().st_mtime
    return any(p.stat().st_mtime > t for p in inputs if p.exists())



def collect_posts() -> list[tuple[str, dict]]:
    result = []
    for md in SRC.rglob("*.md"):
        meta = pandoc_meta(md)
        if "blog" in meta.get("tags", []):
            url = "/" + str(md.parent.relative_to(SRC)) + "/"
            result.append((url, meta))
    return sorted(result, key=lambda x: x[1]["date"], reverse=True)


def build_bookmarks():
    src = Path("bookmarks.toml")
    out = OUT / "bookmarks" / "index.html"
    data = tomllib.loads(src.read_text())
    bookmarks = data["bookmark"]
    for b in bookmarks:
        if not b.get("url") and not b.get("title"):
            raise ValueError(f"bookmark has neither url nor title: {b!r}")
    bookmarks.sort(key=lambda b: b["category"])
    parts = []
    parts.append("<h1>Bookmarks</h1>")
    for cat, group in groupby(bookmarks, key=lambda b: b["category"]):
        parts.append(f"<h2>{cat}</h2><ul>")
        for b in group:
            url, title = b.get("url"), b.get("title")
            if title and url:
                label = f'<a href="{url}">{title}</a>'
            elif url:
                label = f'<a href="{url}">{url}</a>'
            else:
                label = title
            desc = f" — {b['desc']}" if b.get("desc") else ""
            parts.append(f"<li>{label}{desc}</li>")
        parts.append("</ul>")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page("Bookmarks", "\n".join(parts)))
    print(f"  built {out}")


def build():
    posts = collect_posts()

    build_bookmarks()

    # Content pages (.md → html via pandoc)
    for md in SRC.rglob("*.md"):
        out = OUT / md.relative_to(SRC).with_suffix(".html")
        if not stale(out, md, Path("build.py")):
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        meta = pandoc_meta(md)
        title = meta.get("title", "")
        html = subprocess.run(
            ["pandoc", str(md), "--mathml"], capture_output=True, text=True, check=True
        ).stdout
        if "blog" in meta.get("tags", []):
            html = f"<h1>{title}</h1>\n<code>{meta.get('date', '')}</code>\n" + html
        out.write_text(page(title, html))
        print(f"  built {out}")

    # Homepage
    n = len(posts)
    items = "\n".join(
        f'<li><a href="{k}">[{v["date"]}] {v["title"]}</a></li>'
        for k, v in posts[:5]
    )
    index_content = (
        "<p>Hello, welcome to my website. At the moment it contains my blog, "
        "and some links to things I recommend.</p>"
        "<p>Here are my most recent blog posts:</p>"
        f'<ol reversed start="{n}">\n{items}\n</ol>'
        '<p>I also have a <a href="https://github.com/conorbergin">Github</a>.</p>'
    )
    out = OUT / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page("Conor Bergin's Website", index_content))
    print(f"  built {out}")

    # Blog index
    items = "\n".join(
        f'<li><a href="{k}">[{v["date"]}] {v["title"]}</a></li>'
        for k, v in posts
    )
    out = OUT / "blog" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page("Blog", f"<ol reversed>\n{items}\n</ol>"))
    print(f"  built {out}")

    # Static files
    for src in SRC.rglob("*"):
        if src.is_file() and src.suffix not in SKIP_SUFFIXES:
            out = OUT / src.relative_to(SRC)
            if stale(out, src):
                out.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, out)


def clean():
    for d in (OUT, CACHE):
        shutil.rmtree(d, ignore_errors=True)
    print("cleaned")


def serve():
    import threading
    import time

    OUT.mkdir(exist_ok=True)
    build()

    thread = threading.Thread(
        target=lambda: subprocess.run(
            ["python3", "-m", "http.server", "8080", "--directory", str(OUT)]
        ),
        daemon=True,
    )
    thread.start()

    def snapshot():
        return {p: p.stat().st_mtime for p in SRC.rglob("*") if p.is_file()}

    state = snapshot()
    while True:
        time.sleep(0.5)
        current = snapshot()
        if current != state:
            state = current
            print("change detected, rebuilding...")
            build()


COMMANDS = {"build": build, "clean": clean, "serve": serve}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    if cmd not in COMMANDS:
        print(f"unknown command: {cmd}. Use: build, clean, serve")
        sys.exit(1)
    COMMANDS[cmd]()
