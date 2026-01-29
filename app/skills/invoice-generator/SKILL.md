---
name: invoice-generator
description: Generate professional invoices from templates using wkhtmltopdf
homepage: https://github.com/alefftech/aleff
metadata:
  moltbot:
    emoji: 🧾
    requires:
      bins: [wkhtmltopdf]
---

# Invoice Generator

Generate professional invoices/NFs from HTML templates using wkhtmltopdf.

## Quick Start

```bash
invoice-generator --client "EMPRESA XYZ" --service "Consultoria" --value "15000.00"
```

## What It Does

1. Takes invoice data (client, service, value, etc.)
2. Fills HTML template with data
3. Generates PDF using wkhtmltopdf
4. Outputs professional invoice ready to send

## Usage

```bash
invoice-generator \
  --client "EMPRESA XYZ LTDA" \
  --cnpj "12.345.678/0001-90" \
  --service "Consultoria em IA" \
  --description "Implementação de soluções de IA" \
  --value "15000.00" \
  --date "2026-01-29" \
  --output "nf-001.pdf"
```

## Template Variables

- `{{CLIENTE}}` - Client name
- `{{CNPJ}}` - Client CNPJ
- `{{SERVICO}}` - Service name
- `{{DESCRICAO}}` - Service description
- `{{VALOR}}` - Value (R$)
- `{{DATA}}` - Date
- `{{NUMERO}}` - Invoice number
- `{{VENCIMENTO}}` - Due date

## Example Output

Generates PDF invoice with:
- IAVANCADA branding
- Client information
- Service details
- Value formatted (R$ 15.000,00)
- Payment instructions
- Footer with company data

## Use Cases

- **CFO:** Generate NFs automatically
- **IAVANCADA:** Client invoices
- **AGILCONTRATOS:** Legal service invoices
- **MENTORINGBASE:** Course payment invoices

## Templates

Templates stored in: `/app/skills/invoice-generator/templates/`

- `default.html` - Standard invoice
- `iavancada.html` - IAVANCADA branded
- `agilcontratos.html` - Legal services
- `mentoringbase.html` - Education services

## Notes

- Outputs PDF in A4 format
- Supports custom templates
- Auto-calculates taxes if configured
- Saves to `/tmp/invoice-{number}.pdf` by default
