#!/usr/bin/env bash
# shellcheck disable=SC1090

_mainScript_() {
    # This script is meant to be run from the root of the project

    CONFIG_FILE="${TMP_DIR}/config.bash"

    if _parseYAML_ "deploy-to-s3.yml" "CONF_" > "${CONFIG_FILE}"; then
        source "${CONFIG_FILE}"
        while read -r line; do debug "${line}"; done < "${CONFIG_FILE}"
    else
        fatal "Failed to parse configuration file"
    fi

    if ! command -v aws &>/dev/null; then
        error "AWS CLI is not installed"
        _safeExit_ "1"
    elif ! aws sts get-caller-identity &>/dev/null; then
        error "AWS CLI is not configured correctly"
        _safeExit_ "1"
    elif [ -z "${BUCKET_NAME}" ]; then
        error "Bucket name is not set. Set with --bucket-name"
        _safeExit_ "1"
    elif [[ "${BUCKET_NAME}" =~ ^(s3|/|.*/$) ]]; then
        error "Bucket name is specified correctly. It should be the name of the bucket, not the full path"
        _safeExit_ "1"
    elif [ -z "${SOURCE_DIR}" ] && _varIsFalse_ "${DELETE_ALL}"; then
        error "Source directory is not set. Set with --source-dir"
        _safeExit_ "1"
    elif [ ! -d "${SOURCE_DIR}" ] && _varIsFalse_ "${DELETE_ALL}"; then
        error "Source directory does not exist"
        _safeExit_ "1"
    elif [ ! -f "${SOURCE_DIR}/index.html" ] && _varIsFalse_ "${DELETE_ALL}"; then
        error "Source files does not seem to exist in the source directory"
        _safeExit_ "1"
    fi

    if _varIsTrue_ "${DELETE_ALL}"; then
        notice "Deleting all files in bucket"
        if _execute_ -vs "aws s3 rm \"s3://${BUCKET_NAME}\" --recursive" "Delete all files in S3 bucket"; then
            _safeExit_
        else
            error "Failed to delete files in bucket"
            _safeExit_ 1
        fi
    fi

    SYNC_COMMAND=(
        "aws s3 sync ${SOURCE_DIR}/ s3://${BUCKET_NAME}"
        "--acl public-read"
        "--delete"
        "--cache-control max-age=${CONF_MAX_AGE}"
    )

    if _varIsTrue_ "${CONF_USE_GZIP}"; then
        SYNC_COMMAND+=("--content-encoding gzip")
    fi

    for exclude in "${CONF_EXCLUDED_FILES_[@]}"; do
        SYNC_COMMAND+=("--exclude \"${exclude}\"")
    done

    if ! _execute_ -vs "${SYNC_COMMAND[*]}" "Sync site to S3"; then
        error "Failed to sync site to S3"
        _safeExit_ 1
    fi

    _createRedirect_() {
        # DESC: Creates a redirect file in the S3 bucket
        # ARGS:
        #       $1: String of a redirect in the form of "SOURCE PATH"
        # OUTS:
        #       0 - Sucess
        #       1 - Failure
        # USAGE:
        #   _createRedirect_ "old/path/index.html new/path/index.html"

        [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

        local _array
        local _source
        local _target
        local _sourcePath
        local _source_local

        mapfile -t _array < <(_splitString_ "${1}" " ")

        _source="${_array[0]}"
        _target="${_array[1]}"

        if [[ "${_source}" == "${_target}" ]]; then
            notice "Skipping redirect for ${_source}, target = source"
            return 0
        elif _varIsEmpty_ "${_source}"; then
            notice "Skipping redirect for ${_target}, source is empty"
            return 0
        elif _varIsEmpty_ "${_target}"; then
            notice "Skipping redirect for ${_source}, target is empty"
            return 0
        elif [[ "${_source}" == "/" ]]; then
            notice "Skipping redirect for ${_source}, source is root"
            return 0
        elif [[ ! "${_target}" =~ ^(/|https://) ]]; then
            notice "Skipping redirect for ${_source}, target must start with '/' or 'https://'"
            return 0
        fi

        _source_local="${SOURCE_DIR}/${_source}"
        _sourcePath=$(_filePath_ "${SOURCE_DIR}/${_source}")


        if [ -f "${_source_local}" ]; then
            notice "${_source_local} already exists"
            if _seekConfirmation_ "Delete '${_source_local}' and create redirect?"; then
                _execute_ "rm \"${_source_local}\""
            else
                debug "Skipping redirect for ${_source_local}, file already exists"
                return 0
            fi
        fi


        if [ ! -d "${_sourcePath}" ]; then
            _execute_ "mkdir -p \"${_sourcePath}\" && touch \"${_source_local}\""
        else
            _execute_ "touch \"${_source_local}\""
        fi


        if ! _execute_ -s "aws s3 cp ${_source_local} s3://${BUCKET_NAME}/${_source} --website-redirect \"${_target}\" --cache-control max-age=0,no-cache --acl public-read" "Redirected ${_source} to ${_target}"; then
            return 1
        fi
    }

    for redirect in "${CONF_REDIRECTS_[@]}"; do
        if ! _createRedirect_ "${redirect}"; then
            error "Failed to create redirect for ${redirect}"
            _safeExit_ 1
        fi
    done



}
# end _mainScript_

# ################################## Flags and defaults
# Required variables
LOGFILE="${HOME}/logs/$(basename "$0").log"
QUIET=false
LOGLEVEL=ERROR
VERBOSE=false
FORCE=false
DRYRUN=false
declare -a ARGS=()

# Script specific
DELETE_ALL=false
BUCKET_NAME=""
SOURCE_DIR=""

# ################################## Custom utility functions (Pasted from repository)
_varIsTrue_() {
    # DESC:
    #					Check if a given variable is true
    # ARGS:
    #					$1 (required): Variable to check
    # OUTS:
    #					0 - Variable is true
    #					1 - Variable is false
    # USAGE
    #					_varIsTrue_ "${var}"

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    [[ ${1,,} == "true" || ${1} == 0 ]] && return 0 || return 1
}

_varIsFalse_() {
    # DESC:
    #					Check if a given variable is false
    # ARGS:
    #					$1 (required): Variable to check
    # OUTS:
    #					0 - Variable is false
    #					1 - Variable is true
    # USAGE
    #					_varIsFalse_ "${var}"

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    [[ ${1,,} == "false" || ${1} == 1 ]] && return 0 || return 1
}

_varIsEmpty_() {
    # DESC:
    #					Check if given variable is empty or null.
    # ARGS:
    #					$1 (required): Variable to check
    # OUTS:
    #					0 - Variable is empty or null
    #					1 - Variable is not empty or null
    # USAGE
    #					_varIsEmpty_ "${var}"

    [[ -z ${1:-} || ${1:-} == "null"|| ${1:-} == "" ]] && return 0 || return 1
}

_parseYAML_() {
    # DESC:
    #         Convert a YAML file into BASH variables for use in a shell script
    # ARGS:
    #         $1 (Required) - Source YAML file
    #         $2 (Required) - Prefix for the variables to avoid namespace collisions
    # OUTS:
    #         Prints variables and arrays derived from YAML File
    # USAGE:
    #         To source into a script
    #         _parseYAML_ "sample.yml" "CONF_" > tmp/variables.txt
    #         source "tmp/variables.txt"
    #
    # NOTE:
    #         https://gist.github.com/DinoChiesa/3e3c3866b51290f31243
    #         https://gist.github.com/epiloque/8cf512c6d64641bde388

    [[ $# -lt 2 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local _yamlFile="${1}"
    local _prefix="${2:-}"

    [ ! -s "${_yamlFile}" ] && return 1

    local _s='[[:space:]]*'
    local _w='[a-zA-Z0-9_]*'
    local _fs
    _fs="$(printf @ | tr @ '\034')"

    sed -ne "s|^\(${_s}\)\(${_w}\)${_s}:${_s}\"\(.*\)\"${_s}\$|\1${_fs}\2${_fs}\3|p" \
        -e "s|^\(${_s}\)\(${_w}\)${_s}[:-]${_s}\(.*\)${_s}\$|\1${_fs}\2${_fs}\3|p" "${_yamlFile}" \
        | awk -F"${_fs}" '{
    indent = length($1)/2;
    if (length($2) == 0) { conj[indent]="+";} else {conj[indent]="";}
    vname[indent] = $2;
    for (i in vname) {if (i > indent) {delete vname[i]}}
    if (length($3) > 0) {
            vn=""; for (i=0; i<indent; i++) {vn=(vn)(vname[i])("_")}
            printf("%s%s%s%s=(\"%s\")\n", "'"${_prefix}"'",vn, $2, conj[indent-1],$3);
    }
  }' | sed 's/_=/+=/g' | sed 's/[[:space:]]*#.*"/"/g'
}

_splitString_() (
    # DESC:
    #					Split a string into an array based on a given delimiter
    # ARGS:
    #					$1 (Required) - String to be split
    #					$2 (Required) - Delimiter
    # OUTS:
    #					0 - Success
    #					1 - Failure
    #					stdout: Values split by delimiter separated by newline
    # USAGE:
    #					ARRAY=( $(_splitString_ "string1,string2,string3" ",") )

    [[ $# -lt 2 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    declare -a _arr=()
    local _input="${1}"
    local _delimeter="${2}"

    IFS="${_delimeter}" read -r -a _arr <<<"${_input}"

    printf '%s\n' "${_arr[@]}"
)

_filePath_() {
    # DESC:
    #					Finds the directory name from a file path. If it exists on filesystem, print
    #         absolute path.  If a string, remove the filename and return the path
    # ARGS:
    #					$1 (Required) - Input string path
    # OUTS:
    #					0 - Success
    #					1 - Failure
    #					stdout: Directory path
    # USAGE:
    #					_fileDir_ "some/path/to/file.txt" --> "some/path/to"
    # CREDIT:
    #         https://github.com/labbots/bash-utility/

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local _tmp=${1}

    if [ -e "${_tmp}" ]; then
        _tmp="$(dirname "$(realpath "${_tmp}")")"
    else
        [[ ${_tmp} != *[!/]* ]] && { printf '/\n' && return; }
        _tmp="${_tmp%%"${_tmp##*[!/]}"}"

        [[ ${_tmp} != */* ]] && { printf '.\n' && return; }
        _tmp=${_tmp%/*} && _tmp="${_tmp%%"${_tmp##*[!/]}"}"
    fi
    printf '%s' "${_tmp:-/}"
}

_fileExtension_() {
    # DESC:
    #					Gets an extension from a file name. Finds a few common double extensions (tar.gz, tar.bz2, log.1)
    # ARGS:
    #					$1 (Required) - Input string path
    # OUTS:
    #					0 - Success
    #					1 - If no extension found in filename
    #					stdout: extension (without the .)
    # USAGE:
    #					_fileExtension_ "some/path/to/file.txt" --> "txt"

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local _file
    local _extension
    local _levels
    local _ext
    local _exts
    _file="${1##*/}"

    # Detect some common multi-extensions
    if [[ -z ${_levels:-} ]]; then
        case $(tr '[:upper:]' '[:lower:]' <<<"${_file}") in
            *.tar.gz | *.tar.bz2 | *.log.[0-9]) _levels=2 ;;
            *) _levels=1 ;;
        esac
    fi

    _fn="${_file}"
    for ((i = 0; i < _levels; i++)); do
        _ext=${_fn##*.}
        if [[ ${i} == 0 ]]; then
            _exts=${_ext}${_exts:-}
        else
            _exts=${_ext}.${_exts:-}
        fi
        _fn=${_fn%."${_ext}"}
    done
    [[ ${_file} == "${_exts}" ]] && return 1

    printf "%s" "${_exts}"

}

_execute_() {
    # DESC:
    #         Executes commands while respecting global DRYRUN, VERBOSE, LOGGING, and QUIET flags
    # ARGS:
    #         $1 (Required) - The command to be executed.  Quotation marks MUST be escaped.
    #         $2 (Optional) - String to display after command is executed
    # OPTS:
    #         -v    Always print output from the execute function to STDOUT
    #         -n    Use NOTICE level alerting (default is INFO)
    #         -p    Pass a failed command with 'return 0'.  This effectively bypasses set -e.
    #         -e    Bypass _alert_ functions and use 'printf RESULT'
    #         -s    Use '_alert_ success' for successful output. (default is 'info')
    #         -q    Do not print output (QUIET mode)
    # OUTS:
    #         stdout: Configurable output
    # USE :
    #         _execute_ "cp -R \"~/dir/somefile.txt\" \"someNewFile.txt\"" "Optional message"
    #         _execute_ -sv "mkdir \"some/dir\""
    # NOTE:
    #         If $DRYRUN=true, no commands are executed and the command that would have been executed
    #         is printed to STDOUT using dryrun level alerting
    #         If $VERBOSE=true, the command's native output is printed to stdout. This can be forced
    #         with '_execute_ -v'

    local _localVerbose=false
    local _passFailures=false
    local _echoResult=false
    local _echoSuccessResult=false
    local _quietMode=false
    local _echoNoticeResult=false
    local opt

    local OPTIND=1
    while getopts ":vVpPeEsSqQnN" opt; do
        case ${opt} in
            v | V) _localVerbose=true ;;
            p | P) _passFailures=true ;;
            e | E) _echoResult=true ;;
            s | S) _echoSuccessResult=true ;;
            q | Q) _quietMode=true ;;
            n | N) _echoNoticeResult=true ;;
            *)
                {
                    error "Unrecognized option '$1' passed to _execute_. Exiting."
                    _safeExit_
                }
                ;;
        esac
    done
    shift $((OPTIND - 1))

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local _command="${1}"
    local _executeMessage="${2:-$1}"

    local _saveVerbose=${VERBOSE}
    if "${_localVerbose}"; then
        VERBOSE=true
    fi

    if "${DRYRUN:-}"; then
        if "${_quietMode}"; then
            VERBOSE=${_saveVerbose}
            return 0
        fi
        if [ -n "${2:-}" ]; then
            dryrun "${1} (${2})" "$(caller)"
        else
            dryrun "${1}" "$(caller)"
        fi
    elif ${VERBOSE:-}; then
        if eval "${_command}"; then
            if "${_quietMode}"; then
                VERBOSE=${_saveVerbose}
            elif "${_echoResult}"; then
                printf "%s\n" "${_executeMessage}"
            elif "${_echoSuccessResult}"; then
                success "${_executeMessage}"
            elif "${_echoNoticeResult}"; then
                notice "${_executeMessage}"
            else
                info "${_executeMessage}"
            fi
        else
            if "${_quietMode}"; then
                VERBOSE=${_saveVerbose}
            elif "${_echoResult}"; then
                printf "%s\n" "warning: ${_executeMessage}"
            else
                warning "${_executeMessage}"
            fi
            VERBOSE=${_saveVerbose}
            "${_passFailures}" && return 0 || return 1
        fi
    else
        if eval "${_command}" >/dev/null 2>&1; then
            if "${_quietMode}"; then
                VERBOSE=${_saveVerbose}
            elif "${_echoResult}"; then
                printf "%s\n" "${_executeMessage}"
            elif "${_echoSuccessResult}"; then
                success "${_executeMessage}"
            elif "${_echoNoticeResult}"; then
                notice "${_executeMessage}"
            else
                info "${_executeMessage}"
            fi
        else
            if "${_quietMode}"; then
                VERBOSE=${_saveVerbose}
            elif "${_echoResult}"; then
                printf "%s\n" "error: ${_executeMessage}"
            else
                warning "${_executeMessage}"
            fi
            VERBOSE=${_saveVerbose}
            "${_passFailures}" && return 0 || return 1
        fi
    fi
    VERBOSE=${_saveVerbose}
    return 0
}

_seekConfirmation_() {
    # DESC:
    #         Seek user input for yes/no question
    # ARGS:
    #         $1 (Required) - Question being asked
    # OUTS:
    #         0 if answer is "yes"
    #         1 if answer is "no"
    # USAGE:
    #         _seekConfirmation_ "Do something?" && printf "okay" || printf "not okay"
    #         OR
    #         if _seekConfirmation_ "Answer this question"; then
    #           something
    #         fi

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local _yesNo
    input "${1}"
    if "${FORCE:-}"; then
        debug "Forcing confirmation with '--force' flag set"
        printf "%s\n" " "
        return 0
    else
        while true; do
            read -r -p " (y/n) " _yesNo
            case ${_yesNo} in
                [Yy]*) return 0 ;;
                [Nn]*) return 1 ;;
                *) input "Please answer yes or no." ;;
            esac
        done
    fi
}

# ################################## Functions required for this template to work

_setColors_() {
    # DESC:
    #         Sets colors use for alerts.
    # ARGS:
    #         None
    # OUTS:
    #         None
    # USAGE:
    #         printf "%s\n" "${blue}Some text${reset}"

    if tput setaf 1 >/dev/null 2>&1; then
        bold=$(tput bold)
        underline=$(tput smul)
        reverse=$(tput rev)
        reset=$(tput sgr0)

        if [[ $(tput colors) -ge 256 ]] >/dev/null 2>&1; then
            white=$(tput setaf 231)
            blue=$(tput setaf 38)
            yellow=$(tput setaf 11)
            green=$(tput setaf 82)
            red=$(tput setaf 9)
            purple=$(tput setaf 171)
            gray=$(tput setaf 250)
        else
            white=$(tput setaf 7)
            blue=$(tput setaf 38)
            yellow=$(tput setaf 3)
            green=$(tput setaf 2)
            red=$(tput setaf 9)
            purple=$(tput setaf 13)
            gray=$(tput setaf 7)
        fi
    else
        bold="\033[4;37m"
        reset="\033[0m"
        underline="\033[4;37m"
        # shellcheck disable=SC2034
        reverse=""
        white="\033[0;37m"
        blue="\033[0;34m"
        yellow="\033[0;33m"
        green="\033[1;32m"
        red="\033[0;31m"
        purple="\033[0;35m"
        gray="\033[0;37m"
    fi
}

_alert_() {
    # DESC:
    #         Controls all printing of messages to log files and stdout.
    # ARGS:
    #         $1 (required) - The type of alert to print
    #                         (success, header, notice, dryrun, debug, warning, error,
    #                         fatal, info, input)
    #         $2 (required) - The message to be printed to stdout and/or a log file
    #         $3 (optional) - Pass '${LINENO}' to print the line number where the _alert_ was triggered
    # OUTS:
    #         stdout: The message is printed to stdout
    #         log file: The message is printed to a log file
    # USAGE:
    #         [_alertType] "[MESSAGE]" "${LINENO}"
    # NOTES:
    #         - The colors of each alert type are set in this function
    #         - For specified alert types, the funcstac will be printed

    local _color
    local _alertType="${1}"
    local _message="${2}"
    local _line="${3:-}" # Optional line number

    [[ $# -lt 2 ]] && fatal 'Missing required argument to _alert_'

    if [[ -n ${_line} && ${_alertType} =~ ^(fatal|error) && ${FUNCNAME[2]} != "_trapCleanup_" ]]; then
        _message="${_message} ${gray}(line: ${_line}) $(_printFuncStack_)"
    elif [[ -n ${_line} && ${FUNCNAME[2]} != "_trapCleanup_" ]]; then
        _message="${_message} ${gray}(line: ${_line})"
    elif [[ -z ${_line} && ${_alertType} =~ ^fatal && ${FUNCNAME[2]} != "_trapCleanup_" ]]; then
        _message="${_message} ${gray}$(_printFuncStack_)"
    fi

    if [[ ${_alertType} =~ ^(error|fatal) ]]; then
        _color="${bold}${red}"
    elif [ "${_alertType}" == "info" ]; then
        _color="${gray}"
    elif [ "${_alertType}" == "warning" ]; then
        _color="${red}"
    elif [ "${_alertType}" == "success" ]; then
        _color="${green}"
    elif [ "${_alertType}" == "debug" ]; then
        _color="${purple}"
    elif [ "${_alertType}" == "header" ]; then
        _color="${bold}${white}${underline}"
    elif [ "${_alertType}" == "notice" ]; then
        _color="${bold}"
    elif [ "${_alertType}" == "input" ]; then
        _color="${bold}${underline}"
    elif [ "${_alertType}" = "dryrun" ]; then
        _color="${blue}"
    else
        _color=""
    fi

    _writeToScreen_() {
        ("${QUIET}") && return 0 # Print to console when script is not 'quiet'
        [[ ${VERBOSE} == false && ${_alertType} =~ ^(debug|verbose) ]] && return 0

        if ! [[ -t 1 || -z ${TERM:-} ]]; then # Don't use colors on non-recognized terminals
            _color=""
            reset=""
        fi

        if [[ ${_alertType} == header ]]; then
            printf "${_color}%s${reset}\n" "${_message}"
        else
            printf "${_color}[%7s] %s${reset}\n" "${_alertType}" "${_message}"
        fi
    }
    _writeToScreen_

    _writeToLog_() {
        [[ ${_alertType} == "input" ]] && return 0
        [[ ${LOGLEVEL} =~ (off|OFF|Off) ]] && return 0
        if [ -z "${LOGFILE:-}" ]; then
            LOGFILE="$(pwd)/$(basename "$0").log"
        fi
        [ ! -d "$(dirname "${LOGFILE}")" ] && mkdir -p "$(dirname "${LOGFILE}")"
        [[ ! -f ${LOGFILE} ]] && touch "${LOGFILE}"

        # Don't use colors in logs
        local _cleanmessage
        _cleanmessage="$(printf "%s" "${_message}" | sed -E 's/(\x1b)?\[(([0-9]{1,2})(;[0-9]{1,3}){0,2})?[mGK]//g')"
        # Print message to log file
        printf "%s [%7s] %s %s\n" "$(date +"%b %d %R:%S")" "${_alertType}" "[$(/bin/hostname)]" "${_cleanmessage}" >>"${LOGFILE}"
    }

    # Write specified log level data to logfile
    case "${LOGLEVEL:-ERROR}" in
        ALL | all | All)
            _writeToLog_
            ;;
        DEBUG | debug | Debug)
            _writeToLog_
            ;;
        INFO | info | Info)
            if [[ ${_alertType} =~ ^(error|fatal|warning|info|notice|success) ]]; then
                _writeToLog_
            fi
            ;;
        NOTICE | notice | Notice)
            if [[ ${_alertType} =~ ^(error|fatal|warning|notice|success) ]]; then
                _writeToLog_
            fi
            ;;
        WARN | warn | Warn)
            if [[ ${_alertType} =~ ^(error|fatal|warning) ]]; then
                _writeToLog_
            fi
            ;;
        ERROR | error | Error)
            if [[ ${_alertType} =~ ^(error|fatal) ]]; then
                _writeToLog_
            fi
            ;;
        FATAL | fatal | Fatal)
            if [[ ${_alertType} =~ ^fatal ]]; then
                _writeToLog_
            fi
            ;;
        OFF | off)
            return 0
            ;;
        *)
            if [[ ${_alertType} =~ ^(error|fatal) ]]; then
                _writeToLog_
            fi
            ;;
    esac

} # /_alert_

error() {
    _alert_ error "${1}" "${2:-}"
    _safeExit_ "1"
}
warning() { _alert_ warning "${1}" "${2:-}"; }
notice() { _alert_ notice "${1}" "${2:-}"; }
info() { _alert_ info "${1}" "${2:-}"; }
success() { _alert_ success "${1}" "${2:-}"; }
dryrun() { _alert_ dryrun "${1}" "${2:-}"; }
input() { _alert_ input "${1}" "${2:-}"; }
header() { _alert_ header "${1}" "${2:-}"; }
debug() { _alert_ debug "${1}" "${2:-}"; }
fatal() {
    _alert_ fatal "${1}" "${2:-}"
    _safeExit_ "1"
}

_printFuncStack_() {
    # DESC:
    #         Prints the function stack in use. Used for debugging, and error reporting.
    # ARGS:
    #         None
    # OUTS:
    #         stdout: Prints [function]:[file]:[line]
    # NOTE:
    #         Does not print functions from the alert class
    local _i
    declare -a _funcStackResponse=()
    for ((_i = 1; _i < ${#BASH_SOURCE[@]}; _i++)); do
        case "${FUNCNAME[${_i}]}" in
            _alert_ | _trapCleanup_ | fatal | error | warning | notice | info | debug | dryrun | header | success)
                continue
                ;;
            *)
                _funcStackResponse+=("${FUNCNAME[${_i}]}:$(basename "${BASH_SOURCE[${_i}]}"):${BASH_LINENO[_i - 1]}")
                ;;
        esac

    done
    printf "( "
    printf %s "${_funcStackResponse[0]}"
    printf ' < %s' "${_funcStackResponse[@]:1}"
    printf ' )\n'
}

_safeExit_() {
    # DESC:
    #       Cleanup and exit from a script
    # ARGS:
    #       $1 (optional) - Exit code (defaults to 0)
    # OUTS:
    #       None

    if [[ -d ${SCRIPT_LOCK:-} ]]; then
        if command rm -rf "${SCRIPT_LOCK}"; then
            debug "Removing script lock"
        else
            warning "Script lock could not be removed. Try manually deleting ${yellow}'${SCRIPT_LOCK}'"
        fi
    fi

    if [[ -n ${TMP_DIR:-} && -d ${TMP_DIR:-} ]]; then
        if [[ ${1:-} == 1 && -n "$(ls "${TMP_DIR}")" ]]; then
            command rm -r "${TMP_DIR}"
        else
            command rm -r "${TMP_DIR}"
            debug "Removing temp directory"
        fi
    fi

    trap - INT TERM EXIT
    exit "${1:-0}"
}

_trapCleanup_() {
    # DESC:
    #         Log errors and cleanup from script when an error is trapped.  Called by 'trap'
    # ARGS:
    #         $1:  Line number where error was trapped
    #         $2:  Line number in function
    #         $3:  Command executing at the time of the trap
    #         $4:  Names of all shell functions currently in the execution call stack
    #         $5:  Scriptname
    #         $6:  $BASH_SOURCE
    # USAGE:
    #         trap '_trapCleanup_ ${LINENO} ${BASH_LINENO} "${BASH_COMMAND}" "${FUNCNAME[*]}" "${0}" "${BASH_SOURCE[0]}"' EXIT INT TERM SIGINT SIGQUIT SIGTERM ERR
    # OUTS:
    #         Exits script with error code 1

    local _line=${1:-} # LINENO
    local _linecallfunc=${2:-}
    local _command="${3:-}"
    local _funcstack="${4:-}"
    local _script="${5:-}"
    local _sourced="${6:-}"

    # Replace the cursor in-case 'tput civis' has been used
    tput cnorm

    if declare -f "fatal" &>/dev/null && declare -f "_printFuncStack_" &>/dev/null; then

        _funcstack="'$(printf "%s" "${_funcstack}" | sed -E 's/ / < /g')'"

        if [[ ${_script##*/} == "${_sourced##*/}" ]]; then
            fatal "${7:-} command: '${_command}' (line: ${_line}) [func: $(_printFuncStack_)]"
        else
            fatal "${7:-} command: '${_command}' (func: ${_funcstack} called at line ${_linecallfunc} of '${_script##*/}') (line: ${_line} of '${_sourced##*/}') "
        fi
    else
        printf "%s\n" "Fatal error trapped. Exiting..."
    fi

    if declare -f _safeExit_ &>/dev/null; then
        _safeExit_ 1
    else
        exit 1
    fi
}

_makeTempDir_() {
    # DESC:
    #         Creates a temp directory to house temporary files
    # ARGS:
    #         $1 (Optional) - First characters/word of directory name
    # OUTS:
    #         Sets $TMP_DIR variable to the path of the temp directory
    # USAGE:
    #         _makeTempDir_ "$(basename "$0")"

    [ -d "${TMP_DIR:-}" ] && return 0

    if [ -n "${1:-}" ]; then
        TMP_DIR="${TMPDIR:-/tmp/}${1}.${RANDOM}.${RANDOM}.$$"
    else
        TMP_DIR="${TMPDIR:-/tmp/}$(basename "$0").${RANDOM}.${RANDOM}.${RANDOM}.$$"
    fi
    (umask 077 && mkdir "${TMP_DIR}") || {
        fatal "Could not create temporary directory! Exiting."
    }
    debug "\$TMP_DIR=${TMP_DIR}"
}

# shellcheck disable=SC2120
_acquireScriptLock_() {
    # DESC:
    #         Acquire script lock to prevent running the same script a second time before the
    #         first instance exits
    # ARGS:
    #         $1 (optional) - Scope of script execution lock (system or user)
    # OUTS:
    #         exports $SCRIPT_LOCK - Path to the directory indicating we have the script lock
    #         Exits script if lock cannot be acquired
    # NOTE:
    #         If the lock was acquired it's automatically released in _safeExit_()

    local _lockDir
    if [[ ${1:-} == 'system' ]]; then
        _lockDir="${TMPDIR:-/tmp/}$(basename "$0").lock"
    else
        _lockDir="${TMPDIR:-/tmp/}$(basename "$0").${UID}.lock"
    fi

    if command mkdir "${_lockDir}" 2>/dev/null; then
        readonly SCRIPT_LOCK="${_lockDir}"
        debug "Acquired script lock: ${yellow}${SCRIPT_LOCK}${purple}"
    else
        if declare -f "_safeExit_" &>/dev/null; then
            warning "Unable to acquire script lock: ${yellow}${_lockDir}${red}"
            error "If you trust the script isn't running, delete the lock dir"
            _safeExit_ 1
        else
            printf "%s\n" "ERROR: Could not acquire script lock. If you trust the script isn't running, delete: ${_lockDir}"
            exit 1
        fi

    fi
}

_setPATH_() {
    # DESC:
    #         Add directories to $PATH so script can find executables
    # ARGS:
    #         $@ - One or more paths
    # OPTS:
    #         -x - Fail if directories are not found
    # OUTS:
    #         0: Success
    #         1: Failure
    #         Adds items to $PATH
    # USAGE:
    #         _setPATH_ "/usr/local/bin" "${HOME}/bin" "$(npm bin)"

    [[ $# == 0 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local opt
    local OPTIND=1
    local _failIfNotFound=false

    while getopts ":xX" opt; do
        case ${opt} in
            x | X) _failIfNotFound=true ;;
            *)
                {
                    error "Unrecognized option '${1}' passed to _backupFile_" "${LINENO}"
                    return 1
                }
                ;;
        esac
    done
    shift $((OPTIND - 1))

    local _newPath

    for _newPath in "$@"; do
        if [ -d "${_newPath}" ]; then
            if ! printf "%s" "${PATH}" | grep -Eq "(^|:)${_newPath}($|:)"; then
                if PATH="${_newPath}:${PATH}"; then
                    debug "Added '${_newPath}' to PATH"
                else
                    debug "'${_newPath}' already in PATH"
                fi
            else
                debug "_setPATH_: '${_newPath}' already exists in PATH"
            fi
        else
            debug "_setPATH_: can not find: ${_newPath}"
            if [[ ${_failIfNotFound} == true ]]; then
                return 1
            fi
            continue
        fi
    done
    return 0
}

_useGNUutils_() {
    # DESC:
    #					Add GNU utilities to PATH to allow consistent use of sed/grep/tar/etc. on MacOS
    # ARGS:
    #					None
    # OUTS:
    #					0 if successful
    #         1 if unsuccessful
    #         PATH: Adds GNU utilities to the path
    # USAGE:
    #					# if ! _useGNUUtils_; then exit 1; fi
    # NOTES:
    #					GNU utilities can be added to MacOS using Homebrew

    ! declare -f "_setPATH_" &>/dev/null && fatal "${FUNCNAME[0]} needs function _setPATH_"

    if _setPATH_ \
        "/usr/local/opt/gnu-tar/libexec/gnubin" \
        "/usr/local/opt/coreutils/libexec/gnubin" \
        "/usr/local/opt/gnu-sed/libexec/gnubin" \
        "/usr/local/opt/grep/libexec/gnubin" \
        "/usr/local/opt/findutils/libexec/gnubin" \
        "/opt/homebrew/opt/findutils/libexec/gnubin" \
        "/opt/homebrew/opt/gnu-sed/libexec/gnubin" \
        "/opt/homebrew/opt/grep/libexec/gnubin" \
        "/opt/homebrew/opt/coreutils/libexec/gnubin" \
        "/opt/homebrew/opt/gnu-tar/libexec/gnubin"; then
        return 0
    else
        return 1
    fi

}

_homebrewPath_() {
    # DESC:
    #					Add homebrew bin dir to PATH
    # ARGS:
    #					None
    # OUTS:
    #					0 if successful
    #         1 if unsuccessful
    #         PATH: Adds homebrew bin directory to PATH
    # USAGE:
    #					# if ! _homebrewPath_; then exit 1; fi

    ! declare -f "_setPATH_" &>/dev/null && fatal "${FUNCNAME[0]} needs function _setPATH_"

    if _uname=$(command -v uname); then
        if "${_uname}" | tr '[:upper:]' '[:lower:]' | grep -q 'darwin'; then
            if _setPATH_ "/usr/local/bin" "/opt/homebrew/bin"; then
                return 0
            else
                return 1
            fi
        fi
    else
        if _setPATH_ "/usr/local/bin" "/opt/homebrew/bin"; then
            return 0
        else
            return 1
        fi
    fi
}

_parseOptions_() {
    # DESC:
    #					Iterates through options passed to script and sets variables. Will break -ab into -a -b
    #         when needed and --foo=bar into --foo bar
    # ARGS:
    #					$@ from command line
    # OUTS:
    #					Sets array 'ARGS' containing all arguments passed to script that were not parsed as options
    # USAGE:
    #					_parseOptions_ "$@"

    # Iterate over options
    local _optstring=h
    declare -a _options
    local _c
    local i
    while (($#)); do
        case $1 in
            # If option is of type -ab
            -[!-]?*)
                # Loop over each character starting with the second
                for ((i = 1; i < ${#1}; i++)); do
                    _c=${1:i:1}
                    _options+=("-${_c}") # Add current char to options
                    # If option takes a required argument, and it's not the last char make
                    # the rest of the string its argument
                    if [[ ${_optstring} == *"${_c}:"* && -n ${1:i+1} ]]; then
                        _options+=("${1:i+1}")
                        break
                    fi
                done
                ;;
            # If option is of type --foo=bar
            --?*=*) _options+=("${1%%=*}" "${1#*=}") ;;
            # add --endopts for --
            --) _options+=(--endopts) ;;
            # Otherwise, nothing special
            *) _options+=("$1") ;;
        esac
        shift
    done
    set -- "${_options[@]:-}"
    unset _options

    # Read the options and set stuff
    # shellcheck disable=SC2034
    while [[ ${1:-} == -?* ]]; do
        case $1 in
            # Custom options
            --bucket-name)
                shift
                BUCKET_NAME="${1}"
                ;;
            --source-dir)
                shift
                SOURCE_DIR="${1}"
                ;;
            --delete-all) DELETE_ALL=true ;;
            # Common options
            -h | --help)
                _usage_
                _safeExit_
                ;;
            --loglevel)
                shift
                LOGLEVEL=${1}
                ;;
            --logfile)
                shift
                LOGFILE="${1}"
                ;;
            -n | --dryrun) DRYRUN=true ;;
            -v | --verbose) VERBOSE=true ;;
            -q | --quiet) QUIET=true ;;
            --force) FORCE=true ;;
            --endopts)
                shift
                break
                ;;
            *)
                if declare -f _safeExit_ &>/dev/null; then
                    fatal "invalid option: $1"
                else
                    printf "%s\n" "ERROR: Invalid option: $1"
                    exit 1
                fi
                ;;
        esac
        shift
    done

    if [[ -z ${*} || ${*} == null ]]; then
        ARGS=()
    else
        ARGS+=("$@") # Store the remaining user input as arguments.
    fi
}

_columns_() {
    # DESC:
    #         Prints a two column output from a key/value pair.
    #         Optionally pass a number of 2 space tabs to indent the output.
    # ARGS:
    #         $1 (required): Key name (Left column text)
    #         $2 (required): Long value (Right column text. Wraps around if too long)
    #         $3 (optional): Number of 2 character tabs to indent the command (default 1)
    # OPTS:
    #         -b    Bold the left column
    #         -u    Underline the left column
    #         -r    Reverse background and foreground colors
    # OUTS:
    #         stdout: Prints the output in columns
    # NOTE:
    #         Long text or ANSI colors in the first column may create display issues
    # USAGE:
    #         _columns_ "Key" "Long value text" [tab level]

    [[ $# -lt 2 ]] && fatal "Missing required argument to ${FUNCNAME[0]}"

    local opt
    local OPTIND=1
    local _style=""
    while getopts ":bBuUrR" opt; do
        case ${opt} in
            b | B) _style="${_style}${bold}" ;;
            u | U) _style="${_style}${underline}" ;;
            r | R) _style="${_style}${reverse}" ;;
            *) fatal "Unrecognized option '${1}' passed to ${FUNCNAME[0]}. Exiting." ;;
        esac
    done
    shift $((OPTIND - 1))

    local _key="${1}"
    local _value="${2}"
    local _tabLevel="${3-}"
    local _tabSize=2
    local _line
    local _rightIndent
    local _leftIndent
    if [[ -z ${3-} ]]; then
        _tabLevel=0
    fi

    _leftIndent="$((_tabLevel * _tabSize))"

    local _leftColumnWidth="$((30 + _leftIndent))"

    if [ "$(tput cols)" -gt 180 ]; then
        _rightIndent=110
    elif [ "$(tput cols)" -gt 160 ]; then
        _rightIndent=90
    elif [ "$(tput cols)" -gt 130 ]; then
        _rightIndent=60
    elif [ "$(tput cols)" -gt 120 ]; then
        _rightIndent=50
    elif [ "$(tput cols)" -gt 110 ]; then
        _rightIndent=40
    elif [ "$(tput cols)" -gt 100 ]; then
        _rightIndent=30
    elif [ "$(tput cols)" -gt 90 ]; then
        _rightIndent=20
    elif [ "$(tput cols)" -gt 80 ]; then
        _rightIndent=10
    else
        _rightIndent=0
    fi

    local _rightWrapLength=$(($(tput cols) - _leftColumnWidth - _leftIndent - _rightIndent))

    local _first_line=0
    while read -r _line; do
        if [[ ${_first_line} -eq 0 ]]; then
            _first_line=1
        else
            _key=" "
        fi
        printf "%-${_leftIndent}s${_style}%-${_leftColumnWidth}b${reset} %b\n" "" "${_key}${reset}" "${_line}"
    done <<<"$(fold -w${_rightWrapLength} -s <<<"${_value}")"
}

_usage_() {
    cat <<USAGE_TEXT

  ${bold}$(basename "$0") [OPTION]... --bucket-name [NAME]${reset}

  Deploys static files to an S3 bucket.

  Requires that ENV variables are set for the following:

    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_DEFAULT_REGION

  Configuration values are passed in 'deploy-to-s3.yaml'

  ${bold}${underline}AWS Options:${reset}
$(_columns_ -b -- '--bucket-name' "Name of the S3 bucket (not the arn) [Required]" 2)
$(_columns_ -b -- '--source-dir' "Path to the directory containing site files [Required]" 2)
$(_columns_ -b -- '--delete-all' "Delete's all files within the specified bucket" 2)

  ${bold}${underline}Script Options:${reset}
$(_columns_ -b -- '-h, --help' "Display this help and exit" 2)
$(_columns_ -b -- "--loglevel [LEVEL]" "One of: FATAL, ERROR (default), WARN, INFO, NOTICE, DEBUG, ALL, OFF" 2)
$(_columns_ -b -- "--logfile [FILE]" "Full PATH to logfile.  (Default is '\${HOME}/logs/$(basename "$0").log')" 2)
$(_columns_ -b -- "-n, --dryrun" "Non-destructive. Makes no permanent changes." 2)
$(_columns_ -b -- "-q, --quiet" "Quiet (no output)" 2)
$(_columns_ -b -- "-v, --verbose" "Output more information. (Items echoed to 'verbose')" 2)
$(_columns_ -b -- "--force" "Skip all user interaction.  Implied 'Yes' to all actions." 2)

  ${bold}${underline}Example Usage:${reset}

    ${gray}# Run the script and specify log level and log file.${reset}
    $(basename "$0") -vn --logfile "/path/to/file.log" --loglevel 'WARN'
USAGE_TEXT
}

# ################################## INITIALIZE AND RUN THE SCRIPT
#                                    (Comment or uncomment the lines below to customize script behavior)

trap '_trapCleanup_ ${LINENO} ${BASH_LINENO} "${BASH_COMMAND}" "${FUNCNAME[*]}" "${0}" "${BASH_SOURCE[0]}"' EXIT INT TERM SIGINT SIGQUIT SIGTERM

# Trap errors in subshells and functions
set -o errtrace

# Exit on error. Append '||true' if you expect an error
set -o errexit

# Use last non-zero exit code in a pipeline
set -o pipefail

# Confirm we have BASH greater than v4
[ "${BASH_VERSINFO:-0}" -ge 4 ] || {
    printf "%s\n" "ERROR: BASH_VERSINFO is '${BASH_VERSINFO:-0}'.  This script requires BASH v4 or greater."
    exit 1
}

# Make `for f in *.txt` work when `*.txt` matches zero files
shopt -s nullglob globstar

# Set IFS to preferred implementation
IFS=$' \n\t'

# Run in debug mode
# set -o xtrace

# Initialize color constants
_setColors_

# Disallow expansion of unset variables
set -o nounset

# Force arguments when invoking the script
[[ $# -eq 0 ]] && _parseOptions_ "-h"

# Parse arguments passed to script
_parseOptions_ "$@"

# Create a temp directory '$TMP_DIR'
_makeTempDir_ "$(basename "$0")"

# Acquire script lock
# _acquireScriptLock_

# Add Homebrew bin directory to PATH (MacOS)
# _homebrewPath_

# Source GNU utilities from Homebrew (MacOS)
# _useGNUutils_

# Run the main logic script
_mainScript_

# Exit cleanly
_safeExit_
