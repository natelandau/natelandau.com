---
title: From Jekyll to Pelican
slug: from-jekyll-to-pelican
date: 2024-12-09 16:50
modified: 2024-12-09 16:50
summary: I moved my blog from Jekyll to [Pelican](https://getpelican.com/). Here are some of the things I learned.
callout:
tags:
    - webdev
---
When I first started this blog in 2013 I used [Jekyll](https://jekyllrb.com/) as a static site generator. At the time it was a state-of-the-art tool for creating static sites. I hand-crafted my own CSS and created an overly complex publishing workflow leaning heavily on a mix of Ruby and NPM packages orchestrated with [Grunt.js](https://gruntjs.com/).  I published the site on AWS S3 using a number of custom scripts to manage the build and deployment process.  Putting this all together was a great learning experience and it all worked well...until it didn't.

I use this blog more as a personal project to learn about web technologies and don't publish content very often. Sometimes a year or more would go by without touching the site. What I found was that every time I wanted to publish a post I had to enter NPM update hell. Many of the packages I used were out of date and/or had dependencies that were no longer supported. Rather than spending an hour to publish a post I would spend days upgrading NPM packages and workflows.  To make matters worse, my entire workflow was centered on Grunt.js which hasn't been updated in years. I needed something simpler.

I had three requirements for a new architecture:

1. It had to **use a single language and ecosystem**. No more co-mingling of Ruby and Javascript to manage and publish content.
2. Managing a hand-built CSS framework was a pain. I needed a **flexible and simple CSS framework** that I could easily customize.
3. I needed a **simple publishing workflow** that didn't require a lot of maintenance and was easy to understand.

I started looking around at static site generators and narrowed my list of possible choices to [Pelican](https://getpelican.com/), [Hugo](https://gohugo.io/), and [Jekyll](https://jekyllrb.com/).  Of the three, I selected Pelican because it was written in Python and I've been doing lots of Python development lately.

The largest drawback to Pelican was that the available pre-built themese were pretty terrible. I found a few that were ok but nothing that I would consider a good starting point. I decided to build my own theme from scratch.  Luckily, this was easy to do.

My old site used hand-crafted HTML and CSS which I found to be a pain to maintain.  My HTML wasn't semantic and my CSS was a mess.  This time around I used vanilla semantic HTML.  I selected [Pico.css](https://picocss.com/) for a CSS framework.  Pico is a simple CSS framework that directly styles HTML tags, using fewer than 10 classes overall. Customizing Pico was simple and required very few changes and custom classes to get the look and feel I wanted.

The world of hosting options has changed dramatically since 2013. I decided to move the hosting from AWS S3 to [Cloudflare Pages](https://pages.cloudflare.com/). When new content is pushed to Github a workflow is triggered that builds the site and pushes the site to a branch that is watched by Cloudflare Pages.  When the branch is updated, the changes are deployed to the live site.  This is a simple and effective workflow that I can easily understand and maintain.

The entire codebase is available on Github: [natelandau/natelandau.com](https://github.com/natelandau/natelandau.com).

## Learnings

I use [uv](https://docs.astral.sh/uv/) to manage the Python environment and install the dependencies. Running `uv pip compile pyproject.toml -o requirements.txt` will generate a `requirements.txt` file that can be used by CF Pages to install the dependencies.

Few Python packages or Pelican extensions were needed for the functionality I wanted.  Here's the short list:

-   [PyMdown](https://facelessuser.github.io/pymdown-extensions/extensions/arithmatex/)
-   [image-process](https://github.com/pelican-plugins/image-process)
-   [Yaml Metadata](https://github.com/pelican-plugins/yaml-metadata)
-   [Pelican Sitemap](https://github.com/pelican-plugins/sitemap)
-   [Pelican Neighbors](https://github.com/pelican-plugins/neighbors)
-   [Pelican Tag Cloud](https://github.com/pelican-plugins/tag-cloud)

I use extended markdown with [PyMdown](https://facelessuser.github.io/pymdown-extensions/extensions/arithmatex/) to write my posts. This allows me to use the following conventions when writing posts and pages in markdown.

-   `==Word==` becomes  ==Word==
-   `++ctrl+alt+delete++` becomes  ++ctrl+alt+delete++
-   `~~Word~~` becomes ~~Word~~
-   Inline code can be highlighted with `#!language code` as in: `#!py3 import pymdownx; pymdownx.__version__` or `#!js var test = 0;`
-   Emoji can be added with `:emoji_name:` as in: I have a :smile: here. and here is a :tada:
-   [Smart symbols](https://facelessuser.github.io/pymdown-extensions/extensions/smartsymbols/) are enabled by default

These are enabled with the following configuration in `pelicanconf.py`:

```python
from pymdownx import emoji

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
```

[Invoke](https://github.com/pyinvoke/invoke) is a flexible Python task manager that comes bundled with Pelican. I wrote a few custom tasks to help with the deployment process.  These tasks make use of [minify-html](https://github.com/wilsonzlin/minify-html) and [rcssmin](https://github.com/ndparker/rcssmin) to minify the HTML and CSS files.

```python
from datetime import datetime
import pytz
import minify_html
from pathlib import Path
from rcssmin import cssmin

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
```

[Cloudflare Pages](https://pages.cloudflare.com/) supports redirects in a `_redirects` file at the root of the site.  I manage redirects in the `pelicanconf.py` file with the `REDIRECTS` dictionary.

```python
REDIRECTS = {
    "source_url": "destination_url"
}
```
This template parses the `pelicanconf.py` file and generates a `_redirects` file at the root of the site.

```jinja
{%- for src, dst in REDIRECTS.items() %}
{{ src }} {{dst}} 301
{% endfor -%}
```

Deploying the site to Cloudflare pages is simple. Anytime a change is pushed to the `main` branch, the site is automatically deployed. However, I ran in to trouble because I us [uv](https://docs.astral.sh/uv/) to manage the Python environment and install the dependencies.  Cloudflare Pages doesn't support `uv` so I had to use `pip` to install the dependencies.  Luckily, uv makes this easy. Just run `uv pip compile pyproject.toml -o requirements.txt` to generate a `requirements.txt` file that can be used by CF Pages to install the dependencies.
