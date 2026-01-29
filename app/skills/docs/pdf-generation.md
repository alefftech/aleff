# 📑 PDF Generation (wkhtmltopdf)

> **Converte HTML em PDF de alta qualidade**
> **Status:** ✅ Ativa
> **Tipo:** Skill (CLI binary)

---

## 🎯 O Que É

Ferramenta CLI que converte páginas HTML em documentos PDF profissionais, mantendo CSS, imagens, e formatação.

**Capacidades:**
- Converter HTML → PDF
- Manter estilos CSS completos
- Suportar imagens, fontes customizadas
- Criar PDFs multi-página
- Headers e footers customizados
- Numeração de páginas
- Tabela de conteúdos automática

**Analogia:** É como "imprimir para PDF" no Chrome, mas via linha de comando e com muito mais controle.

---

## 🎨 Por Que Foi Criada

**Problema original (Holding):**
- Gerar propostas comerciais manualmente no Word/Google Docs
- Formação inconsistente entre documentos
- Difícil de automatizar
- Tempo gasto: 15-30 min por proposta

**Solução:**
- Templates HTML reutilizáveis
- Geração automática de PDFs
- Branding consistente (logos, cores, fontes)
- Completamente automatizável via código

**ROI:**
- Antes: 20 minutos/proposta manual
- Depois: 5 segundos/proposta automática
- Economia: ~99% do tempo

---

## 🚀 Como Usar

### Converter HTML Simples → PDF

```bash
wkhtmltopdf input.html output.pdf
```

### Converter URL → PDF

```bash
wkhtmltopdf https://example.com output.pdf
```

### PDF com Margens Customizadas

```bash
wkhtmltopdf --margin-top 20mm --margin-bottom 20mm \
  --margin-left 15mm --margin-right 15mm \
  input.html output.pdf
```

### PDF com Header e Footer

```bash
wkhtmltopdf \
  --header-center "IAVANCADA - Proposta Comercial" \
  --header-font-size 10 \
  --footer-center "Página [page] de [topage]" \
  --footer-font-size 8 \
  input.html output.pdf
```

### PDF Paisagem (Landscape)

```bash
wkhtmltopdf --orientation Landscape input.html output.pdf
```

### PDF em Diferentes Tamanhos

```bash
# A4 (padrão)
wkhtmltopdf --page-size A4 input.html output.pdf

# Carta
wkhtmltopdf --page-size Letter input.html output.pdf

# Custom
wkhtmltopdf --page-width 200mm --page-height 300mm input.html output.pdf
```

---

## ⚙️ Configuração

**Já instalado!** wkhtmltopdf está disponível em `/usr/bin/wkhtmltopdf`

Verificar instalação:
```bash
docker exec aleffai which wkhtmltopdf
# /usr/bin/wkhtmltopdf

docker exec aleffai wkhtmltopdf --version
# wkhtmltopdf 0.12.6
```

---

## 🔍 Comandos Úteis

### Template de Proposta Comercial

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposta - {{CLIENTE}}</title>
    <style>
        @page {
            margin: 20mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
        }
        .header img {
            width: 200px;
            margin-bottom: 10px;
        }
        .section {
            margin: 30px 0;
        }
        .box {
            background: #ecf0f1;
            border-left: 4px solid #3498db;
            padding: 20px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #34495e;
            color: white;
        }
        .total {
            font-size: 18pt;
            font-weight: bold;
            color: #27ae60;
            text-align: right;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <!-- Logo aqui -->
        <h1>IAVANCADA</h1>
        <p>Inteligência Artificial Avançada para Negócios</p>
    </div>

    <div class="section">
        <h2>Proposta Comercial</h2>
        <div class="box">
            <p><strong>Cliente:</strong> {{CLIENTE}}</p>
            <p><strong>CNPJ:</strong> {{CNPJ}}</p>
            <p><strong>Contato:</strong> {{CONTATO}}</p>
            <p><strong>Data:</strong> {{DATA}}</p>
        </div>
    </div>

    <div class="section">
        <h2>Serviços Propostos</h2>
        <table>
            <thead>
                <tr>
                    <th>Serviço</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{SERVICO_1}}</td>
                    <td>{{DESC_1}}</td>
                    <td>R$ {{VALOR_1}}</td>
                </tr>
                <!-- Mais linhas -->
            </tbody>
        </table>

        <div class="total">
            Total: R$ {{TOTAL}}
        </div>
    </div>

    <div class="section">
        <h2>Condições</h2>
        <ul>
            <li>Prazo: {{PRAZO}} dias</li>
            <li>Pagamento: {{PAGAMENTO}}</li>
            <li>Validade: {{VALIDADE}}</li>
        </ul>
    </div>
</body>
</html>
```

### Gerar PDF a Partir do Template

```bash
# Substituir variáveis com sed
sed -e "s/{{CLIENTE}}/EMPRESA XYZ LTDA/g" \
    -e "s/{{CNPJ}}/12.345.678\/0001-90/g" \
    -e "s/{{CONTATO}}/contato@xyz.com/g" \
    -e "s/{{DATA}}/29\/01\/2026/g" \
    -e "s/{{SERVICO_1}}/Consultoria IA/g" \
    -e "s/{{DESC_1}}/Implementação de soluções de IA/g" \
    -e "s/{{VALOR_1}}/15.000,00/g" \
    -e "s/{{TOTAL}}/15.000,00/g" \
    -e "s/{{PRAZO}}/30/g" \
    -e "s/{{PAGAMENTO}}/50% adiantado, 50% na entrega/g" \
    -e "s/{{VALIDADE}}/15 dias/g" \
    template.html > proposta-xyz.html

# Gerar PDF
wkhtmltopdf \
  --margin-top 10mm \
  --margin-bottom 10mm \
  --footer-center "IAVANCADA | www.iavancada.com | contato@iavancada.com" \
  --footer-font-size 8 \
  proposta-xyz.html proposta-xyz.pdf

echo "✅ Proposta gerada: proposta-xyz.pdf"
```

---

## 🐛 Troubleshooting

### Erro: "wkhtmltopdf: command not found"

**Causa:** Binário não instalado

**Solução:**
```bash
# Rebuild container (já está no Dockerfile)
docker build -t aleff:latest .
docker compose -f docker-compose.aleff.yml up -d aleffai
```

### PDF está cortado ou mal formatado

**Sintoma:** Conteúdo fica fora da página

**Solução:**
```bash
# Ajustar margens
wkhtmltopdf --margin-top 20mm --margin-bottom 20mm input.html output.pdf

# Ou ajustar no CSS
<style>
@page {
    margin: 20mm;
}
</style>
```

### Imagens não aparecem no PDF

**Sintoma:** PDF gerado mas sem imagens

**Causas possíveis:**
1. Caminhos relativos incorretos
2. Imagens externas bloqueadas

**Solução:**
```bash
# Usar caminhos absolutos ou data URIs
<img src="file:///path/to/image.png">

# Ou permitir carregamento de recursos
wkhtmltopdf --enable-local-file-access input.html output.pdf

# Ou embed images como base64
<img src="data:image/png;base64,iVBOR...">
```

### Fontes customizadas não funcionam

**Sintoma:** PDF usa fontes genéricas

**Solução:**
```css
/* Incluir fonte no CSS */
@font-face {
    font-family: 'MinhaFonte';
    src: url('file:///usr/share/fonts/truetype/minhafonte.ttf');
}

body {
    font-family: 'MinhaFonte', Arial, sans-serif;
}
```

### Processo muito lento

**Sintoma:** Demora minutos para gerar PDF

**Causa:** Carregamento de recursos externos (CSS, JS)

**Solução:**
```bash
# Inline todo CSS/JS no HTML
# Usar --disable-javascript se não precisar de JS
wkhtmltopdf --disable-javascript input.html output.pdf

# Ou aumentar timeout
wkhtmltopdf --javascript-delay 1000 input.html output.pdf
```

---

## 📂 Código-fonte

**Binary instalado via apt:**
```dockerfile
# Dockerfile linha ~XX
RUN apt-get install -y wkhtmltopdf xvfb
```

**Localização:** `/usr/bin/wkhtmltopdf`

**Script wrapper (futuro):** `/app/scripts/generate-pdf.sh`

---

## 💡 Use Cases para a Holding

### IAVANCADA (Propostas)
- **Propostas comerciais automatizadas:** Template + dados → PDF
- **Relatórios de projetos:** Dashboards → PDF para clientes
- **Documentação técnica:** Markdown → HTML → PDF

### AGILCONTRATOS (Carlos André)
- **Contratos personalizados:** Template jurídico + variáveis
- **Termos de serviço:** Geração automática
- **Aditivos contratuais:** Quick generation

### MENTORINGBASE (Melissa)
- **Certificados de conclusão:** Template + nome do aluno
- **Materiais de curso:** PDFs formatados
- **Relatórios de progresso:** Dashboards → PDF

### CFO (Financeiro)
- **Notas fiscais:** Template + dados da NF
- **Relatórios financeiros:** Gráficos → PDF
- **Boletos:** Geração automatizada

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Conversão HTML → PDF básica
- ✅ CLI disponível no container
- ✅ Suporte a CSS completo

**V2 (planejado):**
- [ ] Templates prontos para a holding
  - Proposta comercial IAVANCADA
  - Contrato padrão AGILCONTRATOS
  - Certificado MENTORINGBASE
  - NF template CFO
- [ ] Skill customizada para geração via Aleff
- [ ] Webhook: enviar dados → receber PDF

**V3 (futuro):**
- [ ] Editor visual de templates
- [ ] Biblioteca de componentes reutilizáveis
- [ ] Integração com Notion/Google Docs (template lá, PDF aqui)

---

## 📚 Documentação Externa

**wkhtmltopdf:**
- Website: https://wkhtmltopdf.org/
- Manual: https://wkhtmltopdf.org/usage/wkhtmltopdf.txt
- GitHub: https://github.com/wkhtmltopdf/wkhtmltopdf

**Tutoriais:**
- Headers/Footers: https://wkhtmltopdf.org/usage/wkhtmltopdf.txt (seção --header-*)
- Page breaks: Use CSS `page-break-after: always;`

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Instalada e funcionando
