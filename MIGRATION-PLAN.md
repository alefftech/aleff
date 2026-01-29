# PLANO: Reestruturação aleffai/ + app/

**Data:** 2026-01-29
**Owner:** CTO Ronald
**Status:** Em execução

---

## OBJETIVO

Reestruturar o repo para separação clara:
- `aleffai/` = INFRA (gerencia container)
- `aleffai/app/` = CÓDIGO (roda dentro do container)

**Benefício:** Fácil replicar para criar outros containers (outros agentes).

---

## ESTRUTURA FINAL

```
aleffai/                              ← Raiz (INFRA)
├── CLAUDE.md                         ← Instruções para cuidador do container
├── docker-compose.yml                ← Orquestra containers
├── docker-compose.aleff.yml          ← Variante com Traefik
├── Dockerfile                        ← Build da imagem
├── init-db.sql                       ← Schema PostgreSQL
├── .env.example                      ← Template de variáveis
├── README.md                         ← Como deployar
├── run-aleffai.sh                    ← Script de deploy
│
└── app/                              ← Código (APLICAÇÃO)
    ├── src/                          ← Moltbot core
    ├── extensions/                   ← Plugins (aleff-memory, etc)
    ├── packages/                     ← Pacotes internos
    ├── skills/                       ← Skills do agent
    ├── workspace/                    ← Runtime instructions
    ├── package.json
    ├── pnpm-lock.yaml
    ├── tsconfig.json
    └── ...                           ← Resto do código
```

---

## ARQUIVOS QUE FICAM NA RAIZ (não vão para app/)

```
# INFRA
docker-compose.yml
docker-compose.aleff.yml
Dockerfile
Dockerfile.sandbox
Dockerfile.sandbox-browser
.dockerignore
docker-setup.sh
run-aleffai.sh
init-db.sql

# CONFIG
.env
.env.example
.gitignore
.gitattributes

# DOCS DE INFRA
CLAUDE.md                  ← Será reescrito (cuidador)
README.md                  ← Será atualizado (deploy)
DEPLOYMENT.md
MIGRATION-PLAN.md

# GIT
.git/
.github/

# MISC
LICENSE
SECURITY.md
```

---

## ARQUIVOS QUE VÃO PARA app/

```
# CÓDIGO
src/
extensions/
packages/
skills/
workspace/
vendor/
test/
migrations/
scripts/
agent/
apps/
ui/
Swabble/
gogcli/
vpn/
data/

# CONFIG DE CÓDIGO
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.json
vitest*.config.ts
.npmrc
.shellcheckrc
.swiftformat
.swiftlint.yml
.oxfmtrc.jsonc
.oxlintrc.json
.pre-commit-config.yaml
.prettierignore
.detect-secrets.cfg
.secrets.baseline
zizmor.yml
moltbot.mjs

# DOCS DE CÓDIGO
AGENTS.md
CHANGELOG.md
CODE-PROTOCOL.md
CONTRIBUTING.md
DOCS_INDEX.md
docs/
docs.acp.md

# ASSETS
assets/
README-header.png
appcast.xml

# DEPLOY CONFIGS (código)
fly.toml
fly.private.toml
render.yaml
git-hooks/
```

---

## FASES DE EXECUÇÃO

### FASE 1: Criar estrutura app/ ✓
```bash
mkdir -p app
```

### FASE 2: Mover arquivos para app/
```bash
# Código principal
git mv src app/
git mv extensions app/
git mv packages app/
git mv skills app/
git mv workspace app/
git mv test app/
git mv scripts app/

# Código auxiliar
git mv vendor app/
git mv migrations app/
git mv agent app/
git mv apps app/
git mv ui app/
git mv Swabble app/
git mv gogcli app/
git mv vpn app/
git mv data app/

# Config de código
git mv package.json app/
git mv pnpm-lock.yaml app/
git mv pnpm-workspace.yaml app/
git mv tsconfig.json app/
git mv vitest*.config.ts app/
git mv moltbot.mjs app/
git mv .npmrc app/
git mv .shellcheckrc app/
git mv .swiftformat app/
git mv .swiftlint.yml app/
git mv .oxfmtrc.jsonc app/
git mv .oxlintrc.json app/
git mv .pre-commit-config.yaml app/
git mv .prettierignore app/
git mv .detect-secrets.cfg app/
git mv .secrets.baseline app/
git mv zizmor.yml app/

# Docs de código
git mv AGENTS.md app/
git mv CHANGELOG.md app/
git mv CODE-PROTOCOL.md app/
git mv CONTRIBUTING.md app/
git mv DOCS_INDEX.md app/
git mv docs app/
git mv docs.acp.md app/

# Assets
git mv assets app/
git mv README-header.png app/
git mv appcast.xml app/

# Deploy configs de código
git mv fly.toml app/
git mv fly.private.toml app/
git mv render.yaml app/
git mv git-hooks app/
```

### FASE 3: Atualizar Dockerfile
```dockerfile
# ANTES
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# DEPOIS
WORKDIR /app
COPY app/package.json app/pnpm-lock.yaml ./
# OU
COPY app/ ./
```

### FASE 4: Atualizar docker-compose.yml
```yaml
# ANTES
volumes:
  - .:/app

# DEPOIS
volumes:
  - ./app:/app
```

### FASE 5: Atualizar run-aleffai.sh
```bash
# Paths relativos ao app/
```

### FASE 6: Criar CLAUDE.md (cuidador)
```markdown
# AleffAI Container Manager

## Quem Sou
Sou o cuidador do container AleffAI...

## Responsabilidades
- Build e deploy do container
- Monitoramento de saúde
- Troubleshooting
...
```

### FASE 7: Atualizar README.md
```markdown
# AleffAI

## Quick Start
1. Clone: git clone ...
2. Config: cp .env.example .env
3. Deploy: docker-compose up -d
...
```

### FASE 8: Validação
```bash
# Build
docker build -t aleffai:test .

# Run
docker-compose up -d

# Verificar
docker logs aleffai
docker exec aleffai ls -la /app
```

---

## ARQUIVOS A ATUALIZAR APÓS MOVE

| Arquivo | O que mudar |
|---------|-------------|
| `Dockerfile` | COPY paths, WORKDIR |
| `docker-compose.yml` | volume mounts |
| `docker-compose.aleff.yml` | volume mounts |
| `run-aleffai.sh` | paths |
| `.dockerignore` | paths |
| `.gitignore` | paths se necessário |
| `README.md` | instruções de deploy |
| `CLAUDE.md` | reescrever para cuidador |

---

## ROLLBACK

Se algo quebrar:
```bash
git reset --hard HEAD~1
```

---

## CHECKLIST

- [x] Remote atualizado para alefftech/aleffai
- [x] Estado atual commitado e pushado
- [ ] Criar diretório app/
- [ ] Mover arquivos com git mv
- [ ] Atualizar Dockerfile
- [ ] Atualizar docker-compose.yml
- [ ] Atualizar docker-compose.aleff.yml
- [ ] Atualizar run-aleffai.sh
- [ ] Criar CLAUDE.md (cuidador)
- [ ] Atualizar README.md
- [ ] Build e teste
- [ ] Commit e push
- [ ] Atualizar diretório local (renomear aleff → aleffai)

---

**Aprovação:** CTO Ronald
**Próximo passo:** Executar FASE 1-2 (criar app/ e mover arquivos)
