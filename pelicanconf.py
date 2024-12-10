from datetime import datetime, timezone

from pymdownx import emoji

ARTICLE_PATHS = ["posts"]
ARTICLE_SAVE_AS = PAGE_SAVE_AS = "{slug}/index.html"
ARTICLE_URL = PAGE_URL = "{slug}/"
AUTHOR = "Nate Landau"
AUTHOR_EMAIL = "nate@natelandau.com"
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None
CATEGORY_FEED_ATOM = None
DEFAULT_DATE_FORMAT = "%a %d %B %Y"
DEFAULT_LANG = "en"
DEFAULT_PAGINATION = 10
FEED_MAX_ITEMS = 15
FEED_APPEND_REF = True
DRAFT_SAVE_AS = DRAFT_PAGE_SAVE_AS = "drafts/{slug}/index.html"
DRAFT_URL = DRAFT_PAGE_URL = "drafts/{slug}/"
FEED_ALL_ATOM = "atom.xml"
JINJA_ENVIRONMENT = {"trim_blocks": True, "lstrip_blocks": True}
OUTPUT_PATH = "_site/"
PAGE_PATHS = ["pages"]
PATH = "content"
SITENAME = "natelandau.com"
SITEDESCRIPTION = "Nathaniel Landau's home on the web"
SITEEMAIL = "fromwebsite@natelandau.com"
SITEURL = "http://localhost:8000"
THEME = "theme"
THEME_STATIC_DIR = "static"
TIMEZONE = "America/New_York"
TRANSLATION_FEED_ATOM = None
WITH_FUTURE_DATES = False
PYGMENTS_RST_OPTIONS = {"classprefix": "pgcss", "linenos": "table"}
TODAY = datetime.now(tz=timezone.utc).date()
YEAR = TODAY.year
GITHUB_REPO = "natelandau/natelandau.com"
GISCUS_REPO_ID = "R_kgDOIM6z9g"
GISCUS_DATA_CATEGORY_ID = "DIC_kwDOIM6z9s4CSAJf"
GISCUS_DATA_CATEGORY = "staging-comments"

TEMPLATE_PAGES = {
    "static/robots.txt": "robots.txt",
    "static/feed.json": "feed.json",
    "static/404.html": "404.html",
    "static/_redirects": "_redirects",
    # "static/giscus.json": "giscus.json",
}

DIRECT_TEMPLATES = ["index", "tags"]

TAG_CLOUD_SORTING = "alphabetically"

MARKDOWN = {
    "extensions": [
        "pymdownx.mark",
        "pymdownx.smartsymbols",
        "pymdownx.tilde",
        "pymdownx.saneheaders",
        "pymdownx.keys",
        "pymdownx.inlinehilite",
        "pymdownx.emoji",
        "pymdownx.extra",
    ],
    "extension_configs": {"pymdownx.emoji": {"emoji_generator": emoji.to_png_sprite}},
}

IMAGE_PROCESS = {
    "responsive": {
        "type": "responsive-image",
        "sizes": (
            "(min-width: 1536px) 1400px, "
            "(min-width: 1280px) 1200px, "
            "(min-width: 1024px) 1000px, "
            "(min-width: 992px) 900px, "
            "(min-width: 768px) 750px, "
            "(min-width: 576px) 560px, "
            "100vw"
        ),
        "srcset": [
            ("1400w", ["scale_in 1400 1050 True"]),
            ("1200w", ["scale_in 1200 900 True"]),
            ("1000w", ["scale_in 1000 750 True"]),
            ("900w", ["scale_in 900 675 True"]),
            ("750w", ["scale_in 750 563 True"]),
            ("560w", ["scale_in 560 420 True"]),
        ],
        "default": "900w",
    },
}

# Uncomment following line if you want document-relative URLs when developing
# RELATIVE_URLS = True

SITEMAP = {
    "format": "xml",
    "priorities": {
        "articles": 0.7,
        "indexes": 0.5,
        "pages": 0.5,
    },
    "changefreqs": {
        "articles": "monthly",
        "indexes": "daily",
        "pages": "monthly",
    },
    "exclude": [
        "^noindex/",  # starts with "/noindex/"
        "^tag/",  # contains "/tag/"
        "\.json$",  # ends with ".json"
        "\.txt$",  # ends with ".txt"
        "_redirects",
        "404.html",
        "^category/",  # we use tags, not categories
        "^author/",  # we don't use author pages
    ],
}

# Creates a `_redirects` file in the root of the site.
# See [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/configuration/redirects/) for more information.
REDIRECTS = {
    # "/source_url": "/destination_url"
}
