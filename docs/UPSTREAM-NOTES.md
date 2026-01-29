# Upstream Notes - Moltbot

**Upstream repo:** `moltbot/moltbot`
**Nossa fork:** `alefftech/aleffai`
**Merge base:** `d93f8ffc1` (2026-01-27)

---

## Pendente de Sync (2026-01-29)

### 🔒 Segurança (CRÍTICO)
| Commit | Descrição | PR |
|--------|-----------|-----|
| `06289b36d` | fix(security): harden SSH target handling | #4001 |
| `b71772427` | fix: security hardening for media text attachments | #3700 |

### 📱 Telegram (Importante)
| Commit | Descrição | PR |
|--------|-----------|-----|
| `718bc3f9c` | fix: avoid silent telegram empty replies | #3796 |
| `076165270` | fix(telegram): handle empty reply array in notifyEmptyResponse | - |
| `a2d06e75b` | fix(telegram): notify users when agent returns empty response | - |
| `22b59d24c` | fix(mentions): check mentionPatterns even when explicit mention | - |
| `fcc53bcf1` | fix(telegram): include AccountId for multi-agent routing | #2942 |
| `4ac7aa4a4` | fix(telegram): video_note support | #2905 |

### 🧠 Memory
| Commit | Descrição | PR |
|--------|-----------|-----|
| `0fd9d3abd` | feat(memory): add explicit paths config for memory search | - |

### 🔧 Outros Fixes
| Commit | Descrição | PR |
|--------|-----------|-----|
| `4583f8862` | fix: preserve reasoning tags inside code blocks | #4118 |
| `cb18ce7a8` | fix: text attachment MIME misclassification | #3628 |
| `57efd8e08` | fix(media): add missing MIME type mappings | - |
| `f27a5030d` | fix: restore verbose tool summaries in DM sessions | - |

### 🆕 Features (Opcional)
| Commit | Descrição | PR |
|--------|-----------|-----|
| `78b987664` | feat: add Xiaomi MiMo provider onboarding | #3454 |
| `50d44d0bd` | feat: support xiaomi/mimo-v2-flash | - |

---

## Sync History

### [Pendente] 2026-01-29
- **Commits:** 30+
- **Status:** Aguardando execução
- **Responsável:** Agentman AleffAI
- **Aprovação:** CTO Ronald

---

## Como fazer Sync

```bash
# 1. Fetch upstream
git fetch upstream

# 2. Criar branch de sync
git checkout -b sync/upstream-$(date +%Y-%m-%d)

# 3. Merge
git merge upstream/main

# 4. Resolver conflitos (se houver)
# Geralmente em: app/package.json, app/CHANGELOG.md

# 5. Build e testar
docker compose -f docker-compose.aleffai.yml build
docker compose -f docker-compose.aleffai.yml up -d
docker logs aleffai --tail 100

# 6. Se OK, merge para main
git checkout main
git merge sync/upstream-$(date +%Y-%m-%d)
git push origin main

# 7. Atualizar este arquivo
echo "### [$(date +%Y-%m-%d)]" >> docs/UPSTREAM-NOTES.md
```

---

## Notas

- Sempre revisar commits de segurança ANTES do merge
- Testar Telegram após merge (principal área de mudança)
- Manter lista de conflitos resolvidos para referência futura
