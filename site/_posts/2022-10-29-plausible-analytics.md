---
layout: post
title: Self host web analytics with Plausible
date: 2022-10-29 09:51
image:
description: Plausible has made it easy to move away from Google Analytics
tags:
    - self-hosting
    - webDev
sitemap:
    priority: 0.3
    changefreq: monthly
    lastmod: 2022-10-29 09:51
    exclude: false
flags:
    published: true
    noindex: false
    include_comments: false
---

I am increasingly concerned about the growing big-tech surveillance state. As a worker in tech I know all too well how much personally identifiable information is shared by simply visiting a web site. Google is not the worst company in this regard, but they are certainly one of the most pervasive. **Over the past few years, I have engaged in a never ending game of whack-a-mole to [De-Google](https://en.wikipedia.org/wiki/DeGoogle) my life.**

-   I moved my email and calendar from Gmail to [Fastmail](https://fastmail.com)
-   I stopped using Google Maps in favor of Apple maps
-   I have [requested my data be deleted](https://www.spikenow.com/blog/tips-tricks/how-to-de-google-yourself/) from numerous Google services
-   I use a self-hosted [Whoogle](https://github.com/benbusby/whoogle-search) as my search engine allowing me to access Google's search results without any ads, javascript, AMP links, cookies, or IP address tracking
-   I run a [pi-hole](https://pi-hole.net/) which blocks Google telemetry and ads from all my devices
-   My home [router](https://opnsense.org/) redirects any calls to Google's DNS or NTP servers to other providers

One of the last areas I still relied on Google was for web analytics for this blog and [my band's website](https://strungoutstringband.com).

I chose [Plausible.io](https://plausible.io) to replace Google Analytics for the following reasons:

-   It is **privacy respecting out of the box** and only collects the minimal amount of information necessary to provide top-line analytics
-   It is **open source**
-   **The script is only 1kb** so my static website will continue to have fast page load times
-   It is [simple to self-host.](https://plausible.io/docs/) [Their documentation](https://plausible.io/docs/) is complete and easy to follow
-   **No cross-device or cross-site tracking**
-   **No cookies** and other persistent identifiers
-   Self hosting Plausible allows me to ensure that **data is not sent to any third parties**
-   Plausible offers a paid service, but is FOSS when self-hosted. **Outside of paying for a VPS, this is free**

The first step was figuring out where to host my analytics server. I could host this at home for free but I avoid opening any ports on my home network to the internet. So I set up a small vps at my [my favorite cloud platform](https://linode.com). I don't need anything beefy here, I selected the smallest possible VPS with a total cost $5/month.

Next, I needed a publicly available domain name for this server. I purchased one and moved the DNS to [Cloudflare](https://cloudflare.com)

I created an [Ansible](https://www.ansible.com/) playbook to install all the necessary services on my VPS. If you're not familiar with Ansible, it is a simple but powerful tool to manage remote computers with a series of yaml files.

The full playbook is [publicly available on Github](https://github.com/natelandau/ansible-public-vps).

This playbook performs the following tasks.

-   **Install Docker** on the server
-   **Ensure Cloudflare's proxy always points to the correct IP** address of my VPS with a custom bash script.
-   **Install [Traefik](https://doc.traefik.io/traefik/)** as a reverse proxy
-   **Install [Authelia](https://www.authelia.com/)** for authentication and authorization services
-   **Install [CrowdSec](https://www.crowdsec.net/)** to secure the server itself
-   **Install [Plausible Analytics](https://plausible.io/)** providing statistics for my publicly available web sites.

Configuring Plausible Analytics proved incredibly simple. I only needed to add a few items to the `docker-compose.yml` that they provide in [their git repository](https://github.com/plausible/hosting).

1. Labels to allow Traefik to point to the Plausible container

    ```yaml
    services:
        plausible:
            labels:
                - "traefik.enable=true"
                - "traefik.http.routers.stats.rule=Host(`stats.{{ '{{' }} domain_name }}`)"
                - "traefik.http.routers.stats.entrypoints=web,websecure"
                - "traefik.http.routers.stats.tls.certresolver=letsencrypt"
                - "traefik.http.routers.stats.middlewares=chain-authelia@file"
    ```

2. Add my docker network to the compose file

    ```yaml
    networks:
        traefik_proxy:
            name: traefik_proxy
            external: true
    ```

3. Add my docker network to each service

    ```yaml
    services:
        service-name:
            networks:
              - traefik_proxy
            ...
    ```

4. Allow public access to the analytics service via an Authelia access rule

    ```yaml
    access_control:
        default_policy: deny
        rules:
            - domain: "stats.{{ "{{" }} domain_name }}"
              resources:
                  - '^/js/.*\.js$' # Access to the analytics javascript
                  - "^/api([/?].*)?$" # Access to the API
                  - "^/natelandau.com.*$" # Share the stats publicly
                  - "^/share/.*$" # Allow embedded stats in a web page
              policy: bypass
    ```

The team at Plausible has done an amazing job. [Their documentation](https://plausible.io/docs/) is simple to follow and their self-hosted platform worked flawlessly the first time.

The last step was to edit my Jekyll blog templates to remove Google analytics and replace it with Plausible. [Here's the commit](https://github.com/natelandau/natelandau.com/commit/d5072460a1cb57dd4c70d371e0e2b4741fe4e733) showing the changes.

Now, Google is no longer spying on visitors to this site. I've made the full dashboard available publicly. You can [view it here](https://stats.natenate.org/natelandau.com/).

I can also embed the stats in this site. Awesome.

<iframe plausible-embed src="https://stats.natenate.org/share/natelandau.com?auth=3ntT6WlxVA5HWOR6t-zDr&embed=true&theme=system" scrolling="no" frameborder="0" loading="lazy" style="width: 1px; min-width: 100%; height: 1600px; padding: 10px;"></iframe>
<script async src="https://stats.natenate.org/js/embed.host.js"></script>

There are a few remaining steps that I plan on tackling next.

1. Update [my band's website](https://strungoutstringband.com) to use Plausible
2. Import my old data from Google Analytics using [Plausible's import tool](https://plausible.io/docs/google-analytics-import)
