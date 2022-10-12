---
layout: post
title: Subscribing to podcasts is broken
date: 2015-08-27 20:41
image:
description: These are my humble proposals to fix the podcast subscription problem. Making a few additions to the podcast feed spec would allow podcasting to thrive.
tags:
    - webDev
    - podcasts
sitemap:
    priority: 0.7
    changefreq: monthly
    lastmod: 2016-02-02 15:03
    exclude: false
flags:
    published: true
    expires: never
    noindex: false
    comments: true
---

It has been just over a decade since Apple added a podcast directory to iTunes and podcasting as we know it began in earnest. The recent popularity of a few break out podcasts has led to significant audience growth for this new medium[^1]. Indeed, Podcasting is poised to disrupt terrestrial radio in much the same way Netflix or Hulu disrupted the television industry.

Limiting the continued growth of podcasting are the challenges associated with discovering new content. Sure, finding new podcasts through directories or apps is easy. But the true problem with podcast discovery is the time commitment required to decide if a podcast is worth listening to. Most episodes run between 30-60 minutes. Often a person will need to listen to a few episodes before they can make a decision of whether they want to subscribe long-term or not.

Compounding this problem is that only the most recent episodes are downloaded when a new user subscribes. For some podcasts, such as interview shows or radio shorts that are episodic in nature, this might be the correct behavior. But some of the best podcasts are serialized and need to be heard from the beginning to make sense.

It is surprising that the growth and expansion of podcasting has not lead to any changes to the RSS specification that has been in place since 2001[^2]. I believe it is time to amend the podcast feed spec to better serve the listeners and the nascent podcasting industry. I recommend making the following three additions:

-   **Order Tag** - Will specify the starting place for all new subscribers.
-   **Preview Tag** - Will specify a specific episode as a preview which can be downloaded prior to subscribing.
-   **Best-Of Tag** - In essence, this will allow users to subscribe to a partial episode feed; downloading only the most important episodes.

### The podcast RSS spec

Podcast feeds as they exist today conform to the [RSS 2.0 specification][3] and usually contain some additional tags that were [recommended by Apple][4]. My recommendations are additions to this spec that has not changed for more than a decade.

If you are curious, here's a sample podcast feed taken from Apple:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="https://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
<channel>
  <title>All About Everything</title>
  <link>https://www.example.com/podcasts/everything/index.html</link>
  <language>en-us</language>
  <copyright>&#x2117; &amp; &#xA9; 2014 John Doe &amp; Family</copyright>
  <itunes:subtitle>A show about everything</itunes:subtitle>
  <itunes:author>John Doe</itunes:author>
  <itunes:summary>All About Everything is a show about everything. Each week we dive into any subject known to man and talk about it as much as we can. Look for our podcast in the Podcasts app or in the iTunes Store</itunes:summary>
  <description>All About Everything is a show about everything. Each week we dive into any subject known to man and talk about it as much as we can. Look for our podcast in the Podcasts app or in the iTunes Store</description>
  <itunes:owner>
    <itunes:name>John Doe</itunes:name>
    <itunes:email>john.doe@example.com</itunes:email>
  </itunes:owner>
  <itunes:image href="https://example.com/podcasts/everything/AllAboutEverything.jpg" />
  <itunes:category text="Technology">
  <itunes:category text="Gadgets"/>
  </itunes:category>
  <item>
    <title>Socket Wrench Shootout</title>
    <itunes:author>Jane Doe</itunes:author>
    <itunes:subtitle>Comparing socket wrenches is fun!</itunes:subtitle>
    <itunes:summary>This week we talk about metric vs. Old English socket wrenches. Which one is better? Do you really need both? Get all of your answers here.</itunes:summary>
    <itunes:image href="https://example.com/podcasts/everything/AllAboutEverything/Episode2.jpg" />
    <enclosure url="https://example.com/podcasts/everything/AllAboutEverythingEpisode2.mp3" length="5650889" type="audio/mpeg" />
    <guid>https://example.com/podcasts/archive/aae20140608.mp3</guid>
    <pubDate>Wed, 8 Jun 2014 19:00:00 GMT<pubDate>
    <itunes:duration>4:34</itunes:duration>
  </item>
</channel>
</rss>
```

## Order Tag

To help users begin listening to a podcast at the appropriate time an additional XML tag called `<order>` should be added to the top of `<channel>`. This element could have three values: beginning, recent, guid.

1. **Beginning** - This would tell podcast players to download the oldest episodes in the feed first. In essence, starting a user at the beginning of the podcast. Great for a serialized podcast such as [Serial][1] or [The History of Rome][2].
2. **Recent** - This would mimic the current feed behavior where the most recent episodes are downloaded first. This should be the default value.
3. **guid** - By specifying a specific unique identifier, a podcast creator can specify any particular episode in their feed as the starting point for new subscribers. Following episodes will download in chronological order.

## Preview Tag

Potential listeners to a podcast need a way to decide if they want to commit to subscribing to a new show. Currently, the only option they have is to listen to the first ten minutes or so of whatever episode has been recently posted. This random sampling often does a poor job of selling the show or providing context for a new listener.

Providing a specially recorded _preview_ episode would create a better new listener experience. This would greatly reduce the time commitment currently required by listeners to make a decision on subscribing.

Adding this to a feed would be as easy as keeping a specific `<preview>&</preview>` item at the top of the feed. This item would have all the properties of subsequent podcast items. The only difference would be the enclosing `<preview>&</preview>` tags.

## Best-of Tag

For many listeners, subscribing to tons of podcasts is a losing proposition. There is a tipping point at which any new subscriptions make it impossible to be a podcast completionist[^3]. There are some shows which listeners want to hear every episode. There are others which they prefer to only hear every once and a while.

Making this decision on an episode by episode basis (which to keep and which to delete) is time consuming for listeners. It often leads to unsubscribing from podcasts for no reason other than the sheer number of episodes that have yet to be listened to. A better option, would be providing a way to subscribe to less episodes but more podcasts at a time. Creating a best-of flag would achieve this goal.

Yes, podcasters can always create a separate feed for their self-nominated "most important" episodes. But this splits their subscribers between many feeds. Worse, it adds overhead to discovery marketplaces such as Stitcher and iTunes. Adding a best-of flag to podcast feeds would allow listeners a choice of subscribe to fewer episodes.

Adding this to the feed would be as easy as adding a new tag of `<best-of>VALUE</best-of>` to each `<item>` in the feed. The values would be:

-   **true** - Signifies that a particular episode should be downloaded to users who wish to only subscribe to best of episodes.
-   **false** - Signifies that the episode should only be downloaded to users who subscribe to the full podcast feed.

We need to ensure that this does not effect feeds where the author does not intend to mark their best-of episodes by adding a flag near the top of `<channel>`. This will be in the form of `<best-of-support>true/false</best-of-support>`. Where _true_ will tell podcast apps to enable this functionality; and _false_ will mimic current behavior and be the implied value if this field is missing from the feed.

### Putting it all together

To put this all together, lets take the sample feed I provided above and add each of my recommendations to it. The resulting feed would look like this:

(_Note: I have commented out the pre-existing feed items to make it easier to see my recommended additions._)

```xml
<!-- <?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="https://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
<channel>
  <title>All About Everything</title>
  <link>https://www.example.com/podcasts/everything/index.html</link> -->
  <order>beginning</order>
  <best-of-support>true</best-of-support>
  <!-- <language>en-us</language>
  <copyright>&#x2117; &amp; &#xA9; 2014 John Doe &amp; Family</copyright>
  <itunes:subtitle>A show about everything</itunes:subtitle>
  <itunes:author>John Doe</itunes:author>
  <itunes:summary>All About Everything is a show about everything. Each week we dive into any subject known to man and talk about it as much as we can. Look for our podcast in the Podcasts app or in the iTunes Store</itunes:summary>
  <description>All About Everything is a show about everything. Each week we dive into any subject known to man and talk about it as much as we can. Look for our podcast in the Podcasts app or in the iTunes Store</description>
  <itunes:owner>
    <itunes:name>John Doe</itunes:name>
    <itunes:email>john.doe@example.com</itunes:email>
  </itunes:owner>
  <itunes:image href="https://example.com/podcasts/everything/AllAboutEverything.jpg" />
  <itunes:category text="Technology">
  <itunes:category text="Gadgets"/>
  </itunes:category> -->
<preview>
    <title>Our great podcast preview</title>
    <itunes:author>Jane Doe</itunes:author>
    <itunes:subtitle>Why you should subscribe to our podcast</itunes:subtitle>
    <itunes:summary>Here we give you a brief overview of this show and why you should subscribe</itunes:summary>
    <itunes:image href="https://example.com/podcasts/everything/AllAboutEverything/EpisodePreview.jpg" />
    <enclosure url="https://example.com/podcasts/everything/AllAboutEverythingPreview.mp3" length="5650889" type="audio/mpeg" />
    <guid>https://example.com/podcasts/archive/aae20140607.mp3</guid>
    <pubDate>Wed, 8 Jun 2014 19:00:00 GMT<pubDate>
    <itunes:duration>14:34</itunes:duration>
  </preview>
  <!-- <item>
    <title>Socket Wrench Shootout</title>
    <itunes:author>Jane Doe</itunes:author>
    <itunes:subtitle>Comparing socket wrenches is fun!</itunes:subtitle>
    <itunes:summary>This week we talk about metric vs. Old English socket wrenches. Which one is better? Do you really need both? Get all of your answers here.</itunes:summary>
    <itunes:image href="https://example.com/podcasts/everything/AllAboutEverything/Episode2.jpg" />
    <enclosure url="https://example.com/podcasts/everything/AllAboutEverythingEpisode2.mp3" length="5650889" type="audio/mpeg" />
    <guid>https://example.com/podcasts/archive/aae20140608.mp3</guid>
    <pubDate>Wed, 8 Jun 2014 19:00:00 GMT<pubDate>
    <itunes:duration>4:34</itunes:duration> -->
    <best-of>true</best-of>
 <!-- </item>
</channel>
</rss> -->
```

[1]: https://serialpodcast.org/
[2]: https://thehistoryofrome.typepad.com
[3]: https://cyber.law.harvard.edu/rss/rss.html
[4]: https://www.apple.com/itunes/podcasts/specs.html

[^1]: https://www.nytimes.com/2014/11/24/business/media/serial-podcastings-first-breakout-hit-sets-stage-for-more.html
[^2]: https://en.wikipedia.org/wiki/History_of_podcasting
[^3]: **Podcast Completionist** - (n) A person who listens to every episode of every podcast they subscribe to.
