[![Test Builds](https://github.com/natelandau/natelandau.com/actions/workflows/test_builds.yml/badge.svg)](https://github.com/natelandau/natelandau.com/actions/workflows/test_builds.yml)

Everything required to post, edit, deploy, and manage [natelandau.com](https://natelandau.com).

# Getting Started

1. **Open the repository in a Visual Studio Code development Container**.
    - The script `.devcontainer/postCreateCommand.sh` should run automatically to install required packages
2. **Ensure pre-commit is installed** by running `pre-commit install --install-hook`
3. **Authorize Github** using the `gh` cli
    - `gh auth login`
    - Use `SSH` and default values
4. Optionally, run `gh issue list` to make the site better by closing an open issue from Github.
5. That's it. Happy blogging.

# Adding and Deploying Content

-   All site assets live in the `site/` directory.
-   Any markdown files within `site/` are automatically converted to html
-   **Edit LESS files for CSS changes**. All CSS files are generated automatically from Grunt routines
-   **Liquid tags can be used in any file** and will be parsed when the site is built
-   Preview changes locally using `grunt serve`

## Posts and Templates

### Responsive Images

The [`jekyll-responsive_image`](https://github.com/wildlyinaccurate/jekyll-responsive-image) plugin automatically creates optimized renditions of images for different sizes. Use this functionality in a post or a page copy and paste the following snippet and edit as needed.

```
{% responsive_image
  path: img/path/to/image.jpg
  alt: "alt..."
  link: "https://somelink.com"
%}
```

Here are the configurable options

-   **path** - The path to the image
-   **alt** - the alt text for the image
-   **link** - When populated by a URL, will wrap the image tag in a link.

### 301 Redirects for Posts

[Jekyll Redirect-From](https://github.com/jekyll/jekyll-redirect-from) plugin creates 301 redirects for posts. Useful if a slug/permalink is changed. To use add the following to a post's YAML front-matter.

```yaml
redirect_from:
    - /old/relative/url/
```

**Note:** Redirects for pages not managed by Jekyll are contained in `deploy_to_s3.yml`

### Comments

Comments are provided by [Giscus](https://giscus.app/) ([Github repo](https://github.com/giscus/giscus))

To moderate, use the Github Discussions web interface.

### Categories

The categories used for posts are collected in a data file `_data/categories.yml`. This file is used to drive the categories that appear in the footer of the site.

## Build Pipelines

Build the site using pipelines from [Gruntjs](https://gruntjs.com/).

These pipelines:

-   Compile LESS into CSS
-   Lint files
-   Build with Jekyll
-   Minify & Compress files
-   Serve locally and watch for changes

| Command              | Action                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `grunt build_dev`    | Build the dev site, open a browser window, watch for changes                                              |
| `grunt build_stage`  | Build the staging site                                                                                    |
| `grunt build_prod`   | Build the production site                                                                                 |
| `grunt build_all`    | Build all versions of the site                                                                            |
| `grunt serve`        | Build the dev site, open it in a browser window and watch for changes                                     |
| `grunt deploy_stage` | Builds the staging site and compresses files with gzip. Use this if uploading to S3 with gzip flag set    |
| `grunt deploy_prod`  | Builds the production site and compresses files with gzip. Use this if uploading to S3 with gzip flag set |

| `grunt links` | Checks all posts for broken links |

## Deploying Changes

Always follow these steps to deploy the site

1. Make changes in `main`
2. Run `grunt serve` and QA the site locally
3. Sync merge `main` into `staging` to kick off a deployment to the staging S3 bucket

    ```bash
    # Enter the staging branch
    git checkout staging

    # Merge all commits to `main` into `staging`
    git merge main

    # Push changes to Github
    git push
    ```

4. QA the staging site on S3
5. Deploy to production to delete all files from the staging bucket and deploy to production

    ```bash
    # Enter the staging branch
    git checkout production

    # Merge all commits to `main` into `staging`
    git merge main

    # Push changes to Github
    git push
    ```

#### Manually run a Github workflow

To force the running of a Github workflow via the Github CLI follow these steps:

1. Authenticate with Github: `gh auth login`
2. Select a workflow to run: `gh workflow run`. To run from a branch add `--ref="branch_name"`

### Deploy from Local

It is possible to deploy the site without using Github workflows.

Set the necessary ENV variables.

```bash
export AWS_ACCESS_KEY_ID=[secret]
export AWS_SECRET_ACCESS_K[secret]
export AWS_DEFAULT_REGION=[secret]
```

Build the appropriate version of the site

```bash
# Staging site
grunt deploy_stage

# Production site
grunt deploy_prod
```

Run `scripts/deploy-to-s3.sh` with the appropriate options.

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
