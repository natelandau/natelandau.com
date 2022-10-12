---
layout: post
title: Jekyll RSS Feed Template
date: 2014-03-24 21:09
image:
description: My customized Jekyll RSS feed template including Google Analytics campaign tracking and pubsubhubbub support.
tags:
    - webDev
    - jekyll
sitemap:
    priority: 0.7
    changefreq: monthly
    lastmod: 2016-07-15 16:42
    exclude: false
flags:
    published: true
    expires: never
    noindex: false
    comments: true
---

I recently moved my personal blog from Wordpress to [Jekyll][1]. I made this move primarily as a way to keep my webdev chops current and experiment with Ruby, Amazon S3, Cloudfront, and Markdown. The act of porting my site into Jekyll was fraught with learning opportunities some of which I will begin to document here to help others (as [so many][2] [have][3] [helped me][4].)

RSS remains my most used form of content discovery. (Sorry Twitter, Facebook, and others.) It is important to me that my site cater to throwbacks like myself and contain an easily findable RSS feed.

Out-of-the-box Jekyll does not create an RSS feed for you. Like so much else that makes me love Jekyll, you need to think about and craft by hand all the functionality you want on your site. No bloat. No unnecessary features. After much searching I found some great starting points but none of them accomplished all of what I needed. My requirements were as follows:

-   **Atom as opposed to RSS**. ([This old debate][5] probably doesn't mean much to folks who weren't building Web sites in the early naughts.)
-   **Support for the [pubsubhubbub][6] protocol.**
-   **Usage tracking via Google Analytics [campaign variables][7].**

## 1. atom.xml

I created a document named `atom.xml` at my Jekyll docroot. Here is the template I placed within this file:

```xml
---
layout: nil
title : Atom Feed
---
{% raw %}
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="https://www.w3.org/2005/Atom">
<link rel="hub" href="https://pubsubhubbub.appspot.com" />

  <title type="text" xml:lang="en">{{ site.name }}</title>
    <link type="application/atom+xml" href="{{ site.baseurl }}/atom.xml" rel="self"/>
    <link href="{{ site.baseurl }}/"/>
  <updated>{{ site.time | date: "%Y-%m-%dT%H:%M:%SZ" }}</updated>
  <id>{{ site.baseurl }}/</id>
  <author>
    <name>{{ site.author.name }}</name>
    <email>{{ site.author.email }}</email>
  </author>
  <rights type="text">Copyright © {{ site.time | date: "%Y" }} {{ site.author }}. All rights reserved.</rights>
  {% for post in site.posts limit:10 %}
  <entry>
    <title>{{ post.title | xml_escape }}</title>
    <link rel="alternate" type="text/html" href="{{ site.baseurl }}{{ post.url }}/?utm_source=RSS&amp;utm_medium=RSS&amp;utm_campaign={{ post.title | replace: ',','' | replace: ' ', '' | xml_escape }}" />
    <published>{{ post.date | date: "%Y-%m-%dT%H:%M:%SZ" }}</published>
    <updated>{{ post.date | date_to_xmlschema }}</updated>
    <id>{{ site.baseurl }}{{ post.id }}</id>
    <content type="html"><![CDATA[ {{ post.content | markdownify }} ]]></content>
  </entry>
  {% endfor %}

</feed>
{% endraw %}
```

This correctly formatted atom feed does a few things that other templates I found did not do.

1. The line `<link rel="hub" href=https://pubsubhubbub.appspot.com />` tells feed readers to subscribe to changes via pubsubhubbub. Allowing for rapid content updates when new content is posted without waiting for a feed reader to re-poll my site.
2. I appended each link with this code `{% raw %}?utm_source=RSS&amp;utm_medium=RSS&amp;utm_campaign={{ post.title }}"{% endraw %}` which tells Google Analytics to record ever click through my feed as a campaign variable of Source: RSS, Medium: RSS, Campaign: Post Title. The additional filters placed on the post title `{% raw %}{{ post.title | replace: ',','' | replace: ' ', '' | xml_escape }} {% endraw %}` allow the post title to be passed as a single variable to G.A.

## 2. Automatic Feed Discovery

To make the existence of my RSS feed known to browsers, I added this code to my `<head>`.

```html
{% raw %}
<link rel="alternate" type="application/atom+xml" title="{{ site.name }}" href="{{ site.baseurl }}/atom.xml" />
{% endraw %}
```

## 3. pubsubhubbub notification

The last step was to notify pubsubhubbub everytime there was a new update to the feed. If you read my blog, you probably know that I'm not a programmer. So I did what any enterprising non-coder would do, I scoured Github for someone who had already solved this problem.

I found [this amazingly simple PHP script][8] which not only notifies pubsubhubbub but also pings a number of other web services. After configuring the variables, simply ping the script when you've posted new content and feed readers will be notified of your updates.

#### To Do

One day I plan on scripting this ping into my Jekyll deployment script so I don't need to do it manually....Haven't gotten around to that yet.

Extra bonus points. If any of you know Ruby and can tell me how to replace the functionality in the PHP ping script with a Rakefile task, I'll buy you a beer or five.

**UPDATE** I finally figured out how to ping pubsubhubbub without that PHP script. [I've posted about it on this blog][9].

[1]: https://jekyllrb.com/
[2]: https://metaskills.net/2013/09/02/jekyll-tips-and-tricks/
[3]: https://yeswejekyll.com/
[4]: https://paulstamatiou.com/hosting-on-amazon-s3-with-cloudfront/
[5]: https://blog.webreakstuff.com/2005/07/rss-vs-atom-you-know-for-dummies/
[6]: https://code.google.com/p/pubsubhubbub/
[7]: https://support.google.com/analytics/answer/1033863?hl=en
[8]: https://github.com/hamstu/static-ping
[9]: /how-to-notify-services-when-post-jekyll/
