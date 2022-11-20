---
layout: post
title: How to notify search engines when you post to Jekyll
date: 2015-05-28 15:28
image:
description: Use a rakefile to ping PingOMatic, Pubsubhubbub, Google, and Bing when you post new content to your Jekyll site.
tags:
    - webDev
    - jekyll
sitemap:
    priority: 0.7
    changefreq: monthly
    lastmod: 2012-11-02 03:03
    exclude: false
flags:
    published: true
    noindex: false
    include_comments: true
---

One of the more challenging parts of building my site on Jekyll has been recreating some of the small features that more popular blogging platforms have supported for years. One of the features that I found missing was an easy way to notify a number of services when I posted new content.

My needs were simple. Whenever I deployed new content to this site I wanted to:

1. **Send an updated sitemap.xml to Google and Bing** so they would rapidly index my new content.
2. **Notify PingOMatic** who in turn notifies a slew of search engines and services.
3. **Ping my RSS feed to [pubsubhubbub](https://pubsubhubbub.appspot.com/)** so subscribers don't wait for a refresh.

I began my journey in solving those problems by repurposing a PHP script I had used for years. I wrote about this some time ago in my [post about creating a Jekyll RSS feed template][3]. This was a far from perfect solution. It required spinning up a web server that could serve PHP and hitting a page to ping the services.

Finally, I've had a chance to implement a better solution. Integrating these notification into my [Rakefile][4] makes pinging these services simple.

If you're not familiar with a Rakefile, don't sweat it, I'm no expert either. In essence, there are likely a number of steps you want to perform before deploying your Jekyll site to the web. Creating a Rakefile which contains these tasks is one way to achieve this goal. I happen to use a combination of a BASH deployment script and rake tasks to deploy my site. Together, these two files

-   Minify my html, css, and JavaScript
-   Test my site for broken links and missing images
-   Compress JPGs and PNG files when necessary
-   Deploys my site to Amazon S3
-   Bump version numbers and bust caches
-   And, now, ping multiple services when I publish

## How to notify these sites from your Rakefile

After numerous [Google searches][5], I added the following code to my Rakefile. I wish I could take take credit for writing it myself but it's like I've said for years: _"The best way to learn code is to steal code."_

```ruby
# Ping Pingomatic
desc 'Ping pingomatic'
task :pingomatic do
  begin
    require 'xmlrpc/client'
    puts '* Pinging ping-o-matic'
    XMLRPC::Client.new('rpc.pingomatic.com', '/').call('weblogUpdates.extendedPing', 'YOURSITE.com' , 'https://YOURSITE.com', 'https://YOURSITE.com/atom.xml')
  rescue LoadError
    puts '! Could not ping ping-o-matic, because XMLRPC::Client could not be found.'
  end
end

# Ping Google
desc 'Notify Google of the new sitemap'
task :sitemapgoogle do
  begin
    require 'net/http'
    require 'uri'
    puts '* Pinging Google about our sitemap'
    Net::HTTP.get('www.google.com', '/webmasters/tools/ping?sitemap=' + URI.escape('https://YOURSITE.com/sitemap.xml'))
  rescue LoadError
    puts '! Could not ping Google about our sitemap, because Net::HTTP or URI could not be found.'
  end
end

# Ping Bing
desc 'Notify Bing of the new sitemap'
task :sitemapbing do
  begin
    require 'net/http'
    require 'uri'
    puts '* Pinging Bing about our sitemap'
    Net::HTTP.get('www.bing.com', '/webmaster/ping.aspx?siteMap=' + URI.escape('https://YOURSITE.com/sitemap.xml'))
  rescue LoadError
    puts '! Could not ping Bing about our sitemap, because Net::HTTP or URI could not be found.'
  end
end

# Ping pubsubhubbub
desc 'Notify pubsubhubbub server.'
task :pingpubsubhubbub do
  begin
    require 'cgi'
    require 'net/http'
    puts '* Pinging pubsubhubbub server'
    data = 'hub.mode=publish&hub.url=' + CGI::escape("https://YOURSITE.com/atom.xml")
    http = Net::HTTP.new('pubsubhubbub.appspot.com', 80)
    resp, data = http.post('https://pubsubhubbub.appspot.com/publish',
                           data,
                           {'Content-Type' => 'application/x-www-form-urlencoded'})
    puts "Ping error: #{resp}, #{data}" unless resp.code == "204"
  end
end # task: pubsubhubbub

# rake notify
desc 'Notify various services about new content'
task :notify => [:pingomatic, :sitemapgoogle, :sitemapbing, :pingpubsubhubbub] do
end
```

Now, to notify PingOMatic, Pubsubhubbub, Google, and Bing when there's new content on my site, all I need to do is run `rake notify` in my terminal. Or, more specifically, I invoke it from my BASH deployment script.

## Usage

To use the code above for your own site, follow these steps:

1. Ensure that you have Ruby and the Rake gem installed on your computer.
2. Create a Rakefile at you site's root.
3. Search the snippet above for `YOURSITE` and replace it with the correct location of your web site and files.
4. Run `rake notify` from your terminal and all the magic should happen.

Don't hesitate to let me know if you have questions. I probably can't answer most of them but I'll do my best to pretend that I'm competent technical support.

[3]: /jekyll-rss-feed-template/
[4]: https://github.com/avillafiorita/jekyll-rakefile
[5]: https://www.google.com/webhp?hl=en#hl=en&q=rake+ping+pingomatic
