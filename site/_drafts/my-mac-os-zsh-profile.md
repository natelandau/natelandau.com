---
layout: post
title: My MacOS ZSH profile
date: 2022-11-05
image:
description: I've spent years curating a collection of Mac aliases and shortcuts to make my life easier. My full .zshrc is below, feel free to take whatever you find useful and put it to good use.
tags:
    - macOS
    - unix
sitemap:
    priority: 0.3
    changefreq: monthly
    lastmod: 2022-11-05
    exclude: false
flags:
    published: true
    noindex: false
    include_comments: true
---

I spend a ton of time working in the terminal. It's important that my command line experience be streamlined, easy-to-use, and pleasurable on the eye. To that end, I have created a heavily customized approach to my zsh environment that I will outline in this post.

## A (very) quick primer on .zshrc for Mac users

There is a hidden file in your Mac's user directory named `.zshrc`. This file is loaded before Terminal loads your shell environment and contains all the startup configuration and preferences for your command line interface. Within it you can change your terminal prompt, change the colors of text, add aliases to functions you use all the time, and so much more.

This file is often called a 'dotfile' because the '.' at the beginning of it's name makes it invisible in the Mac Finder. You can view all invisible files in the Terminal by typing `ls -al` in any directory.

## How to edit your .zshrc

For the newly initiated, here's how you can edit the `.zshrc` file on your Mac.

**Step 1:** Fire up `Terminal.app`

**Step 2:** Type `nano .zshrc` – This command will open the .zshrc document (or create it if it doesn't already exist) in the easiest to use text editor in Terminal – Nano.

**Step 3:** Now you can make a simple change to the file. Paste these lines of code to change your Terminal prompt.

```bash
PS1='%n@%m %~$ '
```

**Step 4:** Now _save your changes_ by typing `ctrl+o` Hit `return` to save. Then exit Nano by typing `ctrl+x`

**Step 5:** Now we need to activate your changes. Type `source .zshrc` and watch your prompt change.

## My ZSH Profile

I have compiled my own set of aliases, dotfiles, and configurations over the course of many years. Throughout, I have borrowed copiously from others who have made their aliases available online. Many thanks to the countless others who have shared their work and led me to my own customizations.

My full dotfiles are [available on Github](https://github.com/natelandau/dotfiles). You can browse that repository for inspiration and ideas. Fork it and make it your own. Or, use it as-is by following these steps in your terminal:

```bash
mkdir repos
cd repos
git checkout https://github.com/natelandau/dotfiles.git
cd dotfiles
./install.sh
```

### ZSH Plugin management

A key feature of zsh is the ability to load plugins into your environment. I tried [many great plugin managers](https://github.com/unixorn/awesome-zsh-plugins#frameworks) but found them to either too finnicky or that they became unmaintained over time. Building my own was very easy and allows me to control every aspect of my environment.

Here are the portions of my .zshrc devoted to plugin management. The code below is commented to the best of my ability to explain what each section does.

```bash
# Load Plugins
# https://github.com/mattmc3/zsh_unplugged - Build your own zsh plugin manager


# _pluginload_: Function which loads a specified plugin into my zsh environment
_pluginload_() {
    local giturl="$1"
    local plugin_name=${${1##*/}%.git}
    local plugindir="${ZPLUGINDIR:-$HOME/.zsh/plugins}/${plugin_name}"

    # Clone repository for the plugin if isn't there already
    if [[ ! -d ${plugindir} ]]; then
        command git clone --depth 1 --recursive --shallow-submodules ${giturl} ${plugindir}
        [[ $? -eq 0 ]] || { >&2 echo "plugin-load: git clone failed; $1" && return 1 }
    fi

    # Symlink an init.zsh if there isn't one so the plugin is easy to source
    if [[ ! -f ${plugindir}/init.zsh ]]; then
        local initfiles=(
          # look for specific files first
          ${plugindir}/${plugin_name}.plugin.zsh(N)
          ${plugindir}/${plugin_name}.zsh(N)
          ${plugindir}/${plugin_name}(N)
          ${plugindir}/${plugin_name}.zsh-theme(N)
          # then do more aggressive globbing
          ${plugindir}/*.plugin.zsh(N)
          ${plugindir}/*.zsh(N)
          ${plugindir}/*.zsh-theme(N)
          ${plugindir}/*.sh(N)
        )
        [[ ${#initfiles[@]} -gt 0 ]] || { >&2 echo "plugin-load: no plugin init file found" && return 1 }
        command ln -s ${initfiles[1]} ${plugindir}/init.zsh
    fi

    # source the plugin to make it active in the current environment
    source ${plugindir}/init.zsh

    # Modify the path to include the plugin directory
    fpath+=${plugindir}
    [[ -d ${plugindir}/functions ]] && fpath+=${plugindir}/functions
}

# Set where we should store Zsh plugins
ZPLUGINDIR=${HOME}/.zsh/plugins

# Add your plugins to this array. Anything added here will be installed.
plugins=(
    # core plugins
    # ######################
    zsh-users/zsh-autosuggestions
    zsh-users/zsh-completions

    # # user plugins
    # ######################
    peterhurford/up.zsh                 # Cd to parent directories (ie. up 3)
    marlonrichert/zsh-hist              # Run hist -h for help
    reegnz/jq-zsh-plugin                # Write interactive jq queries (Requires jq and fzf)
    MichaelAquilina/zsh-you-should-use  # Recommends aliases when typed
    rupa/z                              # Tracks your most used directories, based on 'frequency'

    # Additional completions
    # ######################
    sudosubin/zsh-github-cli
    zpm-zsh/ssh

    # Prompts
    # ######################
    # denysdovhan/spaceship-prompt
    romkatv/powerlevel10k

    # load these last
    # ######################
    # zsh-users/zsh-syntax-highlighting
    zdharma-continuum/fast-syntax-highlighting
    zsh-users/zsh-history-substring-search
)

# Add plugins to this array that should only be installed on a computer running MacOS.
mac_plugins=(
      ellie/atuin  # Replace history search with a sqlite database
)

# Load your plugins (clone, source, and add to fpath)
for repo in ${plugins[@]}; do
  _pluginload_ https://github.com/${repo}.git
done
unset repo

# Load Mac specific plugins (clone, source, and add to fpath)
if [[ ${OSTYPE} == "darwin"* ]]; then
  for mac_repo in ${mac_plugins[@]}; do
    _pluginload_ https://github.com/${mac_repo}.git
  done
  unset mac_repo
fi

# Run this function from time-to-time to update the plugins installed on a computer
function zshup () {
  local plugindir="${ZPLUGINDIR:-$HOME/.zsh/plugins}"
  for d in $plugindir/*/.git(/); do
    echo "Updating ${d:h:t}..."
    command git -C "${d:h}" pull --ff --recurse-submodules --depth 1 --rebase --autostash
  done
}

# Load Completions
#############################################
autoload -Uz compinit
compinit -i

# CONFIGURE PLUGINS
#############################################
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=242' # Use a lighter gray for the suggested text
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE="20"
FAST_HIGHLIGHT[use_brackets]=1
```

## Prompt

Over the years I have switched between two prompts, both of which provide ample opportunities for customization. First, I used [Spaceship Promp](https://spaceship-prompt.sh/) but lately I've been taken with [Powerlevel10k](https://github.com/romkatv/powerlevel10k) which offers slightly more configuration options.

You prompt of choice can be loaded into ZSH by including it as one of the plugins in the section above.

My current prompt uses two lines and splits information between the left and right sides of the terminal.
{% responsive_image
	path: img/2022-11-05-zsh-profile/prompt.png
	alt: "My current zsh prompt"
%}

You can view [my Powerlevel10k settings](https://github.com/natelandau/dotfiles/blob/master/shell/p10k.zsh) on Github. I recommend reading [their documentation](https://github.com/romkatv/powerlevel10k#getting-started) to customize the prompt to your purposes

### ZSH Shell Options

Shell options allow you to configure the base behavior of interacting with the shell. There are [many options available in ZSH](https://zsh.sourceforge.io/Doc/Release/Options.html#Options). Below are the ones that I have customized.

```bash
# Set Options
#############################################
setopt always_to_end          # When completing a word, move the cursor to the end of the word
setopt append_history         # this is default, but set for share_history
setopt auto_cd                # cd by typing directory name if it's not a command
setopt auto_list              # automatically list choices on ambiguous completion
setopt auto_menu              # automatically use menu completion
setopt auto_pushd             # Make cd push each old directory onto the stack
setopt completeinword         # If unset, the cursor is set to the end of the word
setopt correct_all            # autocorrect commands
setopt extended_glob          # treat #, ~, and ^ as part of patterns for filename generation
setopt extended_history       # save each command's beginning timestamp and duration to the history file
setopt glob_dots              # dot files included in regular globs
setopt hash_list_all          # when command completion is attempted, ensure the entire  path is hashed
setopt hist_expire_dups_first # # delete duplicates first when HISTFILE size exceeds HISTSIZE
setopt hist_find_no_dups      # When searching history don't show results already cycled through twice
setopt hist_ignore_dups       # Do not write events to history that are duplicates of previous events
setopt hist_ignore_space      # remove command line from history list when first character is a space
setopt hist_reduce_blanks     # remove superfluous blanks from history items
setopt hist_verify            # show command with history expansion to user before running it
setopt histignorespace        # remove commands from the history when the first character is a space
setopt inc_append_history     # save history entries as soon as they are entered
setopt interactivecomments    # allow use of comments in interactive code (bash-style comments)
setopt longlistjobs           # display PID when suspending processes as well
setopt no_beep                # silence all bells and beeps
setopt nocaseglob             # global substitution is case insensitive
setopt nonomatch              ## try to avoid the 'zsh: no matches found...'
setopt noshwordsplit          # use zsh style word splitting
setopt notify                 # report the status of backgrounds jobs immediately
setopt numeric_glob_sort      # globs sorted numerically
setopt prompt_subst           # allow expansion in prompts
setopt pushd_ignore_dups      # Don't push duplicates onto the stack
setopt share_history          # share history between different instances of the shell
HISTFILE=${HOME}/.zsh_history
HISTSIZE=100000
SAVEHIST=${HISTSIZE}
```

## Importing Custom Functions and Aliases

As described in my [dotfiles repo](https://github.com/natelandau/dotfiles), I keep all my aliases and custom functions in a searate directory organized by the type of behavior they modify. This allows me to sustainable maintain the many shortcuts I have collected over the years.

This portion of my .zshrc searches through the directories which contain these files and sources (imports) them into the active shell.

```bash
# Location of my dotfiles repository
DOTFILES_LOCATION="${HOME}/repos/dotfiles"

# Array containing all directories which hold files to be sourced into this environment
configFileLocations=(
    "${DOTFILES_LOCATION}/shell"
    "${HOME}/repos/dotfiles-private/shell"
)

# Search through all directories and source any file with a `.sh` or `.zsh` extension
for configFileLocation in "${configFileLocations[@]}"; do
    if [ -d "${configFileLocation}" ]; then
        while read -r configFile; do
            source "${configFile}"
        done < <(find "${configFileLocation}" \
            -maxdepth 1 \
            -type f \
            -name '*.zsh' \
            -o -name '*.sh' | sort)
    fi
done
```

### My Collection of Custom Functions and Aliases

I update my collection of aliases and functions at a regular cadence. You can view a current version of them by [browsing these files on Github](https://github.com/natelandau/dotfiles/tree/master/shell).

Here are some of the more common ones I use, combined into a single code block.

```bash
# Common Aliases
# #####################################

# Sane Defaults
alias cp='cp -iv'
alias mv='mv -iv'
alias mkdir='mkdir -pv'
alias grep='grep --color=always'
alias cd..='cd ../'
alias ..='cd ../'
alias ...='cd ../../'
alias .3='cd ../../../'
alias .4='cd ../../../../'
alias .5='cd ../../../../../'
alias .6='cd ../../../../../../'
alias ~="cd ~"
alias kill='kill -9'
alias rm='rm -i'
alias rmd='rm -rf'
alias ax='chmod a+x'                      # system: make file executable
alias path='echo -e ${PATH//:/\\n}'       # system: Echo all executable Paths
alias shfmt="shfmt -ci -bn -i 2"          # dev: Preferred shellformat implementation
alias sc='shellcheck --exclude=2001,2148' # dev: Preferred shellcheck implementation

# Prefer `bat` over `cat` when installed
[[ "$(command -v bat)" ]] \
    && alias cat="bat"

# Prefer `prettyping` over `ping` when installed
[[ "$(command -v prettyping)" ]] \
    && alias ping="prettyping --nolegend"

# Prefer `htop` over `top` when installed
[[ "$(command -v htop)" ]] \
    && alias top="htop"

# Rebuild current shell environment when changes are made to dotfiles
if [[ ${SHELL##*/} == "bash" ]]; then
    alias sourcea='source ${HOME}/.bash_profile' # system: Source .bash_profile or .zshrc
elif [[ ${SHELL##*/} == "zsh" ]]; then
    alias sourcea='source ${HOME}/.zshrc' # system: Source .bash_profile or .zshrc
fi

alias memHogs='ps wwaxm -o pid,stat,vsize,rss,time,command | head -10' # system: Show top 10 memory hogs
alias cpuHogs='ps wwaxr -o pid,stat,%cpu,time,command | head -10'      # system: Show top 10 cpu hogs
mine() {
    # system: Show all processes owned by user
    ps "$@" -u "${USER}" -o pid,%cpu,%mem,start,time,bsdtime,command
}

colors() {
    # Prints all tput colors to terminal
    for i in {0..255}; do print -Pn "%K{$i}  %k%F{$i}${(l:3::0:)i}%f " ${${(M)$((i%6)):#3}:+$'\n'}; done
}

# Directory Aliases
# #####################################

# Different sets of LS aliases because Gnu LS and macOS LS use different
# flags for colors.  Also, prefer gem colorls or exa when available.

if exa --icons &>/dev/null; then
    alias ls='exa --git --icons'                             # system: List filenames on one line
    alias l='exa --git --icons -lF'                          # system: List filenames with long format
    alias ll='exa -lahF --git'                               # system: List all files
    alias lll="exa -1F --git --icons"                        # system: List files with one line per file
    alias llm='ll --sort=modified'                           # system: List files by last modified date
    alias la='exa -lbhHigUmuSa --color-scale --git --icons'  # system: List files with attributes
    alias lx='exa -lbhHigUmuSa@ --color-scale --git --icons' # system: List files with extended attributes
    alias lt='exa --tree --level=2'                          # system: List files in a tree view
    alias llt='exa -lahF --tree --level=2'                   # system: List files in a tree view with long format
    alias ltt='exa -lahF | grep "$(date +"%d %b")"'          # system: List files modified today
elif command -v exa &>/dev/null; then
    alias ls='exa --git'
    alias l='exa --git -lF'
    alias ll='exa -lahF --git'
    alias lll="exa -1F --git"
    alias llm='ll --sort=modified'
    alias la='exa -lbhHigUmuSa --color-scale --git'
    alias lx='exa -lbhHigUmuSa@ --color-scale --git'
    alias lt='exa --tree --level=2'
    alias llt='exa -lahF --tree --level=2'
    alias ltt='exa -lahF | grep "$(date +"%d %b")"'
elif command -v colorls &>/dev/null; then
    alias ll="colorls -1A --git-status"
    alias ls="colorls -A"
    alias ltt='colorls -A | grep "$(date +"%d %b")"'
elif [[ $(command -v ls) =~ gnubin || $OSTYPE =~ linux ]]; then
    alias ls="ls --color=auto"
    alias ll='ls -FlAhpv --color=auto'
    alias ltt='ls -FlAhpv| grep "$(date +"%d %b")"'
else
    alias ls="ls -G"
    alias ll='ls -FGlAhpv'
    alias ltt='ls -FlAhpv| grep "$(date +"%d %b")"'
fi

cd() {
    # Always print contents of directory when entering
    builtin cd "$@" || return 1
    ll
}

mcd() {
    # DESC: Create a directory and enter it
    # USAGE: mcd [dirname]
    mkdir -pv "$1"
    cd "$1" || exit
}


# File Shortcuts
# #####################################

md5Check() {
    # DESC:  Compares an md5 hash to the md5 hash of a file
    # ARGS:  None
    # OUTS:  None
    # USAGE: md5Check <md5> <filename>

    local opt
    local OPTIND=1
    local md5="$1"
    local file="$2"

    if ! command -v md5sum &>/dev/null; then
        echo "Can not find 'md5sum' utility"
        return 1
    fi

    [ ! -e "${file}" ] \
        && {
            echo "Can not find ${file}"
            return 1
        }

    # Get md5 has of file
    local filemd5
    filemd5="$(md5sum "${file}" | awk '{ print $1 }')"

    if [[ $filemd5 == "$md5" ]]; then
        success "The two md5 hashes match"
        return 0
    else
        warning "The two md5 hashes do not match"
        return 1
    fi

}

zipf() { zip -r "$1".zip "$1"; }       # Create a ZIP archive of a folder or file
alias numFiles='echo $(ls -1 | wc -l)' # Count of non-hidden files in current dir
alias make1mb='mkfile 1m ./1MB.dat'    # Creates a file of 1mb size (all zeros)
alias make5mb='mkfile 5m ./5MB.dat'    # Creates a file of 5mb size (all zeros)
alias make10mb='mkfile 10m ./10MB.dat' # Creates a file of 10mb size (all zeros)

copyfile() (
    # DESC: Copy contents of a file to the clipboard
    # ARGS: 1 (Required) - Path to file

    if [ -n "$1" ] && [ -f "$1" ]; then
        pbcopy <"${1}"
        return 0
    else
        printf "File not found: %s\n" "$1"
        return 1
    fi
)

buf() {
    # buf: Backup file with time stamp
    local filename
    local filetime

    filename="${1}"
    filetime=$(date +%Y%m%d_%H%M%S)
    cp -a "${filename}" "${filename}_${filetime}"
}

extract() {
    # DESC:  Extracts a compressed file from multiple formats
    # ARGS:  None
    # OUTS:  None
    # USAGE: extract -v <file>

    local opt
    local OPTIND=1

    while getopts "hv" opt; do
        case "$opt" in
            h)
                cat <<EOF
  $ ${FUNCNAME[0]} [option] <archives>
  options:
    -h  show this message and exit
    -v  verbosely list files processed
EOF
                return
                ;;
            v)
                local -r verbose='v'
                ;;
            ?)
                extract -h >&2
                return 1
                ;;
        esac
    done
    shift $((OPTIND - 1))

    [ $# -eq 0 ] && extract -h && return 1
    while [ $# -gt 0 ]; do
        if [ -f "$1" ]; then
            case "$1" in
                *.tar.bz2 | *.tbz | *.tbz2) tar "x${verbose}jf" "$1" ;;
                *.tar.gz | *.tgz) tar "x${verbose}zf" "$1" ;;
                *.tar.xz)
                    xz --decompress "$1"
                    set -- "$@" "${1:0:-3}"
                    ;;
                *.tar.Z)
                    uncompress "$1"
                    set -- "$@" "${1:0:-2}"
                    ;;
                *.bz2) bunzip2 "$1" ;;
                *.deb) dpkg-deb -x${verbose} "$1" "${1:0:-4}" ;;
                *.pax.gz)
                    gunzip "$1"
                    set -- "$@" "${1:0:-3}"
                    ;;
                *.gz) gunzip "$1" ;;
                *.pax) pax -r -f "$1" ;;
                *.pkg) pkgutil --expand "$1" "${1:0:-4}" ;;
                *.rar) unrar x "$1" ;;
                *.rpm) rpm2cpio "$1" | cpio -idm${verbose} ;;
                *.tar) tar "x${verbose}f" "$1" ;;
                *.txz)
                    mv "$1" "${1:0:-4}.tar.xz"
                    set -- "$@" "${1:0:-4}.tar.xz"
                    ;;
                *.xz) xz --decompress "$1" ;;
                *.zip | *.war | *.jar) unzip "$1" ;;
                *.Z) uncompress "$1" ;;
                *.7z) 7za x "$1" ;;
                *) echo "'$1' cannot be extracted via extract" >&2 ;;
            esac
        else
            echo "extract: '$1' is not a valid file" >&2
        fi
        shift
    done
}

chgext() {
    # chgext: Batch change extension
    #         For example 'chgext html php' will turn a directory of HTML files
    #         into PHP files.

    local f
    for f in *."$1"; do mv "$f" "${f%.$1}.$2"; done
}

j2y() {
    # convert json files to yaml using python and PyYAML
    python -c 'import sys, yaml, json; yaml.safe_dump(json.load(sys.stdin), sys.stdout, default_flow_style=False)' <"$1"
}

y2j() {
    # convert yaml files to json using python and PyYAML
    python -c 'import sys, yaml, json; json.dump(yaml.load(sys.stdin), sys.stdout, indent=4)' <"$1"
}

# Git Shortcuts
# #####################################

alias diff="git difftool"                                  # Open file in git's default diff tool <file>
alias fetch="git fetch origin"                             # Fetch from origin
alias gamend='git commit --amend'                          # Add more changes to the commit
alias gap='git add -p'                                     # Step through each change
alias gba='git branch -a'                                  # Lists local and remote branches
alias gc="git --no-pager commit"                           # Commit w/ message written in EDITOR
alias gcl='git clone --recursive'                          # Clone with all submodules
alias gcm="git --no-pager commit -m"                       # Commit w/ message from the command line <commit message>
alias gcv="git --no-pager commit --no-verify"              # Commit without verification
alias ginitsubs='git submodule update --init --recursive'  # Init and update all submodules
alias gundo="git reset --soft HEAD^"                       # Undo last commit
alias gs='git --no-pager status -s --untracked-files=all'  # Git status
alias gsearch='git rev-list --all | xargs git grep -F'     # Find a string in Git History <search string>
alias gss='git remote update && git status -uno'           # Are we behind remote?
alias gsubs='git submodule update --recursive --remote'    # Update all submodules
alias gup="git remote update -p; git merge --ff-only @{u}" # Update & Merge
alias undopush="git push -f origin HEAD^:master"           # Undo a git push
alias unstage='git reset HEAD'                             # Unstage a file

ga() { git add "${@:-.}"; } # Add file (default: all)

alias gl='git log --pretty=format:"%C(yellow)%h\\ %ad%Cred%d\\ %Creset%s%Cblue\\ [%cn]" --decorate --date=short' # A nicer Git Log

applyignore() {
    # DESC: Applies changes to the git .ignorefile after the files mentioned were already committed to the repo
    # ARGS: None
    # OUTS: None


    git ls-files -ci --exclude-standard -z | xargs -0 git rm --cached
}

rollback() (
    # DESC: Resets the current HEAD to specified commit
    # ARGS: $1 (Required): Commit to revert to
    # OUTS: None
    # USAGE: gitRollback <commit>

    _is_clean_() {
        if [[ $(git diff --shortstat 2>/dev/null | tail -n1) != "" ]]; then
            echo "Your branch is dirty, please commit your changes"
            return 1
        fi
        return 0
    }

    _commit_exists_() {
        git rev-list --quiet "$1"
        status=$?
        if [ $status -ne 0 ]; then
            echo "Commit ${1} does not exist"
            return 1
        fi
        return 0
    }

    _keep_changes_() {
        while true; do
            read -r -p "Do you want to keep all changes from rolled back revisions in your working tree? [Y/N]" RESP
            case $RESP in

                [yY])
                    echo "Rolling back to commit ${1} with unstaged changes"
                    git reset "$1"
                    break
                    ;;
                [nN])
                    echo "Rolling back to commit ${1} with a clean working tree"
                    git reset --hard "$1"
                    break
                    ;;
                *)
                    echo "Please enter Y or N"
                    ;;
            esac
        done
    }

    if [ -n "$(git symbolic-ref HEAD 2>/dev/null)" ]; then
        if _is_clean_; then
            if _commit_exists_ "$1"; then

                while true; do
                    read -r -p "WARNING: This will change your history and move the current HEAD back to commit ${1}, continue? [Y/N]" RESP
                    case $RESP in

                        [yY])
                            _keep_changes_ "$1"
                            break
                            ;;
                        [nN])
                            break
                            ;;
                        *)
                            echo "Please enter Y or N"
                            ;;
                    esac
                done
            fi
        fi
    else
        echo "you're currently not in a git repository"
    fi
)

gurl() (
    # DESC:  Prints URL of current git repository
    # ARGS:  None
    # OUTS:  None

    local remote remotename host user_repo

    remotename="${*:-origin}"
    remote="$(git remote -v | awk '/^'"${remotename}"'.*\(push\)$/ {print $2}')"
    [[ "${remote}" ]] || return
    host="$(echo "${remote}" | perl -pe 's/.*@//;s/:.*//')"
    user_repo="$(echo "${remote}" | perl -pe 's/.*://;s/\.git$//')"
    echo "https://${host}/${user_repo}"
)

# From Git-Extras (https://github.com/tj/git-extras)
alias obliterate='git obliterate'       # Completely remove a file from the repository, including past commits and tags
alias release='git-release'             # Create release commit with the given <tag> and other options
alias rename-branch='git rename-branch' # Rename a branch and sync with remote. <old name> <new name>
alias rename-tag='git rename-tag'       # Rename a tag (locally and remotely). <old name> <new name>
alias ignore='git ignore'               # Add files to .gitignore. Run without arguments to list ignored files.
alias ginfo='git info --no-config'      # Show information about the current repository.
alias del-sub='git delete-submodule'    # Delete a submodule. <name>
alias del-tag='git delete-tag'          # Delete a tag. <name>
alias changelog='git changelog'         # Generate a Changelog from tags and commit messages. -h for help.
alias garchive='git archive'            # Creates a zip archive of the current git repository. The name of the archive will depend on the current HEAD of your git repository.
alias greset='git reset'                # Reset one file to HEAD or certain commit. <file> <commit (optional)>
alias gclear='git clear-soft'           # Does a hard reset and deletes all untracked files from the working directory, excluding those in .gitignore.
alias gbrowse='git browse'              # Opens the current git repository website in your default web browser.
alias gtimes='git utimes'               # Change files modification time to their last commit date.


# MacOS Specific Shortcuts
# ###########################

if [[ ${OSTYPE} == "darwin"* ]]; then # Only load these on a MacOS computer

    ## ALIASES ##
    alias cpwd='pwd | tr -d "\n" | pbcopy'                        # Copy the working path to clipboard
    alias cl="fc -e -|pbcopy"                                     # Copy output of last command to clipboard
    alias caff="caffeinate -ism"                                  # Run command without letting mac sleep
    alias cleanDS="find . -type f -name '*.DS_Store' -ls -delete" # Delete .DS_Store files on Macs
    alias showHidden='defaults write com.apple.finder AppleShowAllFiles TRUE'
    alias hideHidden='defaults write com.apple.finder AppleShowAllFiles FALSE'
    alias capc="screencapture -c"
    alias capic="screencapture -i -c"
    alias capiwc="screencapture -i -w -c"

    CAPTURE_FOLDER="${HOME}/Desktop"

    function cap() {
        # DESC: Capture the screen to the desktop
        screencapture "${CAPTURE_FOLDER}/capture-$(date +%Y%m%d_%H%M%S).png"
    }

    function capi() {
        # DESC: Capture the selected screen area to the desktop
        screencapture -i "${CAPTURE_FOLDER}/capture-$(date +%Y%m%d_%H%M%S).png"
    }

    function capiw() {
        # DESC: Capture the selected window to the desktop
        screencapture -i -w "${CAPTURE_FOLDER}/capture-$(date +%Y%m%d_%H%M%S).png"
    }

    # Open the finder to a specified path or to current directory.
    f() {
        # DESC:  Opens the Finder to specified directory. (Default is current oath)
        # ARGS:  $1 (optional): Path to open in finder
        # REQS:  MacOS
        # USAGE: f [path]
        open -a "Finder" "${1:-.}"
    }

    ql() {
        # DESC:  Opens files in MacOS Quicklook
        # ARGS:  $1 (optional): File to open in Quicklook
        # OUTS:	 None
        # REQS:  macOS
        # USAGE: ql [file1] [file2]
        qlmanage -p "${*}" &>/dev/null
    }

    alias cleanupLS="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user && killall Finder" # Clean up LaunchServices to remove duplicates in the "Open With" menu

    unquarantine() {
        # DESC:  Manually remove a downloaded app or file from the MacOS quarantine
        # ARGS:  $1 (required): Path to file or app
        # OUTS:  None
        # USAGE: unquarantine [file]

        local attribute
        for attribute in com.apple.metadata:kMDItemDownloadedDate com.apple.metadata:kMDItemWhereFroms com.apple.quarantine; do
            xattr -r -d "${attribute}" "$@"
        done
    }

    browser() {
        # DESC:  Pipe HTML to a Safari browser window
        # ARGS:  None
        # OUTS:  None
        # USAGE: echo "<h1>hi mom!</h1>" | browser'

        local FILE
        FILE=$(mktemp -t browser.XXXXXX.html)
        cat /dev/stdin >|"${FILE}"
        open -a Safari "${FILE}"
    }

    finderpath() {
        # DESC:  Echoes the path of the frontmost window in the finder
        # ARGS:  None
        # OUTS:  None
        # USAGE: cd $(finderpath)
        # credit: https://github.com/herrbischoff/awesome-osx-command-line/blob/master/functions.md

        local FINDER_PATH

        FINDER_PATH=$(
            osascript -e 'tell application "Finder"' \
                -e "if (${1-1} <= (count Finder windows)) then" \
                -e "get POSIX path of (target of window ${1-1} as alias)" \
                -e 'else' \
                -e 'get POSIX path of (desktop as alias)' \
                -e 'end if' \
                -e 'end tell' 2>/dev/null
        )

        echo "${FINDER_PATH}"
    }

    ## SPOTLIGHT MAINTENANCE ##
    alias spot-off="sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.metadata.mds.plist"
    alias spot-on="sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.metadata.mds.plist"

    # If the 'mds' process is eating tons of memory it is likely getting hung on a file.
    # This will tell you which file that is.
    alias spot-file="lsof -c '/mds$/'"

    # Search for a file using MacOS Spotlight's metadata
    spotlight() { mdfind "kMDItemDisplayName == '${1}'wc"; }
fi
```

I hope this brief tour through parts of my zsh profile is helpful in your efforts to customize your shell experience on MacOS. Let me know in the comments if you have questions or additions.
