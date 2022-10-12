---
layout: post
title: hazel date formatting
date: 2020-01-01
image:
description: TK
tags:
    - macOS
    - productivity
sitemap:
    priority: 0.3
    changefreq: monthly
    lastmod: 2020-01-01
    exclude: false
flags:
    published: true
    expires: never
    noindex: false
    comments: false
---

The lynch-pin of my computer organization is ensuring that all my files are consistently named and filed. I have a folder named `•Inbox` where I place every new file I receive. Once a file is added to my Inbox, I use [Hazel for Mac][1] to rename it to the format `YYYY-MM-DD Filename`. This simple naming scheme allows me to easily find files and know which ones are the most recent.

{% gist natelandau/d2bfe43bc7129b3e1c89be009508f813 cleanFilenames.sh %}

Complications to my clean filename system occur when people email me documents with their own naming formations. Many people add dates at the end of their filenames, or use MM-DD-YY or other date formats. Luckily the indispensable [Hazel][1] lets me filter these out quite easily.

If you're not familiar with Hazel, it is an "always on" Mac application which watches folders and takes any number of configurable actions on files based on rules you define. There are great primers [here][2], [here][3], and [here][4].

## Normalizing other people's dates

The first set of three Hazel rules look for date formats in the filenames and normalizes them into my preferred YYYY-MM-DD format. These rules look for dates in the following formats:

-   mmddyyyy
-   mmddyy
-   mm-dd-yy

[1]: https://www.noodlesoft.com/hazel
[2]: https://www.macstories.net/stories/why-i-started-using-hazel-for-mac/
[3]: https://www.macworld.com/article/1165835/software-utilities/hazel-the-standout-file-organizer-gets-even-smarter.html
[4]: https://computers.tutsplus.com/tutorials/9-hazel-rules-to-increase-your-productivity--mac-47144
