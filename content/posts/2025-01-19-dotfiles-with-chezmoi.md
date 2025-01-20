---
title: Managing dotfiles with Chezmoi
slug: managing-dotfiles-with-chezmoi
date: 2025-01-19 10:50
modified: 2025-01-19 10:50
summary: A quick overview of how I use Chezmoi to manage my dotfiles across multiple machines.
tags:
    - macos
    - unix
---
I work extensively in the command line, managing multiple servers and personal computers. To keep my workflow consistent, I rely on dotfiles - hidden configuration files that customize my system and applications. While many guides [explain](https://www.freecodecamp.org/news/dotfiles-what-is-a-dot-file-and-how-to-create-it-in-mac-and-linux/) the [basics](https://www.daytona.io/dotfiles/ultimate-guide-to-dotfiles) of [dotfiles](https://effective-shell.com/part-5-building-your-toolkit/managing-your-dotfiles/), I won't be doing that here. This post is about how I use [Chezmoi](https://www.chezmoi.io/) to keep mine in sync across all my machines.

For years, I managed my dotfiles with [a handcrafted dotfiles management system](https://github.com/natelandau/dotfiles/tree/9246c6dc67a172dfcb99fe26682453701ec3bcea). These scripts created symlinks across my filesystem, pointing to canonical files in a git repository. This worked well initially, but maintaining the sync scripts became increasingly complex over time as I added more and more features.

**Enter [Chezmoi](https://www.chezmoi.io/)**, a command line tool that *"Manages your dotfiles across multiple diverse machines, securely."*

I evaluated several dotfile management tools against my key needs: security, flexibility, and ease of maintenance. Chezmoi stood out as the ideal solution because it offers these critical features:

- **Simple installation and management** via a mature command line tool
- **Native integration with [1Password](https://1password.com/)**, my preferred secrets manager
- A powerful **templating language**
- **Hooks to call scripts** at different parts of the workflow
- Solving for **machine-to-machine differences**
- **Installing packages**
- Up-to-date and **detailed documentation**
- Ability to **remove deprecated files**
- And [so much more](https://www.chezmoi.io/comparison-table/)…

## Overview

This brief overview covers my Chezmoi setup in four main areas:

1. Machine-specific configuration to handle different environments
2. Template usage for dynamic file generation
3. Shell configuration management
4. Automation through script hooks

Each section includes practical examples from my actual setup that you can adapt for your own use. Everything I explain below (and more) can be seen in [my dotfiles repository on Github](https://github.com/natelandau/dotfiles).

### Per-machine Configuration

When initializing Chezmoi on a new computer, I set a number of flags which are used in combination with the [built-in chezmoi variables](https://www.chezmoi.io/reference/templates/variables/) in my templates to manage machine-to-machine differences.

- `use_secrets` - Enables 1Password integration and writes files which require access to my secrets. I only set this to True on my personal computers which are stringently locked down
- `personal_computer` - Adds packages and configurations for daily-use computers
- `homelab_member` - Installs packages and functionality used by servers that are members of my homelab
- `dev_computer` - Ensures my development tools and environment are set

When placed at the top of your Chezmoi configuration file, these prompts ensure a smooth first-time setup and help prevent configuration errors. Instead of manually editing the config file, you'll be guided through the key decisions:

```go
// Top of Chezmoi configuration file (.chezmoi.toml)

// The `promptOnce` functions only ask for values the first time you run Chezmoi, storing your answers for future use.
{{- $use_secrets := promptBoolOnce . "use_secrets" "Use secrets from 1Password? (true/false)" -}}
{{- $personal_computer := promptBoolOnce . "personal_computer" "Is this a personal computer for daily driving? (true/false)" -}}
{{- $homelab_member := promptBoolOnce . "homelab_member" "Is this computer in the homelab? (true/false)" -}}
{{- $dev_computer := promptBoolOnce . "dev_computer" "Do you do development on this computer? (true/false)" -}}
{{- $email := promptStringOnce . "email" "Email address" -}}
```

### Templates

Templates are Chezmoi's secret weapon. They let you maintain one set of dotfiles that adapt automatically to different environments. This means you don't need separate configurations for each machine or complex BASH if/then statements that are parsed at runtime - the templates generate the right settings based on each system's needs.

The templates use Go's syntax, which looks complex at first but relies on a few basic concepts:

- `{{ }}` denotes template actions
- `.chezmoi.os` variables are written in dot-notation
- Common operators include `eq` (equals), `and`, `or`, and `not`
- The `range` keyword lets you iterate over lists and maps
- Explore all the functions available to you [in the Chezmoi docs](https://www.chezmoi.io/reference/templates/functions/)

Here are some practical examples I frequently use that demonstrate its flexibility:

#### Boolean Logic

```go
// If running on Darwin (macOS) AND homebrew is installed
{{ if and (eq .chezmoi.os "darwin") (lookPath "brew") }}
...

// If we are on a personal computer OR are using secrets
{{ if or (.personal_computer) (.use_secrets) }}
...

// If a homelabe member AND NOT a personal computer AND the CPU is amd64
{{ if and (.homelab_member) (not (.personal_computer)) (eq .chezmoi.arch "amd64" ) }}
...
```

#### Parsing Dictionaries and Lists

For example, if you have TOML file containing server information and want to write them to a a file.

```toml
# TOML file containing servers
[remote_servers]
	[remote_servers.one]
		name = "one"
		ip = 192.168.1.100
		include = true
	[remote_servers.two]
		name = "two"
		ip = 192.168.1.101
		include = false
```

```go
// Echo the names and IP addresses of each server to ~/servers.txt
{{ range .remote_servers }}
	{{ if .include }}
		// A `$` must be pre-pended to global variables used within a range
		echo {{ .name }}={{ .ip }} >> {{ $.chezmoi.homeDir }}/servers.txt
	{{ end }}
{{ end }}
```

#### Conditionally Include Entire Files

If an entire template file is contained within an `if` statement, the file will only be written if the statement evaluates to true

```go
{{- if eq .chezmoi.os "linux" }}
# This entire file will only be written to on computers running Linux
{{- end }}
```

### ZSH and Bash Configuration

Many people store their shell settings in one large file (`.zshrc` or `.bashrc`). I take a different approach. By splitting my configuration into smaller files, I can:

- Find and edit code quickly
- Enable or disable features per machine
- Keep my code organized
- Share settings between different shells while keeping shell-specific features separate

 These templates are then `sourced` into my shell environment at runtime using the following snippet.

Note: Zsh and bash specific files are given the extension `.zsh` or `.bash` respectively. Shared files are given the extensions `.sh`

```bash
# .zshrc
# (The code is identical in .bashrc except we look for .bash files)

# Files containing files *.zsh or *.sh to be sourced to your environment
configFileLocations=(
	# I use the XDG spec. These files are located in ~/.config/dotfile_source
    "{{ .xdgConfigDir }}/dotfile_source"
)

for configFileLocation in "${configFileLocations[@]}"; do
    if [ -d "${configFileLocation}" ]; then
        while read -r configFile; do
            source "${configFile}"
        done < <(find "${configFileLocation}" \
            -maxdepth 2 \
            -type f \
            -name '*.zsh' \
            -o -name '*.sh' | sort)
    fi
done
```

### Script Hooks

Script hooks turn hours of manual setup into an automated process. When I set up a new machine, these scripts handle everything - from installing packages to configuring applications. The process is simple:

- Files starting with `run_before_*` run first
- Chezmoi applies the dotfiles
- Files starting with `run_after_*` run last

Scripts are run in alphabetical order and I number them (like `run_before_00_homebrew.sh`) to control their exact order.

You can [view all my scripts on Github](https://github.com/natelandau/dotfiles/tree/master/dotfiles/.chezmoiscripts).

**Scripts which run *before* syncing dotfiles**

- Ensuring [Homebrew](https://brew.sh/) is installed on MacOS
- Installing and upgrading [uv](https://docs.astral.sh/uv/) (my preferred Python package and environment manager)
- Installing common packages with apt, Homebrew, uv. You can see all the packages I install [in this chezmoi data file](https://github.com/natelandau/dotfiles/blob/master/dotfiles/.chezmoidata/packages.toml)

**Scripts which run *after* syncing dotfiles**

- Adding ssh keys for servers and configuring `~/.ssh/config`
- Installing some tools which are not available via package managers on some systems ([rip2](https://github.com/MilesCranmer/rip2), [Atuin](https://atuin.sh/), [Eza](https://eza.rocks/), [git-credential-manager](https://github.com/git-ecosystem/git-credential-manager), etc.)
- Configuring some applications that need to be installed before they can be configured
---
Want to try Chezmoi? Start with the official guide at [chezmoi.io](https://www.chezmoi.io/), then check out [my dotfiles repository](https://github.com/natelandau/dotfiles) then explore [my dotfiles repository](https://github.com/natelandau/dotfiles) for real-world examples. The time you spend setting it up will save you hours of configuration work later.
