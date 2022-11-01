---
layout: post
title: My MacOS ZSH profile
date: 2022-11-02
image:
description: I've spent years curating a collection of Mac aliases and shortcuts to make my life easier. My full .zshrc is below, feel free to take whatever you find useful and put it to good use.
tags:
    - macOS
    - unix
sitemap:
    priority: 0.3
    changefreq: monthly
    lastmod: 2022-11-02
    exclude: false
flags:
    published: true
    noindex: false
    include_comments: true
---

### A (very) quick primer on .zshrc for Mac users

There is a hidden file in your Mac's user directory named `.zshrc`. This file is loaded before Terminal loads your shell environment and contains all the startup configuration and preferences for your command line interface. Within it you can change your terminal prompt, change the colors of text, add aliases to functions you use all the time, and so much more.

This file is often called a 'dot file' because the '.' at the beginning of it's name makes it invisible in the Mac Finder. You can view all invisible files in the Terminal by typing `ls -al` in any directory.
