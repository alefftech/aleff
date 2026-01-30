# Aleff Supervisor Plugin

Cross-channel supervisor for AleffAI - control WhatsApp, Instagram, and other channels from Telegram.

## Features

- **Channel State Management**: Control channels with RUNNING, STOPPED, and TAKEOVER states
- **Message Interception**: Block bot responses when channels are paused or in takeover mode
- **Supervisor Notifications**: Get notified of incoming messages from all child channels
- **5 Control Tools**: Full control over channel behavior

## Architecture

```
                ALEFF (Supervisor - Telegram)
                ────────────────────────────
                /status    → List channels
                /start     → Activate channel
                /stop      → Pause channel
                /takeover  → Manual control
                /release   → Return to bot
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │whatsapp │        │instagram│        │  site   │
   │ RUNNING │        │ STOPPED │        │ RUNNING │
   └─────────┘        └─────────┘        └─────────┘
```

## Channel States

| State | Bot Responds | Supervisor Notified |
|-------|--------------|---------------------|
| `RUNNING` | Yes | Yes |
| `STOPPED` | No | Yes |
| `TAKEOVER` | No | Yes (for manual response) |

## Commands

### `/status`
Lists all channels and their current states.

```
[ON]  whatsapp: RUNNING
      Updated: 30/01/2026, 14:30:00 por system

[OFF] instagram: STOPPED
      Updated: 30/01/2026, 14:25:00 por supervisor
```

### `/start <channel>`
Activates a channel for automatic bot responses.

```
/start whatsapp
→ [OK] Canal whatsapp ativado. Bot respondendo automaticamente.
```

### `/stop <channel>`
Pauses a channel - bot won't respond but you get notifications.

```
/stop whatsapp
→ [PAUSE] Canal whatsapp pausado. Notificacoes continuam, bot nao responde.
```

### `/takeover <channel>`
Takes manual control of a channel. You'll respond to all messages.

```
/takeover whatsapp
→ [MANUAL] Voce assumiu o controle de whatsapp. Respostas redirecionadas para voce.
```

### `/release <channel>`
Returns control to the bot.

```
/release whatsapp
→ [BOT] Controle de whatsapp devolvido ao bot.
```

## Configuration

### Environment Variables

```bash
# Telegram user ID authorized to use supervisor commands
SUPERVISOR_TELEGRAM_ID=7899995102
```

### Plugin Config

```json
{
  "aleff-supervisor": {
    "supervisorTelegramId": "7899995102",
    "defaultChannels": ["whatsapp", "telegram", "instagram"]
  }
}
```

## Installation

1. The plugin is automatically loaded by Moltbot from `app/extensions/aleff-supervisor/`

2. Add environment variable to `.env`:
   ```bash
   SUPERVISOR_TELEGRAM_ID=your_telegram_user_id
   ```

3. Add to `docker-compose.aleffai.yml`:
   ```yaml
   environment:
     - SUPERVISOR_TELEGRAM_ID=${SUPERVISOR_TELEGRAM_ID}
   ```

4. Rebuild and restart:
   ```bash
   docker compose -f docker-compose.aleffai.yml up -d --build
   ```

## Verification

Check logs to verify the plugin is registered:

```bash
docker logs aleffai 2>&1 | grep "aleff-supervisor"
```

Expected output:
```json
{"timestamp":"...","level":"info","plugin":"aleff-supervisor","event":"plugin_registered","version":"1.0.0","tools":5}
```

## Security

- Only the configured `SUPERVISOR_TELEGRAM_ID` can execute supervisor commands
- All state changes are logged with user ID and timestamp
- Message content is truncated to 500 characters in notifications

## Future Improvements

- [ ] Persist state to PostgreSQL (currently in-memory)
- [ ] Rate limiting for notifications
- [ ] Multiple supervisors with role-based access
- [ ] Auto-release timeout (return to RUNNING after X minutes)
- [ ] Message digest mode (batch notifications)
