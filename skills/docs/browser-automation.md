# 🎭 Browser Automation (Playwright & Puppeteer)

> **Automação de navegadores para testes, scraping e PDFs**
> **Status:** ✅ Ativa
> **Tipo:** Skill (NPM packages)

---

## 🎯 O Que É

Ferramentas para controlar navegadores (Chrome, Firefox, Safari) via código, permitindo automação completa de tarefas web.

**Capacidades:**
- **Scraping:** Extrair dados de websites
- **Screenshots:** Capturar tela de páginas
- **PDFs:** Gerar PDFs de páginas web
- **Testing:** Testar aplicações web automaticamente
- **Form filling:** Preencher formulários
- **Navigation:** Navegar entre páginas
- **JavaScript execution:** Executar código no browser

**Analogia:** É como ter um robô controlando seu navegador, fazendo exatamente o que você programar.

---

## 🎨 Por Que Foi Criada

**Problema original (Holding):**
- Copiar dados manualmente de sites (preços, leads, etc.)
- Testar websites manualmente (tempo + erro humano)
- Gerar PDFs de páginas dinâmicas (relatórios, dashboards)
- Monitorar mudanças em sites de concorrentes

**Solução:**
- Automação completa de navegação web
- Scraping estruturado e confiável
- Testes automáticos (CI/CD)
- Geração programática de PDFs

**ROI:**
- Antes: 30 min/dia copiando dados manualmente
- Depois: 1 minuto automático
- Economia: ~97% do tempo + zero erros

---

## 🚀 Como Usar

### Playwright

**Screenshot de uma página:**
```bash
npx playwright screenshot https://example.com screenshot.png
```

**Script Node.js (mais controle):**
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://example.com');
  await page.screenshot({ path: 'screenshot.png' });

  await browser.close();
})();
```

**Executar:**
```bash
node script.js
```

### Puppeteer

**Gerar PDF de página:**
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://example.com');
  await page.pdf({ path: 'page.pdf', format: 'A4' });

  await browser.close();
})();
```

**Web Scraping:**
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://example.com/pricing');

  // Extrair dados
  const prices = await page.$$eval('.price', elements =>
    elements.map(el => el.textContent.trim())
  );

  console.log('Preços encontrados:', prices);

  await browser.close();
})();
```

---

## ⚙️ Configuração

**Já instalado!** Ambos disponíveis globalmente:

```bash
docker exec aleffai npm list -g playwright puppeteer
```

**Browser Chromium:**
O browser será baixado automaticamente no primeiro uso (~150MB).

Para instalar manualmente:
```bash
docker exec aleffai npx playwright install chromium
```

---

## 🔍 Comandos Úteis

### Playwright CLI

```bash
# Screenshot
npx playwright screenshot https://example.com output.png

# Screenshot em mobile
npx playwright screenshot --device="iPhone 12" https://example.com mobile.png

# PDF
npx playwright pdf https://example.com output.pdf

# Codegen (grava suas ações e gera código)
npx playwright codegen https://example.com
```

### Web Scraping Avançado

```javascript
// scrape-competitor.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://competitor.com/pricing');

  // Esperar elemento carregar
  await page.waitForSelector('.pricing-table');

  // Extrair dados estruturados
  const plans = await page.$$eval('.plan', plans => {
    return plans.map(plan => ({
      name: plan.querySelector('.plan-name').textContent,
      price: plan.querySelector('.plan-price').textContent,
      features: Array.from(plan.querySelectorAll('.feature')).map(f => f.textContent)
    }));
  });

  console.log(JSON.stringify(plans, null, 2));

  await browser.close();
})();
```

### Teste Automático de Formulário

```javascript
// test-contact-form.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // visible
  const page = await browser.newPage();

  await page.goto('https://iavancada.com/contato');

  // Preencher formulário
  await page.fill('#name', 'Teste Automático');
  await page.fill('#email', 'teste@example.com');
  await page.fill('#message', 'Mensagem de teste');

  // Enviar
  await page.click('button[type="submit"]');

  // Verificar sucesso
  await page.waitForSelector('.success-message');
  const message = await page.textContent('.success-message');

  console.log('✅ Formulário funcionando:', message);

  await browser.close();
})();
```

### Monitorar Mudanças em Site

```javascript
// monitor-website.js
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://competitor.com');

  // Pegar conteúdo atual
  const content = await page.content();

  // Comparar com versão anterior
  const previousFile = '/tmp/site-snapshot.html';
  if (fs.existsSync(previousFile)) {
    const previous = fs.readFileSync(previousFile, 'utf8');

    if (content !== previous) {
      console.log('⚠️ Site mudou! Diferenças detectadas.');
      // Enviar notificação via Telegram/WhatsApp
    } else {
      console.log('✅ Site sem mudanças.');
    }
  }

  // Salvar snapshot atual
  fs.writeFileSync(previousFile, content);

  await browser.close();
})();
```

---

## 🐛 Troubleshooting

### Erro: "browser executable not found"

**Causa:** Chromium não foi baixado

**Solução:**
```bash
# Instalar browsers do Playwright
docker exec aleffai npx playwright install chromium

# Ou todos os browsers
docker exec aleffai npx playwright install
```

### Erro: "Failed to launch browser"

**Causa:** Dependências do sistema faltando

**Solução:**
```bash
# Instalar dependências (já está no Dockerfile)
docker exec aleffai npx playwright install-deps chromium
```

### Timeout ao acessar página

**Sintoma:** `Timeout 30000ms exceeded`

**Solução:**
```javascript
// Aumentar timeout
await page.goto('https://example.com', { timeout: 60000 }); // 60s

// Ou esperar elemento específico
await page.waitForSelector('.content', { timeout: 60000 });
```

### Scraping retorna vazio

**Causa:** Conteúdo carregado via JavaScript (SPA)

**Solução:**
```javascript
// Esperar network idle (página totalmente carregada)
await page.goto('https://example.com', {
  waitUntil: 'networkidle'
});

// Ou esperar elemento específico
await page.waitForSelector('.data-loaded');
```

### Erro: "No space left on device"

**Causa:** Screenshots/PDFs encheram disco

**Solução:**
```bash
# Limpar arquivos temporários
docker exec aleffai rm -rf /tmp/*.png /tmp/*.pdf

# Ou usar directory de output específico e limpar regularmente
```

---

## 📂 Código-fonte

**Instalação via npm:**
```dockerfile
# Dockerfile linha ~XX
RUN npm install -g puppeteer playwright && \
    npx playwright install --with-deps chromium
```

**Localização:**
- Playwright: `/usr/local/lib/node_modules/playwright`
- Puppeteer: `/usr/local/lib/node_modules/puppeteer`

**Scripts (futuro):** `/app/scripts/browser-automation/`

---

## 💡 Use Cases para a Holding

### IAVANCADA (Marketing & Sales)
- **Lead scraping:** LinkedIn, Crunchbase
- **Competitor monitoring:** Preços, features, novidades
- **Social media automation:** Postar em plataformas via browser
- **Screenshot de dashboards:** Para propostas/relatórios

### AGILCONTRATOS (Carlos André)
- **Scraping de portais jurídicos:** TJSP, TJRJ, etc.
- **Monitorar publicações oficiais:** Diário Oficial
- **Automatizar buscas processuais:** CPF/CNPJ
- **Extrair jurisprudência:** Decisões relevantes

### MENTORINGBASE (Melissa)
- **Screenshots de cursos:** Para marketing
- **Testar fluxo de compra:** Automated testing
- **Scraping de competitors:** Udemy, Coursera pricing
- **Gerar previews:** PDFs de landing pages

### CFO (Financeiro)
- **Scraping bancário:** Saldos, extratos (com credenciais)
- **Monitorar boletos:** Sites de fornecedores
- **Gerar relatórios:** Dashboards → PDF
- **Automatizar pagamentos:** (com muito cuidado!)

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Playwright e Puppeteer instalados
- ✅ Chromium disponível
- ✅ Scripts Node.js funcionando

**V2 (planejado):**
- [ ] Skills customizadas prontas:
  - `competitor-monitor` - Monitorar sites de concorrentes
  - `lead-scraper` - Extrair leads de LinkedIn
  - `test-website` - Testes automáticos de sites da holding
- [ ] Integração com Aleff via Telegram
  - "Aleff, tira screenshot de iavancada.com"
  - "Aleff, monitora preços do competitor X"

**V3 (futuro):**
- [ ] Scheduler para scraping recorrente
- [ ] Alertas automáticos (mudanças detectadas)
- [ ] Dashboard de monitoramento
- [ ] Proxy rotation (anti-ban)

---

## 🎨 Exemplo Completo: Monitor de Concorrente

```javascript
#!/usr/bin/env node
// monitor-competitor.js

const { chromium } = require('playwright');
const fs = require('fs');

const COMPETITOR_URL = process.argv[2] || 'https://competitor.com/pricing';
const SNAPSHOT_FILE = '/tmp/competitor-snapshot.json';

(async () => {
  console.log(`🔍 Monitorando: ${COMPETITOR_URL}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(COMPETITOR_URL, { waitUntil: 'networkidle' });

  // Extrair dados estruturados
  const data = await page.$$eval('.pricing-plan', plans => {
    return plans.map(plan => ({
      name: plan.querySelector('.plan-name')?.textContent?.trim(),
      price: plan.querySelector('.plan-price')?.textContent?.trim(),
      features: Array.from(plan.querySelectorAll('.feature')).map(f => f.textContent.trim())
    }));
  });

  // Comparar com snapshot anterior
  let changed = false;
  if (fs.existsSync(SNAPSHOT_FILE)) {
    const previous = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));

    if (JSON.stringify(data) !== JSON.stringify(previous)) {
      console.log('⚠️  MUDANÇAS DETECTADAS!');
      console.log('Antes:', previous);
      console.log('Agora:', data);
      changed = true;

      // TODO: Enviar alerta via Telegram/WhatsApp
    } else {
      console.log('✅ Sem mudanças');
    }
  } else {
    console.log('📝 Primeiro snapshot');
  }

  // Salvar snapshot atual
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(data, null, 2));

  // Screenshot
  await page.screenshot({ path: '/tmp/competitor-screenshot.png', fullPage: true });
  console.log('📸 Screenshot salvo');

  await browser.close();

  process.exit(changed ? 1 : 0);
})();
```

**Uso:**
```bash
# Rodar manualmente
docker exec aleffai node /app/scripts/monitor-competitor.js https://competitor.com/pricing

# Ou agendar (cron)
# Rodar todo dia às 9h
0 9 * * * docker exec aleffai node /app/scripts/monitor-competitor.js https://competitor.com/pricing && echo "Mudanças detectadas!" | telegram-send
```

---

## 📚 Documentação Externa

**Playwright:**
- Docs: https://playwright.dev/docs/intro
- API Reference: https://playwright.dev/docs/api/class-playwright
- Examples: https://github.com/microsoft/playwright/tree/main/examples

**Puppeteer:**
- Docs: https://pptr.dev/
- API Reference: https://pptr.dev/api
- Examples: https://github.com/puppeteer/puppeteer/tree/main/examples

**Tutoriais:**
- Web Scraping with Playwright: https://playwright.dev/docs/scraping
- Puppeteer PDF generation: https://pptr.dev/guides/page-pdf

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Instalada e funcionando (Chromium baixado no primeiro uso)
