import os
import re
import shlex
import shutil
import sys
import uuid
from datetime import datetime
from pathlib import Path

import minify_html
import pytz
from invoke import task
from invoke.main import program
from pelican import main as pelican_main
from pelican.server import ComplexHTTPRequestHandler, RootedHTTPServer
from pelican.settings import DEFAULT_CONFIG, get_settings_from_file
from rcssmin import cssmin

OPEN_BROWSER_ON_SERVE = True
SETTINGS_FILE_BASE = "pelicanconf.py"
SETTINGS = {}
SETTINGS.update(DEFAULT_CONFIG)
LOCAL_SETTINGS = get_settings_from_file(SETTINGS_FILE_BASE)
SETTINGS.update(LOCAL_SETTINGS)

CONFIG = {
    "settings_base": SETTINGS_FILE_BASE,
    "settings_publish": "publishconf.py",
    # Output path. Can be absolute or relative to tasks.py. Default: 'output'
    "deploy_path": SETTINGS["OUTPUT_PATH"],
    # Host and port for `serve`
    "host": "localhost",
    "port": 8000,
    "post_path": f"{SETTINGS['PATH']}/{SETTINGS['ARTICLE_PATHS'][0]}",
}


POST_TEMPLATE = """\
---
title: {title}
slug: {slug}
date: {timestamp}
modified: {timestamp}
summary:
tags:
    -
---

"""


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    return s


@task
def clean(c):
    """Remove generated files"""
    if os.path.isdir(CONFIG["deploy_path"]):
        shutil.rmtree(CONFIG["deploy_path"])
        os.makedirs(CONFIG["deploy_path"])


@task
def build(c):
    """Build local version of site"""
    pelican_run("-s {settings_base}".format(**CONFIG))
    cache_bust()
    minify()


@task
def rebuild(c):
    """`build` with the delete switch"""
    pelican_run("-d -s {settings_base}".format(**CONFIG))
    cache_bust()
    minify()


@task
def regenerate(c):
    """Automatically regenerate site upon file modification"""
    pelican_run("-r -s {settings_base}".format(**CONFIG))


@task
def serve(c):
    """Serve site at http://$HOST:$PORT/ (default is localhost:8000)"""

    class AddressReuseTCPServer(RootedHTTPServer):
        allow_reuse_address = True

    server = AddressReuseTCPServer(
        CONFIG["deploy_path"],
        (CONFIG["host"], CONFIG["port"]),
        ComplexHTTPRequestHandler,
    )

    if OPEN_BROWSER_ON_SERVE:
        # Open site in default browser
        import webbrowser

        webbrowser.open("http://{host}:{port}".format(**CONFIG))

    sys.stderr.write("Serving at {host}:{port} ...\n".format(**CONFIG))
    server.serve_forever()


@task
def reserve(c):
    """`build`, then `serve`"""
    build(c)
    serve(c)


@task
def publish(c):
    """Build production version of site"""
    pelican_run("-s {settings_publish}".format(**CONFIG))
    cache_bust()
    minify()


@task
def livereload(c):
    """Automatically reload browser tab upon file modification."""
    from livereload import Server

    def cached_build():
        cmd = "-s {settings_base} -e CACHE_CONTENT=true LOAD_CONTENT_CACHE=true"
        pelican_run(cmd.format(**CONFIG))

    cached_build()
    server = Server()
    theme_path = SETTINGS["THEME"]
    watched_globs = [
        CONFIG["settings_base"],
        f"{theme_path}/templates/**/*.html",
    ]

    content_file_extensions = [".md", ".rst"]
    for extension in content_file_extensions:
        content_glob = "{}/**/*{}".format(SETTINGS["PATH"], extension)
        watched_globs.append(content_glob)

    static_file_extensions = [".css", ".js"]
    for extension in static_file_extensions:
        static_file_glob = f"{theme_path}/static/**/*{extension}"
        watched_globs.append(static_file_glob)

    for glob in watched_globs:
        server.watch(glob, cached_build)

    if OPEN_BROWSER_ON_SERVE:
        # Open site in default browser
        import webbrowser

        webbrowser.open("http://{host}:{port}".format(**CONFIG))

    server.serve(host=CONFIG["host"], port=CONFIG["port"], root=CONFIG["deploy_path"])


@task
def new(c, title):
    """Create a new post from a template.

    Args:
        title (str): The title of the post.
    """

    newYorkTz = pytz.timezone("America/New_York")
    now = datetime.now(newYorkTz)

    post_dir = Path(CONFIG["post_path"]).resolve()

    new_post_path = post_dir.joinpath(f"{now.strftime('%Y-%m-%d')}-{slugify(title)}.md")
    new_post_path.touch()
    with open(new_post_path, "w") as f:
        f.write(
            POST_TEMPLATE.format(
                title=title,
                slug=slugify(title),
                timestamp=now.strftime("%Y-%m-%d %H:%M"),
            )
        )

    print(f"Created new post at {new_post_path}")


def minify():
    """Minify all HTML and CSS files after Pelican has built the site."""
    site_dir = Path(CONFIG["deploy_path"]).resolve()

    for file in site_dir.glob("**/*.html"):
        with open(file, "r") as f:
            content = f.read()
        minified = minify_html.minify(
            content,
            do_not_minify_doctype=True,
            keep_closing_tags=True,
            keep_html_and_head_opening_tags=True,
            minify_css=True,
            minify_js=True,
            preserve_brace_template_syntax=True,
            remove_processing_instructions=True,
        )
        with open(file, "w") as f:
            f.write(minified)

    print("Minified all HTML files")

    for file in site_dir.glob("**/*.css"):
        with open(file, "r") as f:
            content = f.read()
        minified = cssmin(content)
        with open(file, "w") as f:
            f.write(minified)

    print("Minified all CSS files")


def cache_bust():
    """Cache bust links to CSS files within the HEAD by appending a unique ID to the URL."""
    site_dir = Path(CONFIG["deploy_path"]).resolve()
    unique_id = str(uuid.uuid4())[:8]

    i = 0
    for file in site_dir.glob("**/*.html"):
        with open(file, "r") as f:
            content = f.read()

        if re.search(r'<link href="?/static/css/[a-zA-Z0-9\.-_]+\.css', content):
            i += 1
            content = re.sub(
                r'(<link href="?/static/css/[a-zA-Z0-9\.-_]+\.css)',
                rf"\1?v={unique_id}",
                content,
            )

        with open(file, "w") as f:
            f.write(content)

    print(f"Cache busted CSS files in {i} files")


def pelican_run(cmd):
    cmd += " " + program.core.remainder  # allows to pass-through args to pelican
    pelican_main(shlex.split(cmd))
