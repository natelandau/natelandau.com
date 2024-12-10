---
title: Bash Shell Scripting Utilities
slug: bash-scripting-utilities
date: 2014-04-19 08:25
summary: A collection of handy utilities and functions to make bash scripting easier and more fun.
slug: bash-scripting-utilities
tags:
    - macos
    - unix
---

I do a lot of bash shell scripting. Okay, not a lot, but from time to time I find it handy to automate tasks I perform often on my mac. I am no programmer so it took me a while to realize that there was a better method than writing the same code multiple times in many different scripts. I took the common functions and compiled them into a file called `utils.sh`. Now all I have to do is source (include) this file from any script I write and I have easy access to a number of handy utilities including:

1. Setting colored and styled text output
2. Performing simple Yes/No confirmations
3. Testing if packages, apps, gems, etc. are installed
4. Sending [Pushover](https://pushover.net/) notifications
5. Comparing lists to each other

**Credit where credit is due** Before I walk through each of the utilities in detail, I need to give clear credit to those who originally wrote the code I have either taken whole-cloth or adapted. I taught myself to program by reading source code of others and adapting what I needed. I have done that liberally here. All code is commented with the originating source. In the interest of providing even more clear credit, here are links to the three sources.

-   [Cowboy Dotfiles](https://github.com/cowboy/dotfiles)

### How to use these utilities

I have a single file called `utils.sh` in which I place all my bash scripting functions. I keep this in file in `~/Library/init/`. Sourcing these utilities is as simple as writing a single line near the top any bash script.

```bash
#!/bin/bash

source $HOME/Library/init/utils.sh

(some script here)
```

---

## Colors, Headers, Logging

Styling text output in terminal is important for a usable script. These utilities allow messages to convey meaning through color and iconography.

#### The functions

```bash
#
#Set Colors
#

bold=$(tput bold)
underline=$(tput sgr 0 1)
reset=$(tput sgr0)

purple=$(tput setaf 171)
red=$(tput setaf 1)
green=$(tput setaf 76)
tan=$(tput setaf 3)
blue=$(tput setaf 38)

#
# Headers and  Logging
#

e_header() { printf "\n${bold}${purple}==========  %s  ==========${reset}\n" "$@"
}
e_arrow() { printf "➜ $@\n"
}
e_success() { printf "${green}✔ %s${reset}\n" "$@"
}
e_error() { printf "${red}✖ %s${reset}\n" "$@"
}
e_warning() { printf "${tan}➜ %s${reset}\n" "$@"
}
e_underline() { printf "${underline}${bold}%s${reset}\n" "$@"
}
e_bold() { printf "${bold}%s${reset}\n" "$@"
}
e_note() { printf "${underline}${bold}${blue}Note:${reset}  ${blue}%s${reset}\n" "$@"
}
```

#### A sample script

```bash
#!/bin/bash

source $HOME/Library/init/utils.sh

e_header "I am a sample script"
e_success "I am a success message"
e_error "I am an error message"
e_warning "I am a warning message"
e_underline "I am underlined text"
e_bold "I am bold text"
e_note "I am a note"
```

#### The output

![Colors and logging]({static}/images/2014-04-18-bash-scripting-utilities/colors.png)

---

## Seeking User Confirmation

Many bash scripts I write ask for user input before performing a task. Most often these are simple yes/no questions. For example, let's say you have a script that offers to upload any directory on your desktop to an FTP site. You might want that script to ask you if you want to upload each folder it finds. Here's some shorthand on how to do that.

#### The functions

```bash
seek_confirmation() {
  printf "\n${bold}$@${reset}"
  read -p " (y/n) " -n 1
  printf "\n"
}

# Test whether the result of an 'ask' is a confirmation
is_confirmed() {
if [[ "$REPLY" =~ ^[Yy]$ ]]; then
  return 0
fi
return 1
}
```

#### A Sample Script

```bash
#!/bin/bash

source $HOME/.bash_profile
source $HOME/Library/init/utils.sh

e_header "I am a sample script"

seek_confirmation "Do you want to print a success message?"
if is_confirmed; then
  e_success "Here is a success message"
else
  e_error "You did not ask for a success message"
fi
```

#### The Output

![Seeking user confirmation]({static}/images/2014-04-18-bash-scripting-utilities/confirmation.png)

---

## Testing for scripts, packages, OSes

In many scenarios you only want to run a particular section of a script if a certain package or application is installed. For example, don't run a script that needs Git if Git is not installed. And, don't run a script that requires a Mac program if you're on linux. Here's an easy shorthand to check for installed packages, apps, and OS compatibility.

#### The functions

```bash
type_exists() {
if [ $(type -P $1) ]; then
  return 0
fi
return 1
}

is_os() {
if [[ "${OSTYPE}" == $1* ]]; then
  return 0
fi
return 1
}
```

#### A Sample Script

```bash
#!/bin/bash

source $HOME/Library/init/utils.sh

e_header "I am a sample script"

# Check for Git
if type_exists 'git'; then
  e_success "Git good to go"
else
  e_error "Git should be installed. It isn't. Aborting."
  exit 1
fi

if is_os "darwin"; then
  e_success "You are on a mac"
else
  e_error "You are not on a mac"
  exit 1
fi
```

#### The Output

![Testing for packages and OSes]({static}/images/2014-04-18-bash-scripting-utilities/packages.png)

---

## Sending Notifications to Pushover

This function allows you to send notifications to your mobile devices using [Pushover's][1] amazing free service. This comes in very handy if your scripts are running lengthy commands or if they run via Cron.

#### The function

```bash
pushover () {
  PUSHOVERURL="https://api.pushover.net/1/messages.json"
  API_KEY="your-api-here"
  USER_KEY="your-user-key-here"
  DEVICE=""

  TITLE="${1}"
  MESSAGE="${2}"

  curl \
  -F "token=${API_KEY}" \
  -F "user=${USER_KEY}" \
  -F "device=${DEVICE}" \
  -F "title=${TITLE}" \
  -F "message=${MESSAGE}" \
  "${PUSHOVERURL}" > /dev/null 2>&1
}
```

#### A Sample Script

```bash
#!/bin/bash

source $HOME/Library/init/utils.sh

pushover "We just finished performing a lengthy task."
```

#### The Output

![A Pushover notification on my phone]({static}/images/2014-04-18-bash-scripting-utilities/pushover.png)

---

## Comparing a list

This bash function is more complicated but I use it all the time. It reads a list of items to be installed and compares it to a list of already existing items on your computer. This allows you only to install the items that are missing.

Complete credit goes to [Cowboy][3] who's code I have lifted entirely.

#### The function

```bash
function to_install() {
  local debug desired installed i desired_s installed_s remain
  if [[ "$1" == 1 ]]; then debug=1; shift; fi
    # Convert args to arrays, handling both space- and newline-separated lists.
    read -ra desired < <(echo "$1" | tr '\n' ' ')
    read -ra installed < <(echo "$2" | tr '\n' ' ')
    # Sort desired and installed arrays.
    unset i; while read -r; do desired_s[i++]=$REPLY; done < <(
      printf "%s\n" "${desired[@]}" | sort
    )
    unset i; while read -r; do installed_s[i++]=$REPLY; done < <(
      printf "%s\n" "${installed[@]}" | sort
    )
    # Get the difference. comm is awesome.
    unset i; while read -r; do remain[i++]=$REPLY; done < <(
      comm -13 <(printf "%s\n" "${installed_s[@]}") <(printf "%s\n" "${desired_s[@]}")
  )
  [[ "$debug" ]] && for v in desired desired_s installed installed_s remain; do
    echo "$v ($(eval echo "\${#$v[*]}")) $(eval echo "\${$v[*]}")"
  done
  echo "${remain[@]}"
}
```

#### A Sample Script

In this sample script we are checking a list of [Homebrew](https://brew.sh/) packages to find out which ones are not already installed.

-   the **recipes** list below is the packages we are looking for
-   the line that starts with **list=** is comparing our list of recipes to the list of packages listed when `brew list` is entered in your terminal. `brew list` could just as easily be `$(gem list | awk '{print $1}')")` to check for installed gems.
-   Lastly where we are using the `echo "$item"` to print the results to the screen, we could easily replace that with `brew install $item` or `gem install $item` etc.

```bash
#!/bin/bash

source $HOME/Library/init/utils.sh

e_header "Check Homebrew Packages"

recipes=(
  A-random-package
  bash
  Another-random-package
  git
)
list="$(to_install "${recipes[*]}" "$(brew list)")"
if [[ "$list" ]]; then
for item in ${list[@]}
  do
    echo "$item is not on the list"
  done
else
e_arrow "Nothing to install.  You've already got them all."
fi
```

#### The Output

![Comparing Lists]({static}/images/2014-04-18-bash-scripting-utilities/lists.png)

---

## The whole bash utilities script

Here is the complete _utils.sh_ file for you. I hope it helps you as much as it has helped me. As always, if you have questions or comments let me know down below.

```bash
#!/bin/bash

#
# Set Colors
#

bold=$(tput bold)
underline=$(tput sgr 0 1)
reset=$(tput sgr0)

purple=$(tput setaf 171)
red=$(tput setaf 1)
green=$(tput setaf 76)
tan=$(tput setaf 3)
blue=$(tput setaf 38)

#
# Headers and  Logging
#

e_header() { printf "\n${bold}${purple}==========  %s  ==========${reset}\n" "$@"
}
e_arrow() { printf "➜ $@\n"
}
e_success() { printf "${green}✔ %s${reset}\n" "$@"
}
e_error() { printf "${red}✖ %s${reset}\n" "$@"
}
e_warning() { printf "${tan}➜ %s${reset}\n" "$@"
}
e_underline() { printf "${underline}${bold}%s${reset}\n" "$@"
}
e_bold() { printf "${bold}%s${reset}\n" "$@"
}
e_note() { printf "${underline}${bold}${blue}Note:${reset}  ${blue}%s${reset}\n" "$@"
}

#
# USAGE FOR SEEKING CONFIRMATION
# seek_confirmation "Ask a question"
# Credt: https://github.com/kevva/dotfiles
#
# if is_confirmed; then
#   some action
# else
#   some other action
# fi
#

seek_confirmation() {
  printf "\n${bold}$@${reset}"
  read -p " (y/n) " -n 1
  printf "\n"
}

# underlined
seek_confirmation_head() {
  printf "\n${underline}${bold}$@${reset}"
  read -p "${underline}${bold} (y/n)${reset} " -n 1
  printf "\n"
}

# Test whether the result of an 'ask' is a confirmation
is_confirmed() {
if [[ "$REPLY" =~ ^[Yy]$ ]]; then
  return 0
fi
return 1
}

#
# Test whether a command exists
# $1 = cmd to test
# Usage:
# if type_exists 'git'; then
#   some action
# else
#   some other action
# fi
#

type_exists() {
if [ $(type -P $1) ]; then
  return 0
fi
return 1
}

#
# Test which OS the user runs
# $1 = OS to test
# Usage: if is_os 'darwin'; then
#

is_os() {
if [[ "${OSTYPE}" == $1* ]]; then
  return 0
fi
return 1
}

#
# Pushover Notifications
# Usage: pushover "Title Goes Here" "Message Goes Here"
#

pushover () {
    PUSHOVERURL="https://api.pushover.net/1/messages.json"
  API_KEY="your-api-here"
  USER_KEY="your-user-key-here"
    DEVICE=""

    TITLE="${1}"
    MESSAGE="${2}"

    curl \
    -F "token=${API_KEY}" \
    -F "user=${USER_KEY}" \
    -F "device=${DEVICE}" \
    -F "title=${TITLE}" \
    -F "message=${MESSAGE}" \
    "${PUSHOVERURL}" > /dev/null 2>&1
}

#
# Given a list of desired items and installed items, return a list
# of uninstalled items. Arrays in bash are insane (not in a good way).
# Credit: https://github.com/cowboy/dotfiles
#

function to_install() {
  local debug desired installed i desired_s installed_s remain
  if [[ "$1" == 1 ]]; then debug=1; shift; fi
    # Convert args to arrays, handling both space- and newline-separated lists.
    read -ra desired < <(echo "$1" | tr '\n' ' ')
    read -ra installed < <(echo "$2" | tr '\n' ' ')
    # Sort desired and installed arrays.
    unset i; while read -r; do desired_s[i++]=$REPLY; done < <(
      printf "%s\n" "${desired[@]}" | sort
    )
    unset i; while read -r; do installed_s[i++]=$REPLY; done < <(
      printf "%s\n" "${installed[@]}" | sort
    )
    # Get the difference. comm is awesome.
    unset i; while read -r; do remain[i++]=$REPLY; done < <(
      comm -13 <(printf "%s\n" "${installed_s[@]}") <(printf "%s\n" "${desired_s[@]}")
  )
  [[ "$debug" ]] && for v in desired desired_s installed installed_s remain; do
    echo "$v ($(eval echo "\${#$v[*]}")) $(eval echo "\${$v[*]}")"
  done
  echo "${remain[@]}"
}
```
