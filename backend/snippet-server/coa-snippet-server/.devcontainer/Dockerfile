FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install basic tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    unzip \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

EXPOSE 8080

# Set up workspace
WORKDIR /workspace
