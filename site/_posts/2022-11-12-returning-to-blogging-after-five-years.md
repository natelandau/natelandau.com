---
layout: post
title: Returning to this site after five years
date: 2022-11-13
image:
description: A lot has changed since I last used Jekyll in 2017. Here's how I updated this blog to make it current.
tags:
    - webDev
    - jekyll
sitemap:
    priority: 0.3
    changefreq: monthly
    lastmod: 2022-11-13
    exclude: false
flags:
    published: true
    noindex: false
    include_comments: true
---

I use [Jekyll](https://jekyllrb.com/) and custom build scripts written with [Grunt.js](https://gruntjs.com/) to build and deploy this static web site. A few months ago I decided to come back blogging after a five year hiatus. Five years is multiple lifetimes in web development and I quickly realized a few things

1. The versions of all the software used for this site were now woefully out of date
2. None of my build routines worked anymore
3. I was unable to deploy content to Amazon S3 where I host this site
4. I didn't have good documentation on how I had built the site
5. I had lots of work to do...

Here is how I made this site current

## Architecture Overview

I opted to use the following tools when rebuilding this site.

-   **[Jekyll](https://jekyllrb.com/) for a static site generator.** I played with [11ty](https://www.11ty.dev/), [Hugo](https://gohugo.io/), and [Pelican](https://getpelican.com/) but decided the quickest path would be to stay on Jekyll and avoid the need to rebuild my site templates and theme.
-   **[Grunt.js](https://gruntjs.com/) for a task runner.** I know the world has largely moved beyond Grunt and it was last updated in 2019. However, after a quick review it seemed the main plugins I used still had hundreds of thousands of weekly downloads and maintaining it as my task runner would save time of learning a whole new platform.
-   **Amazon S3 and Cloudfront for web hosting.** I do want to move to self-hosting this site on a VPS with Cloudflare as a CDN but that will be a task for another day. S3 works well, is incredibly cheap, and I've already invested the time in configuring the DNS, Buckets, and Cloudfront distributions.

Now that these decisions were made, it was time to start updating everything to get it working.

## Development Environment

Local development has moved a long way since I first architected this blog nearly a decade ago. Now I had a chance to adopt many design paradigms that will allow me to keep my local development environment up-to-date.

I moved all the code into a new Github repository. And, unlike my old blog, I opted to work in the light and make the code for this website public. You can [view the entire codebase on Github](https://github.com/natelandau/natelandau.com).

### Visual Studio Code Containerized Development

I use [VS Code](https://code.visualstudio.com/) as my IDE of choice and decided to use a [development container](https://code.visualstudio.com/) when developing this site. To make a long story short, this allows all the dependencies needed to build and deploy this site to be managed within a Docker container. I can now do work on this site on any computer or in the cloud and not worry about installing RVM, the right Ruby version, NPM, etc. It's all managed with three files contained in the `.devcontainer` folder of the repository.

-   **[`devcontainer.json`](https://github.com/natelandau/natelandau.com/blob/main/.devcontainer/devcontainer.json)** installs Ruby, VS Code extensions, NodeJS, and some other utilities.
-   **[`Dockerfile`](https://github.com/natelandau/natelandau.com/blob/main/.devcontainer/Dockerfile)** creates the container. I made minor updates to this to ensure that the locale was set correctly
-   **[`postCreateCommand.sh`](https://github.com/natelandau/natelandau.com/blob/main/.devcontainer/postCreateCommand.sh)** is a custom shellscript I wrote to install the packages necessary to develop this site from Apt, PIP, Ruby, and Node.

With this development container I can clone the repository and develop within minutes on any machine that has Visual Studio Code and Docker installed.

### Git

I use [Pre-Commit](https://pre-commit.com/) to run checks on my code before I push commits to [Github](https://github.com/natelandau/natelandau.com).

-   **[Commitizen](https://github.com/commitizen-tools/commitizen)** enforces [conventional commit style](https://www.conventionalcommits.org/) to my git history.
-   **[YAML Lint](https://github.com/adrienverge/yamllint)** lints my YAML files
-   **[Prettier](https://prettier.io/)** enforces a common style to all my code and markdown files
-   **[Detect Secrets](https://github.com/Yelp/detect-secrets)** helps to ensure I don't accidentally commit data to my repository that could compromise the security of the site.

My entire `pre-commit.yaml` is

```yaml
---
default_install_hook_types: [commit-msg, pre-commit]
default_stages: [commit, manual]
fail_fast: true
repos:
    - repo: "https://github.com/pre-commit/pre-commit-hooks"
      rev: v4.3.0
      hooks:
          - id: check-added-large-files
          - id: check-ast
          - id: check-builtin-literals
          - id: check-case-conflict
          # - id: check-json
          - id: check-merge-conflict
          - id: check-shebang-scripts-are-executable
          - id: check-symlinks
          - id: check-toml
          - id: check-vcs-permalinks
          # - id: check-xml
          - id: check-yaml
          - id: debug-statements
          #   - id: detect-aws-credentials
          - id: detect-private-key
          - id: fix-byte-order-marker
          - id: mixed-line-ending
          - id: trailing-whitespace
            args: [--markdown-linebreak-ext=md]
    - repo: "https://github.com/commitizen-tools/commitizen"
      rev: v2.35.0
      hooks:
          - id: commitizen
          - id: commitizen-branch
            stages: [push]
    - repo: "https://github.com/adrienverge/yamllint.git"
      rev: v1.28.0
      hooks:
          - id: yamllint
            exclude: |
                (?x)^(
                \./node_modules/|
                \.cz\.yaml|
                \.github/workflows/.*\.yml
                )
            files: \.(yaml|yml)$
            types: [file, yaml]
            entry: yamllint --strict --config-file .yamllint.yml
    - repo: "https://github.com/pre-commit/mirrors-prettier"
      rev: v3.0.0-alpha.2
      hooks:
          - id: prettier
            exclude: |
                (?x)^(
                site/assets/.*\.css|
                site/.*\.json|
                site/_includes/.*\.html|
                site/.*\.html|
                site/_layouts/.*\.html|
                site/_less/lesshat\.less|
                \.cz\.yaml|
                CHANGELOG\.md
                )
    - repo: "https://github.com/Yelp/detect-secrets"
      rev: v1.4.0
      hooks:
          - id: detect-secrets
            args: ["--baseline", ".secrets.baseline"]
            exclude: ^(\.lock$|\.lock\.json|node_modules/|tmp/)

    - repo: local
      hooks:
          - id: check-bash-syntax
            name: Check Shell scripts syntax correctness
            language: system
            entry: bash -n
            files: \.sh$

          - id: check Gemfile
            name: Running bundle check
            language: system
            entry: bundle check
            files: ^Gemfile$
            pass_filenames: false

          - id: jshint
            name: Run jshint to lint javascript
            language: system
            entry: npx jshint --config=.jshintrc
            files: \.js$
            exclude: assets/|_js

          - id: stylelint
            name: lint less files
            language: system
            files: \.less$
            entry: npx stylelint --config=.stylelintrc.yml

          - id: lint-shellscripts
            name: lint shellscripts
            language: system
            files: \.sh$
            entry: shellcheck -x --exclude=2001,2148

          - id: build-site
            name: build site
            language: system
            entry: npx grunt build_dev
            files: ^site/.*
            pass_filenames: false
```

## Building the Site

## Deployment
