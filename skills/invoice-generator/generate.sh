#!/bin/bash
# Invoice Generator Script
# Generates professional invoices from HTML templates

set -e

# Default values
TEMPLATE="${INVOICE_TEMPLATE:-default}"
OUTPUT="/tmp/invoice-$(date +%Y%m%d-%H%M%S).pdf"
DATE=$(date +%d/%m/%Y)
NUMBER="AUTO-$(date +%Y%m%d%H%M)"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --client) CLIENT="$2"; shift 2 ;;
        --cnpj) CNPJ="$2"; shift 2 ;;
        --service) SERVICE="$2"; shift 2 ;;
        --description) DESCRIPTION="$2"; shift 2 ;;
        --value) VALUE="$2"; shift 2 ;;
        --date) DATE="$2"; shift 2 ;;
        --number) NUMBER="$2"; shift 2 ;;
        --output) OUTPUT="$2"; shift 2 ;;
        --template) TEMPLATE="$2"; shift 2 ;;
        --help)
            echo "Usage: invoice-generator [OPTIONS]"
            echo
            echo "Options:"
            echo "  --client NAME       Client name"
            echo "  --cnpj CNPJ        Client CNPJ"
            echo "  --service NAME     Service name"
            echo "  --description TEXT Service description"
            echo "  --value AMOUNT     Value (without R$)"
            echo "  --date DATE        Invoice date (default: today)"
            echo "  --number NUMBER    Invoice number (default: auto)"
            echo "  --output FILE      Output PDF file"
            echo "  --template NAME    Template name (default: default)"
            echo
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Validate required fields
if [ -z "$CLIENT" ] || [ -z "$SERVICE" ] || [ -z "$VALUE" ]; then
    echo "❌ Error: Missing required fields"
    echo
    echo "Required: --client, --service, --value"
    echo "Run with --help for more info"
    exit 1
fi

echo "📝 Generating invoice..."
echo

# Format value with Brazilian format
VALUE_FORMATTED=$(echo "$VALUE" | sed 's/\./,/' | sed 's/\B(?=(\d{3})+(?!\d))/./g')

# Create HTML from template
TEMPLATE_DIR="/app/skills/invoice-generator/templates"
if [ ! -f "$TEMPLATE_DIR/$TEMPLATE.html" ]; then
    TEMPLATE="default"
fi

HTML_FILE="/tmp/invoice-temp.html"

# Simple template substitution
cat "$TEMPLATE_DIR/$TEMPLATE.html" | \
    sed "s/{{CLIENTE}}/$CLIENT/g" | \
    sed "s/{{CNPJ}}/${CNPJ:-N\/A}/g" | \
    sed "s/{{SERVICO}}/$SERVICE/g" | \
    sed "s/{{DESCRICAO}}/${DESCRIPTION:-$SERVICE}/g" | \
    sed "s/{{VALOR}}/$VALUE_FORMATTED/g" | \
    sed "s/{{DATA}}/$DATE/g" | \
    sed "s/{{NUMERO}}/$NUMBER/g" \
    > "$HTML_FILE"

# Generate PDF
wkhtmltopdf \
    --page-size A4 \
    --margin-top 10mm \
    --margin-bottom 10mm \
    --margin-left 15mm \
    --margin-right 15mm \
    --footer-center "IAVANCADA | www.iavancada.com | contato@iavancada.com" \
    --footer-font-size 8 \
    "$HTML_FILE" \
    "$OUTPUT" 2>&1 | grep -v "^$"

# Clean up
rm -f "$HTML_FILE"

echo "✅ Invoice generated successfully!"
echo
echo "📄 Details:"
echo "  Client: $CLIENT"
echo "  Service: $SERVICE"
echo "  Value: R$ $VALUE_FORMATTED"
echo "  Number: $NUMBER"
echo "  Date: $DATE"
echo
echo "💾 Saved to: $OUTPUT"
echo
echo "📊 View PDF:"
echo "   xdg-open $OUTPUT  # or: open $OUTPUT (Mac)"
