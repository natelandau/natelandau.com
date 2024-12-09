---
title: A JSON content feed for Jekyll
slug: a-json-feed-for-jekyll
date: 2017-05-20 14:09
summary: Creating a JSON feed for a Jekyll site is an important and trivial task. I hope this new spec will lead to a resurgence of interest in supporting content feeds.
tags:
    - jekyll
    - webDev
---

Some fine folks named [Manton Reece][1] and [Brent Simmons][2] have created a JSON feed specification meant to compliment and hopefully replace XML based content feeds like RSS and Atom. Now this might not seem important to any of you but I'm an old stick-in-the-mud and love content feeds. I still get the vast majority of my information from a carefully curated list of RSS feeds that I've been building since the late '90s and that I read through [FeedBin][4].

Nothing irks me more than visiting a great site and finding they don't have an RSS feed for me to subscribe to. XML is not sexy anymore (if it ever was) and JSON has become the lingua franca of the web today. My hope is that this new spec will lead to a resurgence of interest in content feeds.

Luckily, adding a JSON feed to a Jekyll site is a nearly trivial task. Here's the code I added to a new file named `feed.json` at the root of my blog.

```json
---
layout: null
---
{
  "version": "https://jsonfeed.org/version/1",
  "title": {{ site.name | jsonify }},
  "home_page_url": "{{ site.baseurl }}/",
  "feed_url": "{{ site.baseurl }}/feed.json",
  "description": {{ site.tagline | jsonify }},
  "favicon": "{{ site.baseurl }}/assets/icons/favicon-96x96.png",
  "icon": "{{ site.baseurl }}/assets/icons/apple-touch-icon.png",
  "author": {
      "name": {{ site.author.name | jsonify }},
      "url": "{{ site.baseurl }}/",
  },
  "expired": "false",
  "items": [
{% for post in site.posts limit:15 %}
    {
      "id": "{{ post.id }}",
      "url": "{{ site.baseurl }}{{ post.url }}?utm_source=jsonFeed&amp;utm_medium=jsonFeed&amp;utm_campaign={{ post.title | replace: ',','' | replace: ' ', '' | handleize | xml_escape }}",
      "title": {{ post.title | jsonify }},
      "content_html": {{ post.content | jsonify }},
      {% if post.description %}"summary": {{ post.description  | jsonify }},{% endif %}
      {% if post.tags %}"tags":  [ "{{post.tags | join: '","'}}" ],{% endif %}
      {% if post.linkURL %}"external_url": "{{ post.linkURL }}",{% endif %}
      "date_published": "{{ post.date | date_to_xmlschema }}",
      "date_modified": "{% if post.sitemap.lastmod == null %}{{ post.date | date_to_xmlschema }}{% else %}{{ post.sitemap.lastmod | date_to_xmlschema }}{% endif %}"
    }{% unless forloop.last == true %},{% endunless %}
{% endfor %}
  ]
}
```

A few things to keep in mind as you implement this.

1. The [straightforward specs for the feed][3] explain what fields are optional and which are required.
2. You will notice a number of liquid if/then loops which make use of a number of custom fields I use in my site. These are `post.linkURL`, `post.description`, `post.sitemap.lastmod`, and `post.tags`. I've left this code intact in the hopes it's helpful to someone but be aware you will need to customize the code for your own implementation of Jekyll.
3. I've added a campaign tracking link from Google Analytics to post URLs so that I can see if people actually click through to my site from this feed.

[1]: https://manton.org
[2]: https://inessential.com
[3]: https://jsonfeed.org/version/1
[4]: https://feedbin.com
