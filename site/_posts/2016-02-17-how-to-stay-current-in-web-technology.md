---
layout: post
title: How to stay current in web tech without it being your day job
date: 2016-02-17 14:39
image:
description: I am not a writer. I don't have this blog to write. I have it to teach me how to code and keep current in technology. You should too.
tags:
    - webDev
    - jekyll
sitemap:
    priority: 0.7
    changefreq: monthly
    lastmod: 2016-02-18 10:17
    exclude: false
flags:
    published: true
    expires: never
    noindex: false
    comments: true
---

I am not an aspiring writer. I typically don't write on this site to share deep thoughts, business analysis, or to promote myself. I might only post three times a year. If you looked at my Google Analytics, you would laugh at my paltry traffic figures. No, I don't have this blog for the reasons most people do. I have a blog to teach me how to keep current in technology - and you should too.

## The Backstory

In the '90s if you knew a little HTML, could buy a domain name, and could rent space on a server you were considered an _expert_ in the dark arts of digital. You could largely write your own ticket in the job marketplace. I was fortunate to graduate from college in 1996 when the Internet that we know today was a just a baby. I moved to New York City where I [embarked on a career][1] building web businesses and services.

This was a time before there were siloed distinctions between many responsibilities in a digital organization. The roles of product manager, engineer, designer, quality assurance, net ops, digital marketing etc. all blended together into _Webmaster_. The expectation was that you could do it all.

I worked [here][8]. I worked [there][9]. I rose through the ranks. I built web sites and businesses. I learned management, design, marketing, and product. I managed engineering and ops teams. They taught me about code, security, databases, and servers. I gained a surface understanding of languages like CSS, JavaScript, Python, and PHP. A major media organization thought it was a good idea for me to be the person carrying a beeper to keep their Sun Sparc servers running 24/7. So I learned Unix and basic shell scripting.

I became well rounded product manager, entrepreneur, and technologist. But I never learned the classroom basics of computer science. Never wrote an application from top to bottom. Never configured a server from scratch. Never learned the things that would help someone answer [Google's engineering interview questions][15].

Every year, as web technologies became more complex, I became less and less able to do or even understand everything. I am sure the story is the same for many people who _came up_ at the same time I did.

The question kept surfacing. **How can I stay current with technology when my day job no longer involves reviewing code and the tech stack becomes more and more complex?**

## My blogging history

Sometime in the early aughts blogging became the rage. The term was everywhere. I thought I'd add 'blogger' to my resumé and I launched a site powered by [Moveable Type][2]. I spent months tweaking the design, the code, the CMS, and the servers but I think I only wrote a single post.

Then I moved my blog to [Wordpress][3]. I had dreams of writing every day and making a name for myself. After another few months of fiddling with all the codes, I think I wrote three more articles.

A few years later, in a now familiar trend, I moved from Wordpress to [Drupal][4]. Once again, months of tweaking and little writing.

Finally, in 2013 after a decade of fooling myself, I threw in the towel on being a writer. I did replatform my blog once again, but now for different reasons. 2013 saw me move to [Jekyll][5] where my blog still lives today.

**I had finally realized what all this blogging had been about for me. Not writing &mdash; but staying current on design and technology**. Each time I created a site I would treat it as if it were going to be a major media company's Web site. I brought the same expectations for performance, design, SEO, and UX to my own site that I brought to the company's where I worked.

As a consequence, every few years I would:

-   Read about the major fads in web design/development
-   Work with the most recent version of Photoshop
-   Read about and obsessively implement the most current SEO guidelines
-   Write my own HTML templates and CSS
-   Build security procedures to thwart hackers
-   Find a new web host and configure databases and servers
-   Parse through and tweak JavaScript, PHP, Ruby, Python etc. written by people much better at programming than me

As an ancillary benefit, now that I understood what I was creating these sites for I now had something to write about.

## How to stay current in web tech without it being your day job <span class="normaloverride">(or how to go about blogging without writing)</span>

Using my blog as a learning tool has proved very powerful for me. I will list the top-line items you'll need to think through below. Keep in mind that the important thing here is learning. Don't make decisions lightly. Spend your time reading about your options, doing Google searches, trying one approach and then another. Go down the _rabbit hole_.

1. **Pick a platform** - There are many options here but I strongly recommend a [flat-file CMS][10]. Pick one based on the languages you want to use and the support in the community. I selected [Jekyll][5] since I wanted to learn Ruby and write in markdown.
2. **Design and configure your site** - I recommend creating your own design/theme for your site. After all, this is a learning exercise. Some things to focus on:

-   Ensure your site is responsive for mobile and desktop use
-   Write your CSS using a preprocessor ([LESS][12] or [SASS][11])
-   Figure out your file organization and asset pipeline
-   Make sure you understand every configuration option available regardless of whether you change the defaults
-   Put all your code into a private [Github][22] repository

3. **Integrate 3rd parties** - Start integrating the 3rd parties (if any) you want to integrate into your site. [Disqus][13] for comments? Google Analytics for usage data?
4. **SEO** - Take SEO seriously. It's important to understand everything in this space. Some items to make sure you review are:

-   [Schema.org][14] markup
-   [Opengraph][16] tags
-   [Twittercard][17] tags
-   Canonical links for all your content
-   Make sure you have a sitemap.xml

5. **Validate validate validate** - Make sure all your code is correct using services such as the [WC3 Markup Validation Service][18].
6. **Write your build routines** - These routines are run every time you compile your site. Some items to think about here are:

-   Minify your HTML, CSS, etc.
-   Check your site for bad links
-   Compress your images as small as possible
-   Configure a continuous integration engine such as [Jenkins][21].

7. **Configure your host** - I wanted to learn about [Amazon's AWS service][19]. To do so I chose to host my site on AmazonS3 and deliver it to consumers via Amazon's [Cloudfront CDN][20].<br />**Extra credit:** get yourself an SSL certificate and serve your site exclusively via https.
8. **Write a deployment script** - How do you plan on getting your site from your computer to your host. I wrote a custom shell script that does the following:

-   Builds my site
-   Tests the links
-   minifies images and files
-   Deploys to Amazon
-   Busts my CDN cache
-   [Pings external services about new content][27] to be indexed

In following all these steps myself I became proficient in a number of technologies, languages, and services that I wouldn't have learned if I had kept to a Wordpress site using some open source theme. Here's just a partial list of the things I learned by building my Jekyll site.

-   Ruby
-   [Jekyll][5]
-   [Bash scripting][28]
-   [Amazon AWS][19] - Route 53, S3, Cloudfront
-   Working with Restful APIs
-   [Schema markup][14]
-   Git and [Github][22]
-   Advanced use of the command line
-   [Homebrew][23]
-   [Bower][24]
-   [Sublime Text 3][25]
-   [CodeKit][26]
-   Much much more

I look forward to starting over in a few years when it's time to learn a whole new slew of technologies. Let me know your thoughts on keeping current.

[1]: https://natelandau.com/nathaniel-landau-resume/
[2]: https://en.wikipedia.org/wiki/Movable_Type
[3]: https://wordpress.org/
[4]: https://www.drupal.org/
[5]: https://jekyllrb.com/
[6]: https://www.squarespace.com/
[7]: https://www.weebly.com/
[8]: https://www.theglobe.com/
[9]: https://about.com/
[10]: https://github.com/ahadb/flat-file-cms
[11]: https://sass-lang.com/
[12]: https://lesscss.org/
[13]: https://disqus.com/
[14]: https://schema.org/
[15]: https://www.businessinsider.com/15-mind-bending-interview-questions-that-every-google-engineer-can-answer-2012-1?op=1
[16]: https://ogp.me/
[17]: https://dev.twitter.com/cards/markup
[18]: https://validator.w3.org/
[19]: https://aws.amazon.com/
[20]: https://aws.amazon.com/cloudfront/
[21]: https://jenkins-ci.org/
[22]: https://github.com/
[23]: https://brew.sh/
[24]: https://bower.io/
[25]: https://www.sublimetext.com/3
[26]: https://incident57.com/codekit/
[27]: https://natelandau.com/how-to-notify-services-when-post-jekyll/
[28]: https://natelandau.com/bash-scripting-utilities/
