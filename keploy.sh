#!/bin/bash

installKeploy (){
    IS_CI=false
    for arg in "$@"
    do
        case $arg in
            -isCI)
                IS_CI=true
                shift
            ;;
            *)
            ;;
        esac
    done

    install_keploy_arm() {
        curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_arm64.tar.gz" | tar xz -C /tmp

        sudo mkdir -p /usr/local/bin && sudo mv /tmp/keploy /usr/local/bin/keploybin

        set_alias 'sudo -E env PATH="$PATH" keploybin'

        check_docker_status_for_linux
        dockerStatus=$?
        if [ "$dockerStatus" -eq 0 ]; then
            return
        fi
        add_network
    }

    check_sudo(){
        if groups | grep -q '\bdocker\b'; then
            return 1
        else
            return 0
        fi
    }

    install_keploy_amd() {
        curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64.tar.gz" | tar xz -C /tmp

        sudo mkdir -p /usr/local/bin && sudo mv /tmp/keploy /usr/local/bin/keploybin

        set_alias 'sudo -E env PATH="$PATH" keploybin'

        check_docker_status_for_linux
        dockerStatus=$?
        if [ "$dockerStatus" -eq 0 ]; then
            return
        fi
        add_network
    }

    append_to_rc() {
        last_byte=$(tail -c 1 $2)
        if [[ "$last_byte" != "" ]]; then
            echo -e "\n$1" >> $2
        else
            echo "$1" >> $2
        fi
        source $2
    }

    # Get the alias to set and set it
    set_alias() {
        # Check if the command is for docker or not
        if [[ "$1" == *"docker"* ]]; then
            # Check if the user is a member of the docker group
            check_sudo
            sudoCheck=$?
            if [ "$sudoCheck" -eq 0 ] && [ $OS_NAME = "Linux" ]; then
                # Add sudo to the alias.
                ALIAS_CMD="alias keploy='sudo $1'"
            else
                ALIAS_CMD="alias keploy='$1'"
            fi
        else
            ALIAS_CMD="alias keploy='$1'"
        fi
        current_shell="$(basename "$SHELL")"
        if [[ "$current_shell" = "zsh" || "$current_shell" = "-zsh" ]]; then
            if [ -f ~/.zshrc ]; then
                if grep -q "alias keploy=" ~/.zshrc; then
                    if [ "$OS_NAME" = "Darwin" ]; then
                        sed -i '' '/alias keploy/d' ~/.zshrc
                    else
                        sed -i '/alias keploy/d' ~/.zshrc
                    fi
                fi
                append_to_rc "$ALIAS_CMD" ~/.zshrc
            else
                alias keploy="$1"
            fi
        elif [[ "$current_shell" = "bash" || "$current_shell" = "-bash" ]]; then
            if [ -f ~/.bashrc ]; then
                if grep -q "alias keploy=" ~/.bashrc; then
                    if [ "$OS_NAME" = "Darwin" ]; then
                        sed -i '' '/alias keploy/d' ~/.bashrc
                    else
                        sed -i '/alias keploy/d' ~/.bashrc
                    fi
                fi
                append_to_rc "$ALIAS_CMD" ~/.bashrc
            else
                alias keploy="$1"
            fi
        else
            alias keploy="$1"
        fi
    }

    check_docker_status_for_linux() {
        check_sudo
        sudoCheck=$?
        network_alias=""
        if [ "$sudoCheck" -eq 0 ]; then
            # Add sudo to docker
            network_alias="sudo"
        fi
        if ! $network_alias which docker &> /dev/null; then
            echo -n "Docker not found on device, please install docker and reinstall keploy if you have applications running on docker"
            return 0
        fi
        if ! $network_alias docker info &> /dev/null; then
            echo "Please start Docker and reinstall keploy if you have applications running on docker"
            return 0
        fi
        return 1
    }

     check_docker_status_for_Darwin() {
        check_sudo
        sudoCheck=$?
        network_alias=""
        if [ "$sudoCheck" -eq 0 ]; then
            # Add sudo to docker
            network_alias="sudo"
        fi
        if ! $network_alias which docker &> /dev/null; then
            echo -n "Docker not found on device, please install docker to use Keploy"
            return 0
        fi
        # Check if docker is running
        if ! $network_alias docker info &> /dev/null; then
            echo "Keploy only supports intercepting and replaying docker containers on macOS, and requires Docker to be installed and running. Please start Docker and try again."
            return 0
        fi
        return 1
    }

    add_network() {
        if ! $network_alias docker network ls | grep -q 'keploy-network'; then
            $network_alias docker network create keploy-network
        fi
    }

    install_docker() {
        if [ "$OS_NAME" = "Darwin" ]; then
            check_docker_status_for_Darwin
            dockerStatus=$?
            if [ "$dockerStatus" -eq 0 ]; then
                return
            fi
            add_network
            if ! docker volume inspect debugfs &>/dev/null; then
                docker volume create --driver local --opt type=debugfs --opt device=debugfs debugfs
            fi
            set_alias 'docker run --pull always --name keploy-v2 -p 16789:16789 --privileged --pid=host -it -v $(pwd):$(pwd) -w $(pwd) -v /sys/fs/cgroup:/sys/fs/cgroup -v debugfs:/sys/kernel/debug:rw -v /sys/fs/bpf:/sys/fs/bpf -v /var/run/docker.sock:/var/run/docker.sock -v '"$HOME"'/.keploy:/root/.keploy --rm ghcr.io/keploy/keploy'
        else
            set_alias 'docker run --pull always --name keploy-v2 -p 16789:16789 --privileged --pid=host -it -v $(pwd):$(pwd) -w $(pwd) -v /sys/fs/cgroup:/sys/fs/cgroup -v /sys/kernel/debug:/sys/kernel/debug -v /sys/fs/bpf:/sys/fs/bpf -v /var/run/docker.sock:/var/run/docker.sock -v '"$HOME"'/.keploy:/root/.keploy --rm ghcr.io/keploy/keploy'
        fi
}


    ARCH=$(uname -m)

    if [ "$IS_CI" = false ]; then
        OS_NAME="$(uname -s)"
        if [ "$OS_NAME" = "Darwin" ]; then
            install_docker
            return
        elif [ "$OS_NAME" = "Linux" ]; then
            if ! sudo mountpoint -q /sys/kernel/debug; then
                sudo mount -t debugfs debugfs /sys/kernel/debug
            fi
            if [ "$ARCH" = "x86_64" ]; then
                install_keploy_amd
            elif [ "$ARCH" = "aarch64" ]; then
                install_keploy_arm
            else
                echo "Unsupported architecture: $ARCH"
                return
            fi
        elif [[ "$OS_NAME" == MINGW32_NT* ]]; then
            echo "\e]8;; https://pureinfotech.com/install-windows-subsystem-linux-2-windows-10\aWindows not supported please run on WSL2\e]8;;\a"
        elif [[ "$OS_NAME" == MINGW64_NT* ]]; then
            echo "\e]8;; https://pureinfotech.com/install-windows-subsystem-linux-2-windows-10\aWindows not supported please run on WSL2\e]8;;\a"
        else
            echo "Unknown OS, install Linux to run Keploy"
        fi
    else
        if [ "$ARCH" = "x86_64" ]; then
            install_keploy_amd
        elif [ "$ARCH" = "aarch64" ]; then
            install_keploy_arm
        else
            echo "Unsupported architecture: $ARCH"
            return
        fi
    fi
}

installKeploy

if command -v keploy &> /dev/null; then
    keploy example
    rm keploy.sh
fi