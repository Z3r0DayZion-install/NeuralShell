#!/usr/bin/env bash
set -euo pipefail

PKG_PATH="${1:-}"
INSTALL_ROOT="${2:-/Applications}"
LOG_FILE="${3:-/tmp/neuralshell_pkg_install.log}"

if [[ -z "${PKG_PATH}" ]]; then
  echo "Usage: ./install_silent.sh <NeuralShell.pkg> [install_root] [log_file]"
  exit 2
fi

if [[ ! -f "${PKG_PATH}" ]]; then
  echo "PKG not found: ${PKG_PATH}"
  exit 2
fi

TMP_CONF_DIR="/tmp/neuralshell-enterprise-defaults"
mkdir -p "${TMP_CONF_DIR}"
cat > "${TMP_CONF_DIR}/NeuralShell.runtime.env" <<EOF
LICENSE_MODE=auditor
NEURAL_ALLOW_REMOTE_BRIDGE=0
NEURAL_PROOF_RELAY_ENABLED=0
NEURAL_AUTO_UPDATE_ENABLED=0
NEURAL_OTEL_EXPORT_ENABLED=0
EOF

echo "Installing NeuralShell silently..."
/usr/sbin/installer -pkg "${PKG_PATH}" -target "/" | tee "${LOG_FILE}"

APP_ENV_PATH="${INSTALL_ROOT}/NeuralShell.app/Contents/MacOS/NeuralShell.runtime.env"
if [[ -d "${INSTALL_ROOT}/NeuralShell.app/Contents/MacOS" ]]; then
  cp "${TMP_CONF_DIR}/NeuralShell.runtime.env" "${APP_ENV_PATH}"
fi

echo "NeuralShell installed."
echo "Installer log: ${LOG_FILE}"
echo "Runtime defaults: ${APP_ENV_PATH}"
