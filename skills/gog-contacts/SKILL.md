---
name: gog-contacts
description: Manage Google Contacts via gogcli - create, read, update contacts and access Workspace directory
homepage: https://github.com/steipete/gogcli
metadata:
  moltbot:
    emoji: 👤
    requires:
      bins: [gog]
      env: [GOOGLE_REFRESH_TOKEN]
---

# Google Contacts Management (gogcli)

Manage personal contacts, search Workspace directory, and sync CRM data using Google Contacts API via gog CLI.

## When to Use

Use this skill when asked to:
- Find contact information (email, phone)
- Add new contacts to Google
- Update existing contact details
- Search company directory
- Sync CRM data with Google Contacts
- Export contact lists
- Create contact groups

## Setup

### Enable Contacts API
The Contacts API must be enabled in Google Cloud Console (already done).

### Authenticate with Contacts Scope
```bash
# Add contacts service to existing auth
gog auth add aleff@iavancada.com --services gmail,calendar,drive,contacts

# Or readonly if only searching
gog auth add aleff@iavancada.com --services contacts --readonly
```

### Verify Access
```bash
gog auth list
# Should show: aleff@iavancada.com with contacts scope
```

## Quick Start

### Search Contacts
```bash
# Find contact by name
gog contacts search "Ronald"

# Find by email
gog contacts search "ronald@iavancada.com"

# Search company directory
gog contacts directory "Melissa"
```

### Create Contact
```bash
# Basic contact
gog contacts create \
  --name "João Silva" \
  --email "joao@cliente.com" \
  --phone "+5511999999999"

# Full contact with company
gog contacts create \
  --name "Maria Santos" \
  --email "maria@empresa.com.br" \
  --phone "+5511988888888" \
  --company "Empresa XYZ" \
  --title "CEO" \
  --notes "Cliente potencial - reunião 2026-02-15"
```

### Update Contact
```bash
# Update email
gog contacts update "João Silva" --email "joao.novo@cliente.com"

# Add phone
gog contacts update "Maria Santos" --phone "+5511977777777"

# Update notes
gog contacts update "João Silva" --notes "Deal fechado - R$50k MRR"
```

### Get Contact Details
```bash
# Get full contact info
gog contacts get "Ronald"

# Export to JSON
gog contacts get "Ronald" --json > ronald.json
```

### Delete Contact
```bash
gog contacts delete "João Silva"
```

## Integration with Holding

### IAVANCADA - Client Contact Management

**Add new client after sales call:**
```bash
gog contacts create \
  --name "Carlos Eduardo Lima" \
  --email "carlos@startupai.com" \
  --phone "+5511987654321" \
  --company "Startup AI Ltda" \
  --title "CTO" \
  --notes "Lead quente - quer consultoria IA para chatbot. Budget: R$30k. Follow-up: 2026-02-05"
```

**Update after contract signed:**
```bash
gog contacts update "Carlos Eduardo Lima" \
  --notes "Cliente ativo desde 2026-02-01. Projeto: Chatbot AI. Valor: R$45k. PM: Cintia. Status: em andamento"
```

### AGILCONTRATOS - Legal Contacts

**Add lawyer contact:**
```bash
gog contacts create \
  --name "Dr. André Almeida" \
  --email "andre@escritorio.adv.br" \
  --phone "+5511976543210" \
  --company "Almeida & Associados" \
  --title "Advogado Sócio" \
  --notes "Especialista em contratos tech. Parceiro para casos complexos. OAB/SP 123456"
```

**Create contact group for partners:**
```bash
gog contacts group create "Parceiros Jurídicos"
gog contacts group add "Parceiros Jurídicos" "Dr. André Almeida"
```

### MENTORINGBASE - Mentor Network

**Add mentor:**
```bash
gog contacts create \
  --name "Melissa Oliveira" \
  --email "melissa@mentoringbase.com.br" \
  --phone "+5511965432109" \
  --company "MENTORINGBASE" \
  --title "Head of Mentorship" \
  --notes "Especialista em carreira tech. Mentora plataforma. Áreas: liderança, transição de carreira"
```

**Search mentors by specialty:**
```bash
gog contacts search "Especialista" | grep -i "tech\|liderança"
```

### CFO - Finance Contacts

**Add accountant:**
```bash
gog contacts create \
  --name "Patricia Souza" \
  --email "patricia@contabilidade.com" \
  --phone "+5511954321098" \
  --company "Contábil Brasil" \
  --title "Contadora" \
  --notes "Contadora holding. CRC: 123456. Atende: IAVANCADA, AGILCONTRATOS, MENTORINGBASE"
```

## Advanced Usage

### Bulk Import from CSV
```bash
# CSV format: name,email,phone,company,title,notes
cat leads.csv | while IFS=, read name email phone company title notes; do
  gog contacts create \
    --name "$name" \
    --email "$email" \
    --phone "$phone" \
    --company "$company" \
    --title "$title" \
    --notes "$notes"
done
```

### Export All Contacts
```bash
# Export to JSON
gog contacts list --json > all-contacts.json

# Export to CSV
gog contacts list --format csv > all-contacts.csv
```

### Sync with CRM (Supabase)
```bash
# Export contacts and sync to Supabase
gog contacts list --json | \
  jq -r '.[] | {
    name: .name,
    email: .email,
    phone: .phone,
    company: .company,
    title: .title,
    notes: .notes,
    synced_at: now
  }' | \
  psql $DATABASE_URL -c "INSERT INTO crm_contacts (name, email, phone, company, title, notes, synced_at) VALUES ..."
```

### Find Contacts by Domain
```bash
# Find all @iavancada.com contacts
gog contacts list | grep "@iavancada.com"

# Find all contacts from specific company
gog contacts search --company "IAVANCADA"
```

### Contact Groups Management
```bash
# Create groups
gog contacts group create "Clientes Ativos"
gog contacts group create "Leads Quentes"
gog contacts group create "Parceiros"

# Add to group
gog contacts group add "Clientes Ativos" "Carlos Eduardo Lima"

# List group members
gog contacts group list "Clientes Ativos"

# Remove from group
gog contacts group remove "Leads Quentes" "João Silva"
```

## Workspace Directory Access

### Search Company Directory
```bash
# Find employee by name
gog contacts directory "Ronald"

# Find by department
gog contacts directory --department "Tech"

# Find by title
gog contacts directory --title "CTO"
```

### Export Directory
```bash
# Export all employees
gog contacts directory --all --json > company-directory.json
```

## Automation Examples

### Daily Lead Follow-up
```bash
#!/bin/bash
# Check contacts with "follow-up" in notes from today
TODAY=$(date +%Y-%m-%d)

gog contacts list --json | \
  jq -r ".[] | select(.notes | contains(\"Follow-up: $TODAY\")) | .name + \" - \" + .email" | \
  while read contact; do
    echo "⏰ Follow-up hoje: $contact"
    # Send reminder to Telegram
    curl -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" \
      -d "chat_id=$CHAT_ID" \
      -d "text=Follow-up: $contact"
  done
```

### New Client Onboarding
```bash
#!/bin/bash
# Add client and schedule welcome email
NAME="$1"
EMAIL="$2"
PHONE="$3"
COMPANY="$4"

# Create contact
gog contacts create \
  --name "$NAME" \
  --email "$EMAIL" \
  --phone "$PHONE" \
  --company "$COMPANY" \
  --notes "Cliente novo - onboarding iniciado $(date +%Y-%m-%d)"

# Schedule welcome email
gog gmail send \
  --to "$EMAIL" \
  --subject "Bem-vindo à IAVANCADA!" \
  --body "template-welcome.html"

# Add to CRM
echo "$NAME,$EMAIL,$PHONE,$COMPANY,onboarding" >> crm-pipeline.csv
```

### Enrich Contacts from LinkedIn
```bash
#!/bin/bash
# Use apify + contacts to enrich data
LINKEDIN_URL="$1"

# Scrape LinkedIn via Apify
apify call apify/linkedin-profile-scraper \
  --input "{\"urls\": [\"$LINKEDIN_URL\"]}" \
  --output linkedin-data.json

# Extract data
NAME=$(jq -r '.[0].name' linkedin-data.json)
EMAIL=$(jq -r '.[0].email' linkedin-data.json)
COMPANY=$(jq -r '.[0].company' linkedin-data.json)
TITLE=$(jq -r '.[0].title' linkedin-data.json)

# Update or create contact
gog contacts create \
  --name "$NAME" \
  --email "$EMAIL" \
  --company "$COMPANY" \
  --title "$TITLE" \
  --notes "LinkedIn: $LINKEDIN_URL"
```

## Best Practices

### Naming Convention
```
Format: "Nome Completo" (no nicknames)
Example: "Carlos Eduardo Lima" (not "Carlão")
```

### Notes Structure
```
Template:
- Status: [Lead/Cliente/Parceiro/Inativo]
- Source: [LinkedIn/Indicação/Site/Evento]
- Value: [R$ XX,XXX ou potencial]
- Next: [Próxima ação + data]
- Tags: #tech #consultoria #high-value
```

Example:
```bash
gog contacts update "Carlos Lima" --notes "
Status: Cliente ativo
Source: LinkedIn
Value: R$45k (contrato assinado)
Project: Chatbot AI para atendimento
PM: Cintia
Next: Review sprint 2026-02-15
Tags: #ia #chatbot #high-value #tech
"
```

### Contact Groups Strategy
```
Groups:
- "Clientes Ativos" - Contratos em andamento
- "Leads Quentes" - Proposta enviada
- "Leads Frios" - Interesse inicial
- "Parceiros" - Fornecedores/colaboradores
- "Rede" - Networking geral
- "VIP" - High-value contacts
```

### Privacy & LGPD Compliance
- Always get consent before adding contacts
- Document consent in notes: "Consent: 2026-01-29"
- Anonymize sensitive data in shared exports
- Respect opt-out requests immediately

## Troubleshooting

### "Permission denied" error
```bash
# Re-authenticate with contacts scope
gog auth logout aleff@iavancada.com
gog auth add aleff@iavancada.com --services gmail,calendar,drive,contacts
```

### Contact not found
```bash
# Search by partial name
gog contacts search "Carl"

# Search by email
gog contacts search "@empresa.com"
```

### Duplicate contacts
```bash
# Find duplicates
gog contacts list --json | jq -r '.[].email' | sort | uniq -d

# Merge duplicates (manual)
gog contacts get "Contact Name" --json
gog contacts delete "Contact Name (duplicate)"
```

## OAuth Scopes Required

```
https://www.googleapis.com/auth/contacts              # Read/write contacts
https://www.googleapis.com/auth/contacts.readonly     # Read-only contacts
https://www.googleapis.com/auth/contacts.other.readonly # Other contacts
https://www.googleapis.com/auth/directory.readonly    # Workspace directory
```

These are included when using `--services contacts` during authentication.

## Resources

- **gogcli GitHub**: https://github.com/steipete/gogcli
- **People API**: https://developers.google.com/people
- **Contact Schema**: https://developers.google.com/people/api/rest/v1/people

## Limitations

- Cannot access other users' personal contacts (only directory)
- Contact photos require separate upload
- Labels/groups limited to 25 per contact
- Bulk operations may hit rate limits (use delays)

## When NOT to Use

- Large-scale CRM (use dedicated CRM instead)
- Real-time sync (use webhooks/APIs)
- Complex workflows (use CRM automation)

Use gog contacts for lightweight contact management and quick CRM sync operations.
