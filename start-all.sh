#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
AUDIO_DIR="$ROOT_DIR/audio-service"

PIDS=()
LOG_DIR="$ROOT_DIR/.runlogs"
mkdir -p "$LOG_DIR"

LOG_AUDIO="$LOG_DIR/audio.log"
LOG_BACKEND="$LOG_DIR/backend.log"
LOG_FRONTEND="$LOG_DIR/frontend.log"

AUDIO_PID=""
BACKEND_PID=""
FRONTEND_PID=""
INSTALL_DEPS=1
DRY_RUN=0
HEALTH_CHECK=1

AUDIO_PORT=8000
BACKEND_PORT=4000
FRONTEND_PORT=5287
BACKEND_HEALTH_TIMEOUT=90
FRONTEND_HEALTH_TIMEOUT=90
NPM_RUNNER="native"
CLEANED_UP=0

USE_COLOR=0
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
  USE_COLOR=1
fi

CLR_RESET=""
CLR_DIM=""
CLR_BLUE=""
CLR_CYAN=""
CLR_GREEN=""
CLR_YELLOW=""
CLR_RED=""
CLR_MAGENTA=""

if [[ "$USE_COLOR" -eq 1 ]]; then
  CLR_RESET=$'\033[0m'
  CLR_DIM=$'\033[2m'
  CLR_BLUE=$'\033[34m'
  CLR_CYAN=$'\033[36m'
  CLR_GREEN=$'\033[32m'
  CLR_YELLOW=$'\033[33m'
  CLR_RED=$'\033[31m'
  CLR_MAGENTA=$'\033[35m'
fi

log() {
  local msg="$*"
  local level="INFO"
  local color="$CLR_CYAN"

  if [[ "$msg" == ERROR:* ]]; then
    level="ERROR"
    color="$CLR_RED"
  elif [[ "$msg" == WARNING:* ]]; then
    level="WARN"
    color="$CLR_YELLOW"
  elif [[ "$msg" == *"is ready at"* || "$msg" == "All modules launched."* ]]; then
    level="OK"
    color="$CLR_GREEN"
  elif [[ "$msg" == "Starting "* || "$msg" == "Booting "* ]]; then
    level="STEP"
    color="$CLR_BLUE"
  elif [[ "$msg" == "Using PowerShell fallback"* ]]; then
    level="INFO"
    color="$CLR_MAGENTA"
  fi

  if [[ "$USE_COLOR" -eq 1 ]]; then
    printf "%s[%s]%s %s[%5s]%s %s\n" "$CLR_DIM" "$(date +"%H:%M:%S")" "$CLR_RESET" "$color" "$level" "$CLR_RESET" "$msg"
  else
    printf "[%s] [%5s] %s\n" "$(date +"%H:%M:%S")" "$level" "$msg"
  fi
}

log_section() {
  local title="$1"
  if [[ "$USE_COLOR" -eq 1 ]]; then
    printf "%s\n" "${CLR_DIM}------------------------------------------------------------${CLR_RESET}"
    printf "%s\n" "${CLR_BLUE}${title}${CLR_RESET}"
    printf "%s\n" "${CLR_DIM}------------------------------------------------------------${CLR_RESET}"
  else
    printf -- "------------------------------------------------------------\n"
    printf "%s\n" "$title"
    printf -- "------------------------------------------------------------\n"
  fi
}

usage() {
  cat <<EOF
Usage: ./start-all.sh [options]

Options:
  --no-install         Skip npm/pip install steps
  --dry-run            Print what would run, then exit
  --skip-health-check  Skip HTTP readiness checks
  -h, --help           Show this help
EOF
}

for arg in "$@"; do
  case "$arg" in
    --no-install)
      INSTALL_DEPS=0
      ;;
    --dry-run)
      DRY_RUN=1
      ;;
    --skip-health-check)
      HEALTH_CHECK=0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log "ERROR: Unknown option '$arg'"
      usage
      exit 1
      ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: Missing command '$1'. $2"
    exit 1
  fi
}

ensure_node_modules() {
  local dir="$1"
  local label="$2"
  if [[ "$INSTALL_DEPS" -eq 0 ]]; then
    return
  fi

  if [[ ! -d "$dir/node_modules" ]]; then
    log "$label dependencies missing. Running npm install..."
    npm_install_in_dir "$dir"
  fi
}

to_windows_path() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$path"
  elif [[ "$path" =~ ^/mnt/([a-zA-Z])/(.*)$ ]]; then
    local drive="${BASH_REMATCH[1]}"
    local rest="${BASH_REMATCH[2]}"
    rest="${rest//\//\\}"
    printf "%s:\\%s\n" "${drive^^}" "$rest"
  else
    echo "$path"
  fi
}

configure_npm_runner() {
  if command -v npm >/dev/null 2>&1 && command -v node >/dev/null 2>&1; then
    NPM_RUNNER="native"
    return
  fi

  if command -v powershell.exe >/dev/null 2>&1; then
    if powershell.exe -NoProfile -Command "if (Get-Command node -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >/dev/null 2>&1; then
      NPM_RUNNER="powershell"
      log "Using PowerShell fallback for npm/node commands."
      return
    fi
  fi

  log "ERROR: Node.js runtime is not available in this shell. Install Node or add it to PATH."
  exit 1
}

npm_install_in_dir() {
  local dir="$1"
  if [[ "$NPM_RUNNER" == "native" ]]; then
    (cd "$dir" && npm install)
    return
  fi

  local win_dir
  win_dir="$(to_windows_path "$dir")"
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '$win_dir'; npm install"
}

build_npm_dev_cmd() {
  local dir="$1"
  local extra_args="$2"

  if [[ "$NPM_RUNNER" == "native" ]]; then
    if [[ -n "$extra_args" ]]; then
      echo "npm run dev -- $extra_args"
    else
      echo "npm run dev"
    fi
    return
  fi

  local win_dir
  win_dir="$(to_windows_path "$dir")"
  if [[ -n "$extra_args" ]]; then
    echo "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"Set-Location -LiteralPath '$win_dir'; npm run dev -- $extra_args\""
  else
    echo "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"Set-Location -LiteralPath '$win_dir'; npm run dev\""
  fi
}

detect_python() {
  if [[ -x "$ROOT_DIR/.venv/Scripts/python.exe" ]]; then
    echo "$ROOT_DIR/.venv/Scripts/python.exe"
    return
  fi
  if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
    echo "$ROOT_DIR/.venv/bin/python"
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return
  fi
  if command -v python >/dev/null 2>&1; then
    command -v python
    return
  fi

  log "ERROR: No Python interpreter found. Create .venv or install Python."
  exit 1
}

cleanup() {
  if [[ "$CLEANED_UP" -eq 1 ]]; then
    return
  fi
  CLEANED_UP=1

  log "Stopping all modules..."
  
  # Kill PIDs we tracked directly
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done

  # On Windows, direct PID killing often misses children started via PowerShell/NPM.
  # We force-kill anything still listening on our project ports.
  kill_port_listener_windows "$AUDIO_PORT"
  kill_port_listener_windows "$BACKEND_PORT"
  kill_port_listener_windows "$FRONTEND_PORT"

  wait || true
  log "All modules stopped."
}

start_service() {
  local name="$1"
  local dir="$2"
  local cmd="$3"
  local logfile="$4"

  : > "$logfile"
  log "Starting $name..."
  (
    cd "$dir"
    exec bash -lc "$cmd"
  ) >> "$logfile" 2>&1 &
  local pid=$!
  PIDS+=("$pid")

  case "$name" in
    "Audio Service") AUDIO_PID="$pid" ;;
    "Backend") BACKEND_PID="$pid" ;;
    "Frontend") FRONTEND_PID="$pid" ;;
  esac

  log "$name started (pid=$pid, log=$logfile)"
}

is_pid_alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

service_pid() {
  local name="$1"
  case "$name" in
    "Audio Service") echo "$AUDIO_PID" ;;
    "Backend API"|"Backend") echo "$BACKEND_PID" ;;
    "Frontend UI"|"Frontend") echo "$FRONTEND_PID" ;;
    *) echo "" ;;
  esac
}

service_log() {
  local name="$1"
  case "$name" in
    "Audio Service") echo "$LOG_AUDIO" ;;
    "Backend API"|"Backend") echo "$LOG_BACKEND" ;;
    "Frontend UI"|"Frontend") echo "$LOG_FRONTEND" ;;
    *) echo "" ;;
  esac
}

kill_port_listener_windows() {
  local port="$1"
  if ! command -v powershell.exe >/dev/null 2>&1; then
    return 1
  fi

  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "
    \$port = \$args[0]
    \$conns = Get-NetTCPConnection -LocalPort \$port -State Listen -ErrorAction SilentlyContinue
    if (-not \$conns) { exit 0 }
    \$pids = \$conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach (\$pid in \$pids) {
      \$proc = Get-CimInstance Win32_Process -Filter \"ProcessId=\$pid\" -ErrorAction SilentlyContinue
      if (\$null -eq \$proc) { continue }
      \$cmd = \$proc.CommandLine
      if (\$cmd -match 'kavach|hackbaroda|node|python|npm|vite') {
        Stop-Process -Id \$pid -Force -ErrorAction SilentlyContinue
        Write-Host \"killed:\$pid\"
      }
    }
  " "$port" >/dev/null 2>&1
}

ensure_port_free() {
  local port="$1"
  local label="$2"

  log "Validating port $port ($label)..."
  if kill_port_listener_windows "$port"; then
    sleep 1
  fi

  if ! "$PYTHON_BIN" - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(("127.0.0.1", port))
    s.close()
    sys.exit(0)
except OSError:
    sys.exit(1)
PY
  then
    log "WARNING: Port $port was still busy after cleanup; $label may still fail."
  fi
}

print_log_tail() {
  local name="$1"
  local logfile
  logfile="$(service_log "$name")"
  if [[ -n "$logfile" && -f "$logfile" ]]; then
    log "Last log lines for $name ($logfile):"
    tail -n 40 "$logfile" || true
  fi
}

assert_port_free() {
  local port="$1"
  local label="$2"

  if ! "$PYTHON_BIN" - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(("127.0.0.1", port))
    s.close()
    sys.exit(0)
except OSError:
    sys.exit(1)
PY
  then
    log "ERROR: Port $port already in use ($label). Stop the conflicting process and retry."
    exit 1
  fi
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local timeout_secs="$3"
  local pid
  pid="$(service_pid "$name")"
  local start_ts
  start_ts="$(date +%s)"

  while true; do
    if [[ -n "$pid" ]] && ! is_pid_alive "$pid"; then
      log "ERROR: $name process exited before becoming ready."
      print_log_tail "$name"
      exit 1
    fi

    if "$PYTHON_BIN" - "$url" <<'PY'
import sys
import urllib.request

url = sys.argv[1]
try:
    with urllib.request.urlopen(url, timeout=2) as r:
        ok = 200 <= r.status < 500
        sys.exit(0 if ok else 1)
except Exception:
    sys.exit(1)
PY
    then
      log "$name is ready at $url"
      return
    fi

    local now_ts
    now_ts="$(date +%s)"
    if (( now_ts - start_ts >= timeout_secs )); then
      log "ERROR: $name did not become ready within ${timeout_secs}s ($url)"
      print_log_tail "$name"
      exit 1
    fi
    sleep 1
  done
}

monitor_children() {
  while true; do
    for pid in "${PIDS[@]:-}"; do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        local code=1
        wait "$pid" || code=$?
        log "A service exited unexpectedly (pid=$pid, code=$code)."
        if [[ "$pid" == "$AUDIO_PID" ]]; then
          print_log_tail "Audio Service"
        elif [[ "$pid" == "$BACKEND_PID" ]]; then
          print_log_tail "Backend"
        elif [[ "$pid" == "$FRONTEND_PID" ]]; then
          print_log_tail "Frontend"
        fi
        return "$code"
      fi
    done
    sleep 1
  done
}

trap cleanup INT TERM EXIT

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" || ! -d "$AUDIO_DIR" ]]; then
  log "ERROR: Expected backend, frontend, and audio-service directories in project root."
  exit 1
fi

require_cmd npm "Install Node.js first."
PYTHON_BIN="$(detect_python)"
configure_npm_runner

ensure_port_free "$AUDIO_PORT" "Audio Service"
ensure_port_free "$BACKEND_PORT" "Backend"
ensure_port_free "$FRONTEND_PORT" "Frontend UI"

if [[ ! -f "$BACKEND_DIR/.env" && -f "$BACKEND_DIR/.env.example" ]]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  log "Created backend/.env from .env.example"
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "Dry run complete. Prerequisites and ports validated; nothing started."
  exit 0
fi

ensure_node_modules "$BACKEND_DIR" "Backend"
ensure_node_modules "$FRONTEND_DIR" "Frontend"

if [[ "$INSTALL_DEPS" -eq 1 ]]; then
  log "Ensuring Python dependencies..."
  (cd "$AUDIO_DIR" && "$PYTHON_BIN" -m pip install -r requirements.txt)
fi

log_section "KAVACH STACK BOOT"
log "Booting KAVACH stack"
log "Audio:    http://localhost:$AUDIO_PORT"
log "Backend:  http://localhost:$BACKEND_PORT"
log "Frontend: http://localhost:$FRONTEND_PORT"

BACKEND_CMD="$(build_npm_dev_cmd "$BACKEND_DIR" "")"
FRONTEND_CMD="$(build_npm_dev_cmd "$FRONTEND_DIR" "")"

start_service "Audio Service" "$AUDIO_DIR" "'$PYTHON_BIN' main.py" "$LOG_AUDIO"
start_service "Backend" "$BACKEND_DIR" "$BACKEND_CMD" "$LOG_BACKEND"
start_service "Frontend" "$FRONTEND_DIR" "$FRONTEND_CMD" "$LOG_FRONTEND"

if [[ "$HEALTH_CHECK" -eq 1 ]]; then
  wait_for_http "Audio Service" "http://localhost:$AUDIO_PORT/health" 45
  wait_for_http "Backend API" "http://localhost:$BACKEND_PORT/api/health" "$BACKEND_HEALTH_TIMEOUT"
  wait_for_http "Frontend UI" "http://localhost:$FRONTEND_PORT" "$FRONTEND_HEALTH_TIMEOUT"
fi

log "All modules launched. Press Ctrl+C to stop everything."
monitor_children
