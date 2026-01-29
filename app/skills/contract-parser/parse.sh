#!/bin/bash
# Contract Parser Script
# Extracts structured data from legal contract PDFs

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: contract-parser <contract.pdf> [output.json]"
    echo
    echo "Extracts structured data from contract PDF:"
    echo "  - Parties (contratante, contratado)"
    echo "  - Value (monetary amount)"
    echo "  - Deadline/Duration"
    echo "  - Key clauses"
    echo "  - Dates"
    exit 1
fi

PDF_FILE="$1"
OUTPUT_FILE="${2:-/tmp/contract-parsed.json}"

if [ ! -f "$PDF_FILE" ]; then
    echo "❌ Error: File not found: $PDF_FILE"
    exit 1
fi

echo "📄 Parsing contract: $PDF_FILE"
echo

# Step 1: Extract text from PDF
TXT_FILE="/tmp/contract-text.txt"
echo "1️⃣ Extracting text from PDF..."
pdftotext "$PDF_FILE" "$TXT_FILE"

if [ ! -s "$TXT_FILE" ]; then
    echo "❌ Error: Could not extract text from PDF"
    exit 1
fi

echo "✅ Text extracted ($(wc -l < "$TXT_FILE") lines)"
echo

# Step 2: Analyze text to extract structured data
echo "2️⃣ Analyzing contract..."

# Extract key information using grep and patterns
# This is a simplified version - in production, use AI model for better accuracy

# Find parties (common patterns in Brazilian contracts)
CONTRATANTE=$(grep -i "CONTRATANTE:" "$TXT_FILE" | head -1 | sed 's/CONTRATANTE://I' | sed 's/^[ \t]*//' || echo "Not found")
CONTRATADO=$(grep -i "CONTRATADO:" "$TXT_FILE" | head -1 | sed 's/CONTRATADO://I' | sed 's/^[ \t]*//' || echo "Not found")

# Find value (R$ patterns)
VALUE=$(grep -oP 'R\$\s*[\d.,]+' "$TXT_FILE" | head -1 || echo "Not found")

# Find dates (Brazilian date format DD/MM/YYYY)
DATES=$(grep -oP '\d{2}/\d{2}/\d{4}' "$TXT_FILE" | head -3 | tr '\n' ', ' | sed 's/,$//')

# Find deadline/prazo
PRAZO=$(grep -i "prazo" "$TXT_FILE" | head -1 | sed 's/^[ \t]*//' || echo "Not found")

# Extract key clauses
CLAUSES=$(grep -i "^Cláusula\|^CLÁUSULA" "$TXT_FILE" | head -5 | sed 's/^[ \t]*//' || echo "[]")

# Step 3: Create JSON output
echo "3️⃣ Creating structured output..."

# Build JSON manually (could use jq for more complex cases)
cat > "$OUTPUT_FILE" <<EOF
{
  "file": "$PDF_FILE",
  "extracted_at": "$(date -Iseconds)",
  "parties": {
    "contratante": "$CONTRATANTE",
    "contratado": "$CONTRATADO"
  },
  "value": "$VALUE",
  "deadline": "$PRAZO",
  "dates_found": "$DATES",
  "text_preview": $(head -20 "$TXT_FILE" | jq -Rs .),
  "full_text_file": "$TXT_FILE"
}
EOF

echo "✅ Contract parsed successfully!"
echo
echo "📊 Extracted Data:"
echo "  Contratante: $CONTRATANTE"
echo "  Contratado: $CONTRATADO"
echo "  Value: $VALUE"
echo "  Dates: $DATES"
echo
echo "💾 Full data saved to: $OUTPUT_FILE"
echo
echo "📄 View JSON:"
echo "   cat $OUTPUT_FILE | jq ."

# Clean up
rm -f "$TXT_FILE"
