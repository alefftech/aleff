---
name: contract-parser
description: Extract structured data from legal contracts (PDF) - parties, values, dates, clauses
homepage: https://github.com/alefftech/aleff
metadata:
  moltbot:
    emoji: 📜
    requires:
      bins: [pdftotext, jq]
---

# Contract Parser

Extract structured data from legal contract PDFs using pdftotext + AI analysis.

## Quick Start

```bash
contract-parser <contract.pdf>
```

## What It Does

1. Converts PDF to text using `pdftotext`
2. Analyzes text to extract:
   - **Parties:** Contratante, Contratado
   - **Value:** Monetary amount
   - **Deadline:** Contract duration/deadline
   - **Key Clauses:** Important legal terms
   - **Dates:** Signature date, validity

3. Outputs structured JSON

## Example Output

```json
{
  "parties": {
    "contractor": "IAVANCADA LTDA",
    "contracted": "EMPRESA XYZ LTDA"
  },
  "value": "R$ 15.000,00",
  "deadline": "30 days",
  "signature_date": "2026-01-29",
  "key_clauses": [
    "Cláusula 1: Payment terms",
    "Cláusula 2: Confidentiality"
  ]
}
```

## Use Cases

- **AGILCONTRATOS:** Quick contract analysis
- **Due diligence:** Extract key terms fast
- **Contract database:** Populate structured data
- **Alert system:** Deadline tracking

## Notes

- Works best with structured contracts
- May need manual review for complex documents
- Saves extracted data to `/tmp/contract-parsed.json`
