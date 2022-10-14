Everything required to post, edit, deploy, and manage [natelandau.com](https://natelandau.com).

# Provision Development Container

1. **Open the repository in a Visual Studio Code development Container**.
    - The script `.devcontainer/postCreateCommand.sh` should run automatically to install required packages
2. **Ensure pre-commit is installed** by running `pre-commit install --install-hook`
3. **Authorize Github** using the `gh` cli
    - `gh auth login`
    - Use `SSH` and default values
4. Optionally, run `gh issue list` to make the site better by closing an open issue from Github.
5. That's it. Happy blogging.

# Asset Pipelines and Build Routines

Build the site using pipelines from [Gruntjs](https://gruntjs.com/).

| Command                    | Action                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `grunt build_dev`          | Build the dev site, open a browser window, watch for changes                                              |
| `grunt build_stage`        | Build the staging site, open a browser window                                                             |
| `grunt build_prod`         | Build the production site                                                                                 |
| `grunt build_all`          | Build all versions of the site                                                                            |
| `grunt serve`              | Build the dev site, open it in a browser window and watch for changes                                     |
| `grunt serve_stage`        | Build the staging site and open it in a browser window                                                    |
| `grunt deploy_prod`        | Builds the production site and compresses files with gzip. Use this if uploading to S3 with gzip flag set |
| `grunt build_stage_deploy` | Builds the production site with relative URLS to be deployed to the staging S3 bucket                     |

# Managing the Jekyll site

-   All site assets live in the `site/` directory.
-   Any markdown files within `site/` are automatically converted to html
-   **Edit LESS files for CSS changes**. All CSS files are generated automatically from Grunt routines
-   **Liquid tags can be used in any file** and will be parsed when the site is built

## Responsive Images

The [`jekyll-responsive_image`](https://github.com/wildlyinaccurate/jekyll-responsive-image) plugin automatically creates optimized renditions of images for different sizes. Use this functionality in a post or a page copy and paste the following snippet and edit as needed.

```
{% responsive_image
  path: img/path/to/image.jpg
  alt: "alt..."
  link: "http://somelink.com"
%}
```

Here are the configurable options

-   **path** - The path to the image
-   **alt** - the alt text for the image
-   **link** - When populated by a URL, will wrap the image tag in a link.

## 301 Redirects

[Jekyll Redirect-From](https://github.com/jekyll/jekyll-redirect-from) plugin creates 301 redirects for posts. Useful if a slug/permalink is changed. To use add the following to a post's YAML front-matter.

```yaml
redirect_from:
    - /old/relative/url/
```

## Categories

The categories used for posts are collected in a data file `_data/categories.yml`. This file is used to drive the categories that appear in the footer of the site.

# Deployment

`scripts/deploy-to-s3.sh` syncs changes to S3 to deploy the website. Configure of settings, excludes, and lists of redirects in `deploy-to-s3.yml`

### Run a Github Workflow

Deploy from files in an existing branch on Github by manually running a workflow.

-   Select a workflow from the Github UI
-   Run a workflow locally with `gh workflow run`

## Deploying from local builds

Set the necessary ENV variables.

```bash
export AWS_ACCESS_KEY_ID=[secret]
export AWS_SECRET_ACCESS_K[secret]
export AWS_DEFAULT_REGION=[secret]
```

Build the appropriate version of the site into `_siteProd`

```bash
# Staging site (contains relative URLS, and dummy 3rd party accounts)
grunt build_stage_deploy

# Product site
grunt build_stage
```

Run `scripts/deploy-to-s3.sh` with the appropriate options.

## Automatic deployment

Github actions trigger when changes are committed to certain branches.

-   Commit to `staging` to deploy to the staging S3 bucket
-   Commit to `production` to delete all files from staging, and deploy to the production S3 bucket

# Git Conventions

## Conventional Commits

This project uses [conventional commits](https://github.com/commitizen/cz-cli).

-   To commit changes to git run `cz c`
-   To release a new version run `cz bump` then `git push --tags`

## Detect Secrets

[Detect-secrets](https://github.com/Yelp/detect-secrets) package keeps secrets from being inadvertently added to the repository. If the detect-secrets pre-commit hook fails, follow these steps.

```bash
# Update the baseline (.secrets.baseline)
detect-secrets scan --baseline .secrets.baseline

# Audit the baseline
detect-secrets audit .secrets.baseline
```

## Testing builds with external URLs

Opening a tunnel to a local development environment allows external services such as [Google's Page Speed Insights](https://developers.google.com/speed/pagespeed/insights/) or [Web Page Test](https://www.webpagetest.org) to access a site built and served on localhost.

To spin up these sites use one of:

-   `grunt serve` - development site available at `http://localhost:8080`
-   `grunt serveStage` - staging site available at `http://localhost:8888`

Cloudflared and ngrok are two options for opening a local development port up to the internet.

### Cloudflared

Cloudflare has a robust CLI which can perform many tasks including opening a secure tunnel to localhost. They call this an [Argo Tunnel](https://www.cloudflare.com/products/argo-tunnel/). You can **[install it here](https://developers.cloudflare.com/argo-tunnel/downloads/)**.

Then create a tunnel

```
cloudflared tunnel --url localhost:[port]
```

### ngrok

1. First install [ngrok](https://ngrok.com). Use Homebrew Cask on a Mac by entering `brew cask install ngrok`.
1. Login to ngrok using Github Credentials and add the authToken following instructions on the site.

### Steps to use

1. Build the site using `grunt serveStage`
1. Create the tunnel with `ngrok http [port]` or `ngrok http -subdomain=natenate [port]`

Ngrok will give you a externally facing domain (e.g. \[https://natenate.ngrok.io\]).

Further information available with `ngrok help`
