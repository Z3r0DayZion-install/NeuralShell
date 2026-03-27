Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.hostname = "neuralshell-audit"

  # Keep the source snapshot immutable in the guest.
  config.vm.synced_folder ".", "/vagrant", mount_options: ["ro"]

  config.vm.provider "virtualbox" do |vb|
    vb.name = "neuralshell-audit"
    vb.memory = 4096
    vb.cpus = 2
  end

  config.vm.provision "shell", inline: <<-SHELL
    set -euo pipefail
    sudo apt-get update
    sudo apt-get install -y curl unzip git jq ca-certificates

    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi

    sudo mkdir -p /opt/neuralshell-audit/proof
    sudo mkdir -p /opt/neuralshell-audit/sample-repo

    if [ -f /vagrant/release/ui-self-sell-proof-report-packaged.json ]; then
      sudo cp /vagrant/release/ui-self-sell-proof-report-packaged.json /opt/neuralshell-audit/proof/
    fi
    if [ -f /vagrant/release/ui-self-sell-proof-parity.json ]; then
      sudo cp /vagrant/release/ui-self-sell-proof-parity.json /opt/neuralshell-audit/proof/
    fi
    if [ -d /vagrant/screenshots ]; then
      sudo cp -r /vagrant/screenshots /opt/neuralshell-audit/proof/screenshots
    fi

    cat <<'EOF' | sudo tee /opt/neuralshell-audit/README.txt >/dev/null
NeuralShell immutable audit VM

- Proof artifacts: /opt/neuralshell-audit/proof
- Source snapshot (read-only): /vagrant
- Recommended first command:
  cd /vagrant && npm run proof:bundle
EOF
  SHELL
end
