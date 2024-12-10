---
title: Boilerplate Shell Script Template
slug: boilerplate-shell-script-template
date: 2015-05-27 08:39
modified: 2016-02-02 15:03
summary: A shell script template containing my collection of shorthand functions and pre-written code.
tags:
    - macos
    - unix
---

I often write simple BASH scripts to perform a multitude of tasks. I have scripts to sync directories, convert media files, bootstrap a new mac, deploy my Jekyll site, and perform sundry other computer automation tasks.

As I wrote more and more of shell scripts I found myself in need of a simple starter-kit that would allow me to focus on solving on the task at hand rather than recreating the same mundane steps over and over again.

Building upon my previously published [shell scripting utilities][1], I created this BASH script boilerplate. This script along with many additional files are available in [my first public repository on Github][2]. My hope is that you will find this script template as useful as I have.

## Goals

1. **Architect a framework** - I did not set out to create a single stand-alone template file. Rather, I worked to create a shell scripting framework for all of my scripts to function as efficiently as possible.
2. **Focus on simplicity** - Rather than creating a single complicated script, I opted to link a number of simpler, more focused scripts together. This allows the script template to be as small and easy to use as possible. Shared functions, variables, logging, and other elements are off-loaded to separate scripts which are _sourced_ from the the script template.
3. **Build to my own needs** - Until very recently I did not plan on making this repository public. The functions, templates, utilities, and code are written to meet my own needs and not necessarily written in as broad or abstracted a manner as possible. This also means that many of the functions are written to be used on a Mac in exclusion of other platforms.
4. **Comment and document the code** - As a non-programmer, I have a tendency to forget what something does within a few weeks of cobbling together the code. To get around this personal failing I have commented and documented the code as well as I can.

## Usage

This shell scripting boilerplate template is available as part of my [Shell Scripts Repository][2] on GitHub. Make a clone of that repository to gain access to all the necessary directories and files needed to make this script work. Then follow these steps:

1. Make a copy of `scriptTemplate.sh`.
2. Ensure that the new script can find the utilities located in `lib/utils.sh` by updating the path of variable `utilsLocation` near the top.
3. Ensure your script is executable (i.e. - run `chmod a+x scriptname`)
4. Add your script within the function titled `mainScript`

## Boilerplate shell script features

This script template has a number of handy built-in features.

### Temp directory creation

This function creates a temporary directory that is removed at the completion of the script. Any temporary files that are needed are written here.

```bash
tmpDir="/tmp/${scriptName}.$RANDOM.$RANDOM.$RANDOM.$$"
(umask 077 && mkdir "${tmpDir}") || {
  die "Could not create temporary directory! Exiting."
}
```

### Trap Cleanup

If something unexpectedly goes wrong when running the script, this trap cleanup function is invoked which cleans up the temporary directory and prints a message to the user.

```bash

function trapCleanup() {
  if is_dir "${tmpDir}"; then
    rm -r "${tmpDir}"
  fi
  die "Exit trapped."  # Edit this if you like.
}

trap trapCleanup EXIT INT TERM
```

### Logging

A log file is created when needed.

```bash
logFile="$HOME/Library/Logs/${scriptBasename}.log"
```

### Interactive options and usage

The template makes it easy for derivative script to take user arguments and flags from the command line. In addition, it makes it easy to print detailed usage information when the `-h` flag is passed.

### Debug and Strict Mode

By setting flags, any script can be invoked in debug or strict mode.

```bash
# Run in debug mode, if set
if [ "${debug}" == "1" ]; then
  set -x
fi

# Exit on empty variable
if [ "${strict}" == "1" ]; then
  set -o nounset
fi
```

### Dependency checking

Many of the scripts I write depend on helper applications being installed. This function ensures that any needed applications are installed on the host system and will optionally install them using [Homebrew][3] on a Mac.

### Access to many BASH utilities and shell script functions

In addition, this script template _sources_ my entire shell scripting utilities providing many additional pieces of pre-built functionality and scripting short-hand.

## A note on code reuse

This boilerplate was created by me over many years without ever having the intention to make it public. As a novice programmer, I have Googled, GitHubbed, and StackExchanged a path to solve my own scripting needs. Quite often I would lift a function whole-cloth from a GitHub repo and not keep track of it's original location. I have done my best to recreate my footsteps and give credit to the original creators of the code when possible. Unfortunately, I fear that I missed as many as I found.

My goal of making this script public is not to take credit for the wonderful code written by others. If you recognize or wrote something here that I didn't credit, please let me know.

## The full script template

**Note:** this script will not function without the associated files in [the GitHub Repository][2]. I will be making all future updates to the script there.

```bash
#!/usr/bin/env bash

# ##################################################
# My Generic BASH script template
#
version="1.0.0"               # Sets version variable
#
scriptTemplateVersion="1.3.0" # Version of scriptTemplate.sh that this script is based on
#                               v.1.1.0 - Added 'debug' option
#                               v.1.1.1 - Moved all shared variables to Utils
#                                       - Added $PASS variable when -p is passed
#                               v.1.2.0 - Added 'checkDependencies' function to ensure needed
#                                         Bash packages are installed prior to execution
#                               v.1.3.0 - Can now pass CLI without an option to $args
#
# HISTORY:
#
# * DATE - v1.0.0  - First Creation
#
# ##################################################

# Provide a variable with the location of this script.
scriptPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source Scripting Utilities
# -----------------------------------
# These shared utilities provide many functions which are needed to provide
# the functionality in this boilerplate. This script will fail if they can
# not be found.
# -----------------------------------

utilsLocation="${scriptPath}/lib/utils.sh" # Update this path to find the utilities.

if [ -f "${utilsLocation}" ]; then
  source "${utilsLocation}"
else
  echo "Please find the file util.sh and add a reference to it in this script. Exiting."
  exit 1
fi

# trapCleanup Function
# -----------------------------------
# Any actions that should be taken if the script is prematurely
# exited.  Always call this function at the top of your script.
# -----------------------------------
function trapCleanup() {
  echo ""
  if is_dir "${tmpDir}"; then
    rm -r "${tmpDir}"
  fi
  die "Exit trapped."  # Edit this if you like.
}

# Set Flags
# -----------------------------------
# Flags which can be overridden by user input.
# Default values are below
# -----------------------------------
quiet=0
printLog=0
verbose=0
force=0
strict=0
debug=0
args=()

# Set Temp Directory
# -----------------------------------
# Create temp directory with three random numbers and the process ID
# in the name.  This directory is removed automatically at exit.
# -----------------------------------
tmpDir="/tmp/${scriptName}.$RANDOM.$RANDOM.$RANDOM.$$"
(umask 077 && mkdir "${tmpDir}") || {
  die "Could not create temporary directory! Exiting."
}

# Logging
# -----------------------------------
# Log is only used when the '-l' flag is set.
#
# To never save a logfile change variable to '/dev/null'
# Save to Desktop use: $HOME/Desktop/${scriptBasename}.log
# Save to standard user log location use: $HOME/Library/Logs/${scriptBasename}.log
# -----------------------------------
logFile="$HOME/Library/Logs/${scriptBasename}.log"

# Check for Dependencies
# -----------------------------------
# Arrays containing package dependencies needed to execute this script.
# The script will fail if dependencies are not installed.  For Mac users,
# most dependencies can be installed automatically using the package
# manager 'Homebrew'.
# -----------------------------------
homebrewDependencies=()

function mainScript() {
############## Begin Script Here ###################
####################################################

echo -n

####################################################
############### End Script Here ####################
}

############## Begin Options and Usage ###################


# Print usage
usage() {
  echo -n "${scriptName} [OPTION]... [FILE]...

This is my script template.

 Options:
  -u, --username    Username for script
  -p, --password    User password
  --force           Skip all user interaction.  Implied 'Yes' to all actions.
  -q, --quiet       Quiet (no output)
  -l, --log         Print log to file
  -s, --strict      Exit script with null variables.  i.e 'set -o nounset'
  -v, --verbose     Output more information. (Items echoed to 'verbose')
  -d, --debug       Runs script in BASH debug mode (set -x)
  -h, --help        Display this help and exit
      --version     Output version information and exit
"
}

# Iterate over options breaking -ab into -a -b when needed and --foo=bar into
# --foo bar
optstring=h
unset options
while (($#)); do
  case $1 in
    # If option is of type -ab
    -[!-]?*)
      # Loop over each character starting with the second
      for ((i=1; i < ${#1}; i++)); do
        c=${1:i:1}

        # Add current char to options
        options+=("-$c")

        # If option takes a required argument, and it's not the last char make
        # the rest of the string its argument
        if [[ $optstring = *"$c:"* && ${1:i+1} ]]; then
          options+=("${1:i+1}")
          break
        fi
      done
      ;;

    # If option is of type --foo=bar
    --?*=*) options+=("${1%%=*}" "${1#*=}") ;;
    # add --endopts for --
    --) options+=(--endopts) ;;
    # Otherwise, nothing special
    *) options+=("$1") ;;
  esac
  shift
done
set -- "${options[@]}"
unset options

# Print help if no arguments were passed.
# Uncomment to force arguments when invoking the script
# [[ $# -eq 0 ]] && set -- "--help"

# Read the options and set stuff
while [[ $1 = -?* ]]; do
  case $1 in
    -h|--help) usage >&2; safeExit ;;
    --version) echo "$(basename $0) ${version}"; safeExit ;;
    -u|--username) shift; username=${1} ;;
    -p|--password) shift; echo "Enter Pass: "; stty -echo; read PASS; stty echo;
      echo ;;
    -v|--verbose) verbose=1 ;;
    -l|--log) printLog=1 ;;
    -q|--quiet) quiet=1 ;;
    -s|--strict) strict=1;;
    -d|--debug) debug=1;;
    --force) force=1 ;;
    --endopts) shift; break ;;
    *) die "invalid option: '$1'." ;;
  esac
  shift
done

# Store the remaining part as arguments.
args+=("$@")

############## End Options and Usage ###################




# ############# ############# #############
# ##       TIME TO RUN THE SCRIPT        ##
# ##                                     ##
# ## You shouldn't need to edit anything ##
# ## beneath this line                   ##
# ##                                     ##
# ############# ############# #############

# Trap bad exits with your cleanup function
trap trapCleanup EXIT INT TERM

# Exit on error. Append '||true' when you run the script if you expect an error.
set -o errexit

# Run in debug mode, if set
if [ "${debug}" == "1" ]; then
  set -x
fi

# Exit on empty variable
if [ "${strict}" == "1" ]; then
  set -o nounset
fi

# Bash will remember & return the highest exitcode in a chain of pipes.
# This way you can catch the error in case mysqldump fails in `mysqldump |gzip`, for example.
set -o pipefail

# Invoke the checkDependencies function to test for Bash packages
checkDependencies

# Run your script
mainScript

safeExit # Exit cleanly
```

[1]: /bash-scripting-utilities/
[2]: https://github.com/natelandau/shell-scripts
[3]: https://brew.sh
