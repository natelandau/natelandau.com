---
layout: post
title: A JSON content feed for Jekyll
image:
date: 2017-05-20 14:09
description: Creating a JSON feed for a Jekyll site is an important and trivial task. I hope this new spec will lead to a resurgence of interest in supporting content feeds.
tags:
    - jekyll
    - webDev
sitemap:
    priority: 0.7
    changefreq: monthly
    lastmod: 2017-05-20 14:09
    exclude: false
flags:
    published: true
    noindex: false
    comments: true
---

Some fine folks named [Manton Reece][1] and [Brent Simmons][2] have created a JSON feed specification meant to compliment and hopefully replace XML based content feeds like RSS and Atom. Now this might not seem important to any of you but I'm an old stick-in-the-mud and love content feeds. I still get the vast majority of my information from a carefully curated list of RSS feeds that I've been building since the late '90s and that I read through [FeedBin][4].

Nothing irks me more than visiting a great site and finding they don't have an RSS feed for me to subscribe to. XML is not sexy anymore (if it ever was) and JSON has become the lingua franca of the web today. My hope is that this new spec will lead to a resurgence of interest in content feeds.

Luckily, adding a JSON feed to a Jekyll site is a nearly trivial task. Here's the code I added to a new file named `feed.json` at the root of my blog.

{% gist natelandau/7e17b657ed7ac0115480525918e4ff73 %}

A few things to keep in mind as you implement this.

1. The [straightforward specs for the feed][3] explain what fields are optional and which are required.
2. You will notice a number of liquid if/then loops which make use of a number of custom fields I use in my site. These are `post.linkURL`, `post.description`, `post.sitemap.lastmod`, and `post.tags`. I've left this code intact in the hopes it's helpful to someone but be aware you will need to customize the code for your own implementation of Jekyll.
3. I've added a campaign tracking link from Google Analytics to post URLs so that I can see if people actually click through to my site from this feed.

[1]: https://manton.org
[2]: https://inessential.com
[3]: https://jsonfeed.org/version/1
[4]: https://feedbin.com
