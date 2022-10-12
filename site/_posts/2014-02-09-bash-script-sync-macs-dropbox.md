---
layout: post
title: Dropbox - Script to Sync Multiple Macs
date: 2014-02-09 21:15:04
image:
description: For years I used a combination of tactics to keep directories in sync between my many computers. Now I just use this simple bash script which syncs multiple macs with Dropbox using symbolic links.
tags:
    - macOS
    - unix
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

I keep a complex set of files in sync between my various computers. These range from '~/Documents/' to application preferences from '~/Library/Application Support/' to sundry other files in use around my computer. The syncing script in this post _automagically_ takes any number of files in Dropbox and creates symlinks from them to the appropriate places on my computer.

_Update May 27, 2014_ - Updated script with better error handling and fixed two bugs.

Back in the day I used an FTP client called [Interarchy][1] to sync folders, then I moved to [Transmit][2]. Later I created a series of custom rsync scripts which I ran via Cron. All of these solutions were sub-par and required a lot of manual effort to either start the sync or to update my rsync bash scripts.

Sometime in mid 2013 I finally decided to get on board with using [Dropbox][3] for more than saving application specific data and embarked on a path to use it as my canonical source for all synced files.

The script in this post accomplishes three critical tasks:

1. **Instant Setup.** Whenever I get a new computer all I need to do is install Dropbox and run this script and all my files are where I want them.
2. **Low Maintenance.** Adding a new file to be synced is as easy as dragging it into the appropriate folder in Dropbox and running the script.
3. **Automated Syncing.** Unlike my previous systems which relied on remembering to initiate a sync or toying with Cron, Dropbox just works. Symlinks just work. Period.

#### IMPORTANT DISCLAIMER

**Backup all your files to a secure location.** I don't want to be responsible for you losing anything critical.

## The Syncing Folder Structure

I desired a system where all that was needed was moving a folder into a specific directory for the script to know where to create the symlink. To allow for this, I created a folder structure in Dropbox that allows me to keep all my synced folders in a single location.

The structure is as follows:

```
|-- ~/Dropbox/
          |-- sharedConfiguration/
                   |-- setupScripts/
                   |-- assets/
                          |-- ApplicationSupportBase/
                          |-- ApplicationSupportComplex/
                          |-- dotFiles/
                          |-- Library/
                          |-- Home/
```

As we move through the script in detail there is a more in-depth description of each folder and how to work with it. In brief:

-   **sharedConfiguration:** I have the entirety of this folder backed up hourly to S3 via my favorite backup application [Arq][5] to ensure nothing is ever lost even if Dropbox disappears <i class="fa fa-smile-o"></i>.
-   **setupScripts:** contains all my bash scripts - including the one in this post.
-   **assets:** Contains the folders to be synced.
-   **ApplicationSupportBase:** Contains application settings from '~/Library/Application Support/' where the _whole folder_ should be synced
-   **ApplicationSupportComplex:** Contains application settings from '~/Library/Application Support/' where the only _parts of the folder_ should be synced.
-   **dotFiles:** Contains my '.bash_profile', '.gitconfig', '.bash_history', etc.
-   **Library:** Any files placed here will be synced from the root of '~Library/'.
-   **Home:** Anything dropped here is synced to my user home folder.

# The Script

I will be explaining each part of the syncing script in detail. If you want to skip the elaborations and jump directly to the full version, it is available for your copy-paste pleasure at the bottom of this post.

## Dropbox syncing with symlinks

The process of syncing a folder with multiple computers using Dropbox is simple if you don't mind firing up Terminal.app and creating a simple [symlink][4].

For example, if you wanted to sync your '~/Documents/' folder between multiple computers using Dropbox you would follow these steps.

1. Copy your `~/Documents/` folder to Dropbox
2. Delete the `~/Documents/` folder on your computer
3. Create a symlink from the folder on Dropbox to your User folder like so: `ln -s ~/Dropbox/Documents/ ~/Documents`

_Easy right?_ Now we just need to automate that with our script.

## Script basics

Here's a brief primer on how to get this script to function.

1. Open a plain text editor of your choice
2. Create a file named `createSymlinks.sh` and save it to your desired location. I keep mine in Dropbox like so `~/Dropbox/sharedConfiguration/setupScripts/createSymlinks.sh`
3. Copy and paste the full script at the bottom of this post.
4. Make the script executable by running this command in _Terminal_ `chmod a+x ~/YOUR-PATH-HERE/createSymlinks.sh`
5. Go through each section and configure it to match you needs and directory structure.

## Section 1: Setting Colors and Checking for Dropbox

This first part of the script sets our color variables for nice output in Terminal, confirms that we have Dropbox installed, and allows us to set some variables to locate our directory locations

####Check for Dropbox This simple if/then statement makes sure that Dropbox has been installed. It does this by looking for the existence of `$HOME/Dropbox/`.

```bash
# Is Dropbox Installed?
# If you have Dropbox installed in a nonstandard location, update it appropriately here.

if [ ! -d ""$HOME"/Dropbox" ]; then
  e_error "DROPBOX NOT FOUND"
  e_error "Without Dropbox we will exit"
  e_error "EXITING"
  exit 1
fi
```

#### Set Local Variables

Here you can set two variables which will be called throughout the rest of the script.

```bash
# Set Directory Locations
# dropbox_assets_dir: This is the location of your 'assets' directory
# backup_dir: This script will copy any existing files to a backup folder.  Place your desired path here.

dropbox_assets_dir="$HOME"/Dropbox/sharedConfiguration/assets
backup_dir="$HOME"/Desktop/Backups/$(date "+%Y-%m-%d-%H_%M")
```

**dropbox_assets_dir:** Where your assets are located. If you mirrored my folder structure you can leave this alone.

**backup_dir:** I tried to make the script as non-destructive as possible. It will check for the existence of files before deleting them and will move them into a date-stamped Backup. The default is to place this on your Desktop. If you are happy with that, you can leave it alone.

## Section 2: Sync Dotfiles

This section will read every file within the 'assets/dotfiles' folder and create a symlink of the file to your user folder. I'll take a minute to break down how this section works since all the other sections follow a similar methodology.

#### Variables

The first section contains three variables. You should set these to match your directory structure.

```bash
ASSETS="$dropbox_assets_dir"/dotFiles/*
SOURCE="$dropbox_assets_dir"/dotFiles/
DEST="$HOME"/
```

#### The FOR Loop

This tells the script to run itself _for_ every file or directory it finds within 'ASSETS'.

```bash
for f in $ASSETS
  do
```

#### Check for Existing Symlink

Here we are checking for the existence of the file as a symlink in the 'DEST' location (in this case that means your home folder). If the file is already a symlink to the version on Dropbox we simply let you know and move on.

```bash
if [ -L "$DEST"`basename "$f"` ]; then
  e_success "Already Linked: "$DEST"`basename "$f"`"
else
```

#### Create the symlinks

This section is the meat of the script. First, we check for the existence of the file in the destination directory. If it already exists (but is not a symlink - _see above_) we do the following:

1. Check for the existence of our backup directory and create it if necessary
2. Move the pre-existing asset to the backup directory
3. Create a symbolic link from the asset in Dropbox to the destination directory.

If the asset doesn't exist we simply create the symbolic link.

```bash
if [ -f "$DEST"`basename "$f"` ]; then
  if [ ! -d "$backup_dir"/dotfiles ]; then
    mkdir -p "$backup_dir"/dotfiles
  fi
  mv "$DEST"`basename "$f"` "$backup_dir"/dotfiles/`basename "$f"`
  ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
else
  ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
fi
```

In a nutshell, that is how this script works its magic. Now on to the other sections....

## Section 3: Symlinks to your Library Folder

This section takes every directory found in 'sharedConfiguration/assets/Library/' and creates symlinks of them to '~/Library/'. This mechanism makes it simple to add a new directory in the future, simply copy it into your 'ASSETS' dir and run the script. _Easy._

I use this to sync the following folders between computers:

```
|-- ~/Library/
          |-- Fonts/
          |-- Quicklook/
          |-- Scripts/
          |-- Spelling/
```

## Section 4: Syncing Application Support

This section works almost identically to Section 3. The only way it differs is in the location of the 'ASSETS' and 'DEST'. Any folders placed within 'ApplicationSupportBase/' (if you're following my structure) will be synced from Dropbox to your '~/Library/Application Support' folder. _Instant preferences syncing_.

**Note:** For some applications (OmniFocus and Sublime Text come to mind) only parts of their preferences can be synced between machines. We'll get to that in Section 5.

Here's are the applications I keep in sync via Dropbox with this script

```
|-- ~/Library/Application Support/
              |-- appsolute/
              |-- Coda 2/
              |-- Marked
              |-- nvALT
              |-- OmniGraffle
              |-- PopClip
              |-- Tower
              |-- XLD
```

## Section 5: Syncing Application Support Subfolders

This section gets marginally more complicated. Here we sync sub-folders from Application Support from Dropbox. To simplify, if you have the following structure

```
|-- ~/Dropbox/sharedConfiguration/assets/ApplicationSupportComplex/
                                            |-- A/
                                               |-- aa/
                                               |-- cc/
```

The directories 'aa' and 'bb' will be symlinked into a folder with more subdirectories.

```
|-- ~/Library/Application Support/
              |-- A/
                |-- aa/  (➜Symlink)
                |-- bb/
                |-- cc/   (➜Symlink)
                |-- dd/
```

Some examples of applications who treat their settings like this are Sublime Text 3, LaunchBar, and OmniFocus.

If you look in '~/Library/Application Support/Sublime Text 3' you will see five folders but only two of them can be synced between computers. Placing 'Sublime Text 3' into your 'ASSETS' folder for this section will only symlink the subfiles within it to the 'Sublime Text 3' folder in your Library leaving all the others alone.

```
|-- ~/Dropbox/sharedConfiguration/assets/ApplicationSupportComplex/
                      |-- Sublime Text 3/
                          |-- Installed Packaged
                          |-- Packages
```

## Section 6: Sync Directories in your home folder

The final section of the script takes anything linked in the ASSETS directory and creates a symlink to your root user folder. I use this to keep my '~/Desktop', '~/Downloads', '~/Documents', and other folders in sync across multiple computers.

I'd love to hear your opinion about using Dropbox as the location of your '~/Downloads' folder. I keep thinking it might not be wise but I have it there for now.

---

## The Full Script

Here is the complete script for you to edit and use at will. Let me know your thoughts in the comments. I hope you find it as useful as I have.

```bash
#!/bin/bash

###
#
# 1.    Configuration Variables
# 2.    Symlink Dotfiles
# 3.    Symlinks to Library/*
# 4.    Symlinks to ~/Library/Application Support/*
# 5.    Symlinks to ~/Library/Application Support/*/*
# 6.    Symlinks to ~/
#
###

#
# 1.  Configuration Variables and Preamble
#

# Set Colors

e_header() { printf "\n$(tput setaf 141)%s$(tput sgr0)\n" "$@"
}
e_success() { printf "$(tput setaf 64)✔ %s$(tput sgr0)\n" "$@"
}
e_error() { printf "$(tput setaf 1)✖ %s$(tput sgr0)\n" "$@"
}
e_warning() { printf "$(tput setaf 136)➜ %s$(tput sgr0)\n" "$@"
}

# Is Dropbox Installed?
# If you have Dropbox installed in a nonstandard location, update it appropriately here.

if [ ! -d ""$HOME"/Dropbox" ]; then
  e_error "DROPBOX NOT FOUND"
  e_error "Without Dropbox we will exit"
  e_error "EXITING"
  exit 1
else

  # Set Directory Locations
  # dropbox_assets_dir: This is the location of your 'assets' directory
  # backup_dir: Desired path to a backup folder goes here here.

  dropbox_assets_dir="$HOME"/Dropbox/sharedConfiguration/assets
  backup_dir="$HOME"/Desktop/Backups/$(date "+%Y-%m-%d-%H_%M")

  sudo -v # ask for password only at the beginning

  e_header "---------- BEGINNING CONFIG SCRIPT ----------"
  e_header "Hang tight.......here we go....."

  # 2.    Symlinks to ~/Dotfiles
  #
  #       Takes all files found in "$dropbox_assets_dir"/dotFiles/
  #       and symlinks them to ~/

  ASSETS="$dropbox_assets_dir"/dotFiles/*
  SOURCE="$dropbox_assets_dir"/dotFiles/
  DEST="$HOME"/

  e_header "---------- Symlinking Dotfiles ----------"

  shopt -s dotglob    #show dot files
  if [ ! -d "$SOURCE" ]; then
    e_error "Can't find source directory: $SOURCE"
  else
    for f in $ASSETS
    do
      if [ -L "$DEST"`basename "$f"` ]; then
        e_success "Already Linked: "$DEST"`basename "$f"`"
      else
        e_warning "Linking : `basename "$f"`"
        if [ -f "$DEST"`basename "$f"` ]; then
          if [ ! -d "$backup_dir"/dotfiles ]; then
            mkdir -p "$backup_dir"/dotfiles
          fi
          mv "$DEST"`basename "$f"` "$backup_dir"/dotfiles/`basename "$f"`
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        else
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        fi
      fi
    done
  fi
  source $HOME/.bash_profile
  shopt -u dotglob    #reset dotglob
  unset ASSETS
  unset SOURCE
  unset DEST

  # 3.    Symlinks to ~Library/*
  #
  #       Takes all dirs found in "$dropbox_assets_dir"/Library/
  #       and symlinks them to ~/Library/

  e_header "---------- Symlinking into ~/Library ----------"

  ASSETS="$dropbox_assets_dir"/Library/*
  SOURCE="$dropbox_assets_dir"/Library/
  DEST="$HOME"/Library/

  # set IFS to allow spaces in names
  SAVEIFS=$IFS
  IFS=$(echo -en "\n\b")
  if [ ! -d "$SOURCE" ]; then
    e_error "Can't find source directory: $SOURCE"
  else
    if [ ! -d "$DEST" ]; then
      mkdir -p "$DEST"
    fi
    for f in $ASSETS
    do
      if [ -L "$DEST"`basename "$f"` ]; then
        e_success "Already Linked: "$DEST"`basename "$f"`"
      else
        e_warning "Linking : "$DEST"`basename "$f"`"
        if [ -e "$DEST"`basename "$f"` ]; then
          if [ ! -d "$backup_dir" ]; then
            mkdir -p "$backup_dir"
          fi
          sudo mv "$DEST"`basename "$f"` "$backup_dir"/`basename "$f"`
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        else
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        fi
      fi
    done
  fi
  # restore $IFS
  IFS=$SAVEIFS
  unset ASSETS
  unset SOURCE
  unset DEST

  # 4.    Symlinks to ~/Library/Application Support/*
  #
  #       This script takes all directories found in
  #       "$dropbox_assets_dir"/ApplicationSupportBase/
  #       and symlinks them to ~/Library/Application Support/

  e_header "---------- Symlinking into ~/Library/Application Support/ ----------"

  ASSETS="$dropbox_assets_dir"/ApplicationSupportBase/*
  SOURCE="$dropbox_assets_dir"/ApplicationSupportBase/
  DEST="$HOME"/Library/Application\ Support/

  # set IFS to allow spaces in names
  SAVEIFS=$IFS
  IFS=$(echo -en "\n\b")
  if [ ! -d "$SOURCE" ]; then
    e_error "Can't find source directory: $SOURCE"
  else
    if [ ! -d "$DEST" ]; then
      mkdir -p "$DEST"
    fi
    for f in $ASSETS
    do
      if [ -L "$DEST"`basename "$f"` ]; then
        e_success "Already Linked: "$DEST"`basename "$f"`"
      else
        e_warning "Linking : "$DEST"`basename "$f"`"
        if [ -e "$DEST"`basename "$f"` ]; then
          if [ ! -d "$backup_dir" ]; then
            mkdir -p "$backup_dir"
          fi
          mv "$DEST"`basename "$f"` "$backup_dir"/`basename "$f"`
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        else
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        fi
      fi
    done
  fi
  # restore $IFS
  IFS=$SAVEIFS
  unset ASSETS
  unset SOURCE
  unset DEST

  # 5.    Symlinks to ~/Library/Application Support/*/*
  #
  #       This script takes all directories found in
  #       "$dropbox_assets_dir"/ApplicationSupportComples/*/
  #       and symlinks them to ~/Library/Application Support/*/
  #       i.e - Goes one level deep for symlinks.

  e_header "---------- Symlinking into ~/Library/Application Support/*/ ----------"

  # set IFS to allow spaces in names
  SAVEIFS=$IFS
  IFS=$(echo -en "\n\b")

  ASSETS="$dropbox_assets_dir"/ApplicationSupportComplex/*
  SOURCE="$dropbox_assets_dir"/ApplicationSupportComplex/
  DEST="$HOME"/Library/Application\ Support/

  if [ ! -d "$SOURCE" ]; then
    e_error "Can't find source directory: $SOURCE"
  else
    for f in $ASSETS
    do
      ASSETS2="$SOURCE"`basename "$f"`/*
      SOURCE2="$SOURCE"`basename "$f"`/
      DEST2="$DEST"`basename "$f"`/
      BACKUP2="$backup_dir"/`basename "$f"`/
      if [ ! -d "$DEST2" ]; then
        mkdir -p "$DEST2"
      fi
      for g in $ASSETS2
      do
        if [ -L "$DEST2"`basename "$g"` ]; then
          e_success "Already Linked: "$DEST2"`basename "$g"`"
        else
          e_warning "Linking : "$SOURCE2"`basename "$g"`"
          if [ -e "$DEST2"`basename "$g"` ]; then
            if [ ! -d "$BACKUP2" ]; then
              mkdir -p "$BACKUP2"
            fi
            mv "$DEST2"`basename "$g"` "$BACKUP2"`basename "$g"`
            ln -s "$SOURCE2"`basename "$g"` "$DEST2"`basename "$g"`
          else
            ln -s "$SOURCE2"`basename "$g"` "$DEST2"`basename "$g"`
          fi
        fi
      done
    done
  fi
  # restore $IFS
  IFS=$SAVEIFS

  unset ASSETS
  unset SOURCE
  unset DEST
  unset ASSETS2
  unset SOURCE2
  unset DEST2
  unset BACKUP2

  # 6.    Symlinks to ~/
  #
  #       Creates symlinks to dirs at the base ~/ directory

  e_header "---------- Symlinking into ~/  ----------"

  ASSETS="$dropbox_assets_dir"/Home/*
  SOURCE="$dropbox_assets_dir"/Home/
  DEST="$HOME"/

  # set IFS to allow spaces in names
  SAVEIFS=$IFS
  IFS=$(echo -en "\n\b")
  if [ ! -d "$SOURCE" ]; then
    e_error "Can't find source directory: $SOURCE"
  else
    if [ ! -d "$DEST" ]; then
      mkdir -p "$DEST"
    fi
    for f in $ASSETS
    do
      if [ -L "$DEST"`basename "$f"` ]; then
        e_success "Already Linked: "$DEST"`basename "$f"`"
      else
        e_warning "Linking : "$DEST"`basename "$f"`"
        if [ -e "$DEST"`basename "$f"` ]; then
          if [ ! -d "$backup_dir" ]; then
            mkdir -p "$backup_dir"
          fi
          sudo mv "$DEST"`basename "$f"` "$backup_dir"/`basename "$f"`
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        else
          ln -s "$SOURCE"`basename "$f"` "$DEST"`basename "$f"`
        fi
      fi
    done
  fi
  # restore $IFS
  IFS=$SAVEIFS
  unset ASSETS
  unset SOURCE
  unset DEST

  #
  # Notify if Backups were created of any files above
  #
  e_header "---------- Processing Backups  ----------"
  if [ -e $backup_dir ]; then
    e_warning "Backups moved to "$backup_dir""
  else
    e_success "No Backups Created"
  fi
  e_header "---------- YAY! ALL DONE  ----------"
fi
```

[1]: https://nolobe.com/interarchy/
[2]: https://panic.com/transmit/
[3]: https://www.dropbox.com/
[4]: https://gigaom.com/2011/04/27/how-to-create-and-use-symlinks-on-a-mac/
[5]: https://www.haystacksoftware.com/arq/
