# [STAGE:BASE] Base image with Node.js 22
FROM node:22-bookworm

# [DEPS:BUN] Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# [DEPS:COREPACK] Enable pnpm via corepack
RUN corepack enable

WORKDIR /app

# [DEPS:CUSTOM] Optional custom packages via build arg
ARG CLAWDBOT_DOCKER_APT_PACKAGES=""
RUN if [ -n "$CLAWDBOT_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $CLAWDBOT_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

# [DEPS:SYSTEM] Install system dependencies and skills prerequisites
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
    # [DEPS:GITHUB_CLI] Install GitHub CLI
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# [BUILD:DEPS] Copy dependency manifests from app/
COPY app/package.json app/pnpm-lock.yaml app/pnpm-workspace.yaml app/.npmrc ./
COPY app/ui/package.json ./ui/package.json
COPY app/patches ./patches
COPY app/scripts ./scripts

# [BUILD:INSTALL] Install Node.js dependencies
RUN pnpm install --frozen-lockfile

# [SKILLS:CODE_ANALYSIS] Install code analysis tools
# Note: clawdhub REMOVED due to security concerns (supply chain attacks, no vetting)
# Only @steipete/oracle is installed (safe, maintained by trusted developer)
RUN npm install -g @steipete/oracle

# [SKILLS:PDF] Install Python PDF editing tools
# nano-pdf: Edit PDFs with natural language
RUN python3 -m pip install --break-system-packages nano-pdf

# [SKILLS:BROWSER] Install browser automation tools
# Puppeteer: Headless Chrome for screenshots, PDFs, scraping
# Playwright: Multi-browser automation (Chromium, Firefox, WebKit)
RUN npm install -g puppeteer playwright && \
    npx playwright install --with-deps chromium

# [SKILLS:PRODUCTIVITY] Install productivity CLIs (gated by API keys)
# These skills will be available but only activate when users configure API keys
# Notion: Knowledge management, databases, pages
# Trello: Project management, boards, cards
# Discord: Community communication
# mcporter: MCP servers management (list, call, auth)
RUN npm install -g \
    @iansinnott/notion-cli \
    trello-cli \
    discord-cli \
    mcporter

# [SKILLS:SLACK] Install Slack CLI (official from Slack)
# Downloads Slack CLI for building Slack apps/integrations
RUN curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash

# [SKILLS:SUMMARIZE] Install AI summarization tool
# https://github.com/steipete/summarize
# Summarize URLs, YouTube, podcasts, PDFs using Gemini/GPT
RUN npm install -g @steipete/summarize

# [SKILLS:PYTHON_UV] Install uv (Python package manager)
# Required for local-places skill
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    ln -s /root/.local/bin/uv /usr/local/bin/uv || true

# [SKILLS:OBSIDIAN] Obsidian CLI - manual install only
# NOTE: Obsidian CLI requires Go runtime, skipping automatic install
# Users can install manually if needed: https://github.com/Yakitrak/obsidian-cli

# [SKILLS:GOOGLE] Install gogcli (Google Workspace integration)
# https://github.com/steipete/gogcli
# Provides: Gmail, Calendar, Drive, Contacts APIs
RUN curl -sL https://github.com/steipete/gogcli/releases/download/v0.9.0/gogcli_0.9.0_linux_amd64.tar.gz | tar xz -C /usr/local/bin/ && \
    chmod +x /usr/local/bin/gog

# [BUILD:SOURCE] Copy application source code from app/
COPY app/ .

# [BUILD:COMPILE] Build TypeScript and bundle UI
RUN CLAWDBOT_A2UI_SKIP_MISSING=1 pnpm build

# [BUILD:UI] Build web UI (force pnpm for ARM/Synology compatibility)
ENV CLAWDBOT_PREFER_PNPM=1
RUN pnpm ui:install
RUN pnpm ui:build

# [CONFIG:ENV] Set production environment
ENV NODE_ENV=production

# [SECURITY:USER] Run as non-root user with sudo privileges
USER node

# [RUNTIME:CMD] Start application
CMD ["node", "dist/index.js"]
