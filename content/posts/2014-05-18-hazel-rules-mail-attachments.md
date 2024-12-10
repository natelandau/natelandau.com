---
title: Hazel Rule to Sort Email Attachments
slug: hazel-rules-mail-attachments
date: 2014-05-18 13:11
modified: 2016-02-02 15:03
summary: A Hazel rule to automatically sort attachments from Mac Mail to folders organized by sender.
tags:
    - macos
    - apps
    - productivity
---

I spend an inordinate amount of time downloading email attachments from Mac Mail and sorting them into folders. My challenge was to find a simple process of automatically filing attachments into a folder structure based on the sender of the email. Solving this problem would allow me to increase my productivity by keeping my Downloads folder clean and allowing me to quickly find the files when I needed them.

Google searching for a solution turned up a number of AppleScript based solutions (like [this][3], and [this][4]) but I wanted something simpler. Enter my favorite productivity application, [Hazel][1].

I created a relatively simple Hazel rule which doesn't require any AppleScript or external applications.

![The Hazel rule to sort mail attachments by sender's name]({static}/images/hazel-email-rule.png){: .image-process-responsive}

All told, this simple rule does three things to any attachments I save out of Mac Mail.

1. **Organizes** the attachments by the sender's name
2. **Renames** the attachments by pre-pending the date of the email to the file name.
3. **Adds a comment** to the attachments containing the Sender's name and the date it arrived.

**Todo:** I still need to create Mavericks finder tags based on the available metadata. The only reason this is not done is that I'm still using Mac OS 10.8 on my work computer where most of my attachments arrive. I will update this post once I add that rule.

<a href="{static}/assets/2014-05-18-MailAttachments.hazelrules">Download Hazel Rule</a>

[1]: https://www.noodlesoft.com/hazel
[3]: https://www.markosx.com/thecocoaquest/automatically-save-attachments-in-mail-app/
[4]: https://computers.tutsplus.com/tutorials/effortless-paperless-nirvana-with-mail-hazel-and-evernote--mac-55367
