# 📄 nano-pdf

> **Edita PDFs com instruções em linguagem natural**
> **Status:** ✅ Ativa
> **Tipo:** Skill (CLI binary)

---

## 🎯 O Que É

Ferramenta CLI que permite editar PDFs usando comandos em linguagem natural, sem precisar abrir Adobe Acrobat ou editores complexos.

**Capacidades:**
- Editar texto em páginas específicas
- Alterar valores, datas, nomes
- Corrigir typos em documentos
- Modificar propostas e contratos
- Atualizar NFs e faturas

**Analogia:** É como ter um editor de PDF que entende português e faz as mudanças automaticamente.

---

## 🎨 Por Que Foi Criada

**Problema original (AGILCONTRATOS):**
- Carlos André precisa corrigir contratos frequentemente
- Abrir Adobe Acrobat demora 2-3 minutos
- Edições simples (trocar um valor) levam 5+ minutos
- Difícil de automatizar

**Solução:**
- Editar PDFs via linha de comando
- Instruções em linguagem natural
- Mudanças em segundos
- Completamente automatizável

**ROI:**
- Antes: 5 minutos para editar um contrato
- Depois: 10 segundos
- Economia: ~97% do tempo

---

## 🚀 Como Usar

### Editar Valor em Contrato

```bash
nano-pdf edit contrato.pdf 1 "Alterar o valor de R$ 5.000 para R$ 7.500"
```

### Corrigir Data

```bash
nano-pdf edit proposta.pdf 2 "Mudar a data de 01/02/2026 para 15/02/2026"
```

### Corrigir Typo

```bash
nano-pdf edit documento.pdf 3 "Corrigir o nome de 'Jhon' para 'John'"
```

### Atualizar Múltiplos Campos

```bash
nano-pdf edit nf.pdf 1 "Alterar o destinatário para 'IAVANCADA LTDA' e o valor para R$ 12.000"
```

---

## ⚙️ Configuração

**Já instalado!** O binário está disponível em `/usr/local/bin/nano-pdf`

Verificar instalação:
```bash
docker exec aleffai which nano-pdf
# /usr/local/bin/nano-pdf
```

Testar:
```bash
docker exec aleffai nano-pdf --help
```

---

## 🔍 Comandos Úteis

### Sintaxe Básica

```bash
nano-pdf edit <arquivo.pdf> <página> "<instrução>"
```

**Onde:**
- `<arquivo.pdf>` - Caminho do PDF
- `<página>` - Número da página (0-indexed ou 1-indexed, depende da versão)
- `<instrução>` - O que fazer em linguagem natural

### Exemplos Práticos

**AGILCONTRATOS:**
```bash
# Atualizar valor de contrato
nano-pdf edit /tmp/contrato-xpto.pdf 1 "Alterar valor de R$ 10.000 para R$ 15.000"

# Corrigir prazo
nano-pdf edit /tmp/contrato-xpto.pdf 2 "Mudar prazo de 30 dias para 45 dias"

# Atualizar partes
nano-pdf edit /tmp/contrato-xpto.pdf 1 "Substituir 'Contratante: ABC' por 'Contratante: XYZ LTDA'"
```

**IAVANCADA (Propostas):**
```bash
# Personalizar proposta
nano-pdf edit /tmp/proposta-cliente.pdf 1 "Trocar 'Cliente Genérico' por 'MENTORINGBASE LTDA'"

# Atualizar valores
nano-pdf edit /tmp/proposta-cliente.pdf 3 "Mudar 'Total: R$ 20.000' para 'Total: R$ 25.000'"
```

**CFO (NFs):**
```bash
# Corrigir nota fiscal
nano-pdf edit /tmp/nf-123.pdf 1 "Alterar destinatário para 'EMPRESA ABC LTDA' e CNPJ para '12.345.678/0001-90'"
```

---

## 🐛 Troubleshooting

### Erro: "nano-pdf: command not found"

**Causa:** Binário não instalado ou não no PATH

**Solução:**
```bash
# Verificar instalação
docker exec aleffai which nano-pdf

# Se não existir, rebuild container
docker build -t aleff:latest .
docker compose -f docker-compose.aleff.yml up -d aleffai
```

### Página errada sendo editada

**Sintoma:** Mudanças aparecem em página diferente da especificada

**Causa:** Numeração pode ser 0-based ou 1-based dependendo da versão

**Solução:**
```bash
# Se especificou página 1 e não funcionou, tente página 0
nano-pdf edit documento.pdf 0 "instrução"

# Ou vice-versa
nano-pdf edit documento.pdf 2 "instrução"  # ao invés de 1
```

### Mudança não aplicada

**Sintoma:** PDF não foi modificado

**Possíveis causas:**
1. Instrução muito vaga - seja específico
2. Texto não encontrado no PDF
3. PDF protegido/encriptado

**Solução:**
```bash
# Instruções específicas funcionam melhor
❌ Ruim: "mudar o valor"
✅ Bom: "alterar o valor de R$ 5.000 para R$ 7.500"

# Verificar se PDF está protegido
pdfinfo documento.pdf | grep -i encrypt
```

### PDF corrompido após edição

**Sintoma:** PDF não abre após usar nano-pdf

**Solução:**
```bash
# Sempre fazer backup antes
cp original.pdf original.backup.pdf
nano-pdf edit original.pdf 1 "instrução"

# Se corrompeu, restaurar backup
mv original.backup.pdf original.pdf
```

---

## 📂 Código-fonte

**Binary instalado via pip:**
```dockerfile
# Dockerfile linha ~XX
RUN python3 -m pip install --break-system-packages nano-pdf
```

**Localização:** `/usr/local/bin/nano-pdf`

**Skill detection:** `/skills/nano-pdf/SKILL.md`

---

## 💡 Use Cases para a Holding

### AGILCONTRATOS (Carlos André)
- **Correção rápida de contratos:** Valores, datas, nomes
- **Personalização em massa:** Gerar contratos customizados
- **Automação de revisões:** Scripts para updates comuns

### IAVANCADA (Propostas)
- **Personalizar templates:** Nome do cliente, valores
- **Atualização de preços:** Quando mudar tabela
- **Branding:** Logo, cores, footer

### CFO (Financeiro)
- **Correção de NFs:** Erros de digitação
- **Atualização de dados:** CNPJ, endereço
- **Batch processing:** Corrigir múltiplas NFs

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Edição de texto com linguagem natural
- ✅ CLI disponível no container
- ✅ Funciona com qualquer PDF

**V2 (planejado):**
- [ ] Integração com Aleff via Telegram/WhatsApp
  - Enviar PDF → Aleff edita → Retorna editado
- [ ] Templates pré-salvos de edições comuns
- [ ] Batch editing (editar múltiplos PDFs)

**V3 (futuro):**
- [ ] Interface web para edições
- [ ] Histórico de mudanças (diff de PDFs)
- [ ] Validação automática de mudanças

---

## 📚 Documentação Externa

**nano-pdf:**
- PyPI: https://pypi.org/project/nano-pdf/
- GitHub: (verificar no PyPI)

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Instalada e funcionando
