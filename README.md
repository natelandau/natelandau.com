# natelandau.com

Everything required to post, edit, deploy, and manage [natelandau.com](https://natelandau.com).

## Getting Started
[natelandau.com](https://natelandau.com)is a static website built with [Pelican](https://docs.getpelican.com/en/latest/) a static site generator written in Python.

This repository uses [uv](https://docs.astral.sh/uv/) to manage the Python environment and install the dependencies.

Note: For CI/CD where uv is not available, a `requirements.txt` is available to allow the dependencies to be installed with `pip install -r requirements.txt`.

```bash
git clone https://github.com/natelandau/natelandau.com.git
cd natelandau.com
uv sync
```

## Interacting with Pelican

The [Invoke package](https://www.pyinvoke.org/) is used to interact with Pelican. Common tasks include:

```bash
# List all available tasks
invoke --list

# Build the site (dev settings)
invoke build

# Serve the site locally
invoke serve

# Regenerate the site upon file changes (dev settings)
invoke livereload

# Publish the site with production settings
invoke publish

# Create a new post
invoke new "My New Post"
```

## Authoring Posts and Pages

Posts are written in markdown and placed in the `content` directory.

### Post Frontmatter

-   `callout`: (optional) Short description of the post displayed in large text
-   `date`: Original post date.
-   `has_comments`: (optional) If set to `false`, disables comments for the post. Defaults to `true`.
-   `link_text`: (optional) Used for nav links pointing to pages. Defaults to the title.
-   `modified`: (optional) Date of last modification
-   `summary`: (optional) Longer description of the post displayed in the post list. Defaults to the first 50 words of the post.
-   `tags`: (optional) List of tags for the post. Tags should be lowercase.
-   `title`: Title of the post, also creates the slug used for the url.


### Markdown Conventions

Use the following conventions when writing posts and pages in markdown.

-   `==Word==` becomes `<mark>Word</mark>`
-   `++Word++` becomes `<kbd>Word</kbd>`
-   `~~Word~~` becomes `<del>Word</del>`
-   Inline code can be highlighted with `#!language code` as in `Here is some code: #!py3 import pymdownx; pymdownx.__version__` or `#!js var test = 0;`
-   Emoji can be added with `:emoji_name:` as in `I have a :smile: here. and here is a :tada:`
-   [Smart symbols](https://facelessuser.github.io/pymdown-extensions/extensions/smartsymbols/) are enabled by default

### Images

To generate responsive images use the following syntax:

```markdown
![Alt text]({static}/images/image.png){: .image-process-responsive}
```

this adds the class `image-process-responsive` to the image which is used by the [image-process](https://github.com/pelican-plugins/image-process) plugin to generate the responsive image.

## Theme Development and Settings

A custom theme is located in the `theme` directory. See the [Pelican Themes documentation](https://docs.getpelican.com/en/latest/themes.html) for more information on theme development.

### Settings

Two settings files are available:

-   `pelicanconf.py`: Development settings
-   `publishconf.py`: Production settings containing overrides of the development settings

#### Redirects with Cloudflare Pages

Cloudflare Pages supports redirects in a `_redirects` file at the root of the site (see [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/configuration/redirects/)).

Manage redirects in the `pelicanconf.py` file with the `REDIRECTS` dictionary.

```python
REDIRECTS = {
    "source_url": "destination_url"
}
```

### HTML and CSS
The theme is built using simple semantic HTML and [PicoCSS](https://picocss.com/) a minimal CSS framework.  Custom CSS overrieds are in the `theme/css` directory.

### Pelican Extensions

The following Pelican extensions are used:
-   [PyMdown](https://facelessuser.github.io/pymdown-extensions/extensions/arithmatex/)
-   [image-process](https://github.com/pelican-plugins/image-process)
-   [Yaml Metadata](https://github.com/pelican-plugins/yaml-metadata)
-   [Pelican Sitemap](https://github.com/pelican-plugins/sitemap)
-   [Pelican Neighbors](https://github.com/pelican-plugins/neighbors)
-   [Pelican Tag Cloud](https://github.com/pelican-plugins/tag-cloud)

### Comments

Comments are provided by [Giscus](https://giscus.app/) ([Github repo](https://github.com/giscus/giscus))

To moderate, use the Github Discussions web interface.

## Deployment

The site is deployed automatically using a Github Actions workflow which builds the site and pushes the generated files to the `deploy` branch. Cloudflare Pages will then pick up the changes and deploy them to the live site.

Changes to the following files will trigger a deployment:
```yaml
paths:
    - "content/**"
    - "theme/**"
    - "pelicanconf.py"
    - "publishconf.py"
```
