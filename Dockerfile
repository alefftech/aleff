FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG CLAWDBOT_DOCKER_APT_PACKAGES=""
RUN if [ -n "$CLAWDBOT_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $CLAWDBOT_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

# Install sudo, gh CLI, and skills dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      sudo \
      curl \
      git \
      tmux \
      jq \
      ripgrep \
      python3 \
      python3-pip \
      python3-venv \
      ffmpeg \
      wkhtmltopdf \
      xvfb \
      poppler-utils && \
    echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    # Install GitHub CLI
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

# Install NPM skills CLIs globally (using npm instead of pnpm for global installs)
# Note: clawdhub REMOVED due to security concerns (supply chain attacks, no vetting)
# Only @steipete/oracle is installed (safe, maintained by trusted developer)
RUN npm install -g @steipete/oracle

# Install Python skills dependencies
# nano-pdf: Edit PDFs with natural language
RUN python3 -m pip install --break-system-packages nano-pdf

# Install browser automation tools
# Puppeteer: Headless Chrome for screenshots, PDFs, scraping
# Playwright: Multi-browser automation (Chromium, Firefox, WebKit)
RUN npm install -g puppeteer playwright && \
    npx playwright install --with-deps chromium

# Install productivity tools CLIs
# These skills will be available but only activate when users configure API keys
# Notion: Knowledge management, databases, pages
# Trello: Project management, boards, cards
# Slack: Team communication (official CLI)
# Discord: Community communication
# mcporter: MCP servers management (list, call, auth)
RUN npm install -g \
    @iansinnott/notion-cli \
    trello-cli \
    discord-cli \
    mcporter

# Install Slack CLI (official from Slack)
# Downloads Slack CLI for building Slack apps/integrations
RUN curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash

# Install summarize CLI (for URL/YouTube/PDF summarization)
# https://github.com/steipete/summarize
RUN npm install -g @steipete/summarize

# Install uv (Python package manager, needed for local-places skill)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    ln -s /root/.local/bin/uv /usr/local/bin/uv || true

# Install Obsidian CLI (Go-based, more complex - document manual install)
# NOTE: Obsidian CLI requires Go runtime, skipping automatic install
# Users can install manually if needed: https://github.com/Yakitrak/obsidian-cli

# Install gogcli (Google Suite CLI: Gmail, Calendar, Drive, Contacts)
# https://github.com/steipete/gogcli
RUN curl -sL https://github.com/steipete/gogcli/releases/download/v0.9.0/gogcli_0.9.0_linux_amd64.tar.gz | tar xz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/gog

COPY . .
RUN CLAWDBOT_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV CLAWDBOT_PREFER_PNPM=1
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

# Run as non-root user with sudo privileges
USER node

CMD ["node", "dist/index.js"]
