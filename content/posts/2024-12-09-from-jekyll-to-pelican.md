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
Building and maintaining a personal blog should be simple, but over time, technical debt can make even basic updates feel overwhelming. In 2013, I launched this blog using [Jekyll](https://jekyllrb.com/) as a static site generator using a mix of Ruby and NPM pagkages along with custom build scripts. While it worked well initially, maintaining the complex publishing workflow became challenging, especially after long periods without updates. Dependency issues and the need to update outdated packages turned simple post publishing into a multi-day ordeal.

To address these challenges, I knew I needed to make some changes. I established three key requirements for a new blog architecture:

1. Use a single language and ecosystem to streamline management and publishing
2. Implement an adaptable CSS framework
3. Develop an efficient publishing workflow

After evaluating options like [Pelican](https://getpelican.com/), [Hugo](https://gohugo.io/), and [Jekyll](https://jekyllrb.com/), I chose Pelican for its Python foundation, aligning with my recent development focus.

Pelican offered fewer ready-to-use design templates (themes) compared to other options. While some themes existed, none matched my needs. While I found a few acceptable options, building a custom theme offered the best path forward. This presented an opportunity to improve upon the hand-crafted HTML and CSS of my old site, which needed modernization to improve maintainability due to non-semantic markup and a disorganized stylesheet.

For the new theme, I opted for semantic HTML and selected [Pico.css](https://picocss.com/) as the CSS framework. Pico's simplicity and minimal class usage made it an ideal choice for customization without adding unnecessary complexity. Customizing Pico was simple and required minimal changes and custom classes to get the look and feel I wanted.

The world of hosting options has changed dramatically since 2013. I decided to move the hosting from AWS S3 to [Cloudflare Pages](https://pages.cloudflare.com/). When new content is pushed to Github triggers a workflow that builds the site and pushes the site to a branch that is watched by Cloudflare Pages.  When the branch is updated, Cloudflare deploys changes to the live site.  This is a reliable workflow that I can easily understand and maintain.

This new architecture delivered several improvements:
- Simplified maintenance with a single language ecosystem (Python)
- Faster content publishing through automated workflows
- Improved performance with built-in minification and optimization
- Better scalability using modern cloud infrastructure
- Reduced costs by leveraging Cloudflare's free tier

The codebase lives on Github: [natelandau/natelandau.com](https://github.com/natelandau/natelandau.com).

## Learnings

### Managing Dependencies with UV
I use [uv](https://docs.astral.sh/uv/) to manage the Python environment and install the dependencies. Running `uv pip compile pyproject.toml -o requirements.txt` generates a `requirements.txt` file that Cloudflare Pages can use to install the necessary packages.


### Essential Python Packages and Pelican Extensions
While I kept the dependency list lean, each chosen package serves a specific purpose in improving the blog:

- [PyMdown](https://facelessuser.github.io/pymdown-extensions/extensions/arithmatex/): Enhances content formatting with features like syntax highlighting and smart symbols, making technical posts more readable
- [image-process](https://github.com/pelican-plugins/image-process): Optimizes images for web delivery, improving page load times without manual intervention
- [Yaml Metadata](https://github.com/pelican-plugins/yaml-metadata): Simplifies post management with clean, readable front matter that's easier to maintain than traditional formats
- [Pelican Sitemap](https://github.com/pelican-plugins/sitemap): Creates a `sitemap.xml` file for SEO
- [Pelican Neighbors](https://github.com/pelican-plugins/neighbors): Adds a "next post" and "previous post" link to each post
- [Pelican Tag Cloud](https://github.com/pelican-plugins/tag-cloud): Adds a browsable tag cloud

### Writing Posts with Extended Markdown
To make technical writing more expressive and readable, I leveraged [PyMdown's](https://facelessuser.github.io/pymdown-extensions/extensions/arithmatex/) extended Markdown features. These extensions make it easier to create rich, technical content using straightforward Markdown syntax:

-   `==Word==` becomes  ==Word==
-   `++ctrl+alt+delete++` becomes  ++ctrl+alt+delete++
-   `~~Word~~` becomes ~~Word~~
-   Inline code can be highlighted with `#!language code` as in: `#!py3 import pymdownx; pymdownx.__version__` or `#!js var test = 0;`
-   Emoji can be added with `:emoji_name:` as in: I have a :smile: here. and here is a :tada:
-   [Smart symbols](https://facelessuser.github.io/pymdown-extensions/extensions/smartsymbols/) are enabled by default

These extensions are configured in the `pelicanconf.py` file as follows:

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

### Custom Deployment Tasks with Duty

[Duty](https://pawamoy.github.io/duty/) is a flexible Python task manager bundled with Pelican.  It helps automate common development tasks, making the publishing process more efficient. Here are the key tasks I implemented:

1. **Post Creation**: Automate the creation of new blog posts with proper formatting
2. **Asset Optimization**: Minify HTML and CSS files
3. **Cache Management**: Implement cache busting for better performance
4. **Local Development**: Runs Pelican in watch mode and serve the site locally

See all the tasks in [duties.py](https://github.com/natelandau/natelandau.com/blob/main/duties.py).

### Managing Redirects with Cloudflare Pages
[Cloudflare Pages](https://pages.cloudflare.com/) supports redirects through a `_redirects` file at the root of the site. I manage redirects in the `pelicanconf.py` file using the `REDIRECTS` dictionary:

```python
REDIRECTS = {
    "source_url": "destination_url"
}
```
A Jinja template parses the `pelicanconf.py` file and generates the `_redirects` file:

```jinja
{%- for src, dst in REDIRECTS.items() %}
{{ src }} {{dst}} 301
{% endfor -%}
```

### Deployment to Cloudflare Pages

Deploying the site to Cloudflare Pages is straightforward. Any changes pushed to the `main` branch trigger an automatic deployment. However, since Cloudflare Pages doesn't support `uv`, I had to use `pip` to install the dependencies. Luckily, `uv` simplifies this process by generating a `requirements.txt` file with the command `uv pip compile pyproject.toml -o requirements.txt`.

## Conclusion

Rebuilding my blog with Pelican, Pico.css, and Cloudflare Pages has improved the maintainability, performance, and ease of use compared to my previous Jekyll-based setup. By leveraging a single language and ecosystem, a lightweight CSS framework, and a simple deployment workflow, I've created a blog that is easier to manage and update.

The complete source code is available on [GitHub](https://github.com/natelandau/natelandau.com) for those interested in implementing similar solutions.
