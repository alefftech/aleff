# 🖼️ Canvas

> **Exibe HTML interativo em devices conectados (Mac/iOS/Android)**
> **Status:** ✅ Ativa
> **Tipo:** Feature nativa (Moltbot)

---

## 🎯 O Que É

Sistema nativo do Moltbot que permite exibir conteúdo HTML interativo em dispositivos conectados (Mac app, iOS, Android).

**Capacidades:**
- Exibir dashboards HTML ao vivo
- Jogos e visualizações interativas
- Demos e apresentações
- Gráficos e charts dinâmicos
- Formulários customizados
- WebViews completas

**Analogia:** É como ter uma "tela extra" que pode mostrar qualquer conteúdo web que você criar.

---

## 🎨 Por Que Foi Criada

**Problema original:**
- Dashboards complexos difíceis de mostrar no Telegram
- Visualizações interativas limitadas a imagens estáticas
- Demos de produtos precisam de tela grande
- Difícil compartilhar HTML rico via chat

**Solução:**
- Renderizar HTML completo em dispositivos conectados
- Interatividade total (JavaScript, CSS, WebGL)
- Live reload automático durante desenvolvimento
- Comunicação bidirecional (canvas ↔ Aleff)

---

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Canvas Host    │────▶│   Node Bridge    │────▶│  Device App │
│  (HTTP Server)  │     │  (TCP Server)    │     │ (Mac/iOS/   │
│  Port 18793     │     │  Port 18790      │     │  Android)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

1. **Canvas Host:** Serve arquivos HTML do diretório `canvasHost.root`
2. **Node Bridge:** Comunica URLs para dispositivos conectados
3. **Device Apps:** Renderizam conteúdo em WebView

---

## 🚀 Como Usar

### 1. Criar Conteúdo HTML

```bash
# Diretório padrão: ~/clawd/canvas/
mkdir -p ~/clawd/canvas
cat > ~/clawd/canvas/dashboard.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dashboard Holding</title>
    <style>
        body {
            font-family: Arial;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .card {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            margin: 20px 0;
            border-radius: 10px;
        }
        .metric {
            font-size: 48px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>🦞 IAVANCADA Dashboard</h1>

    <div class="card">
        <h2>Faturamento Mensal</h2>
        <div class="metric">R$ 120.000</div>
    </div>

    <div class="card">
        <h2>Clientes Ativos</h2>
        <div class="metric">42</div>
    </div>

    <div class="card">
        <h2>Projetos em Andamento</h2>
        <div class="metric">8</div>
    </div>

    <script>
        // Atualizar em tempo real
        setInterval(() => {
            document.querySelector('.metric').textContent =
                'R$ ' + (Math.random() * 200000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }, 3000);
    </script>
</body>
</html>
EOF
```

### 2. Listar Dispositivos Conectados

```
canvas list-nodes
```

Ou via API:
```bash
curl http://localhost:18789/api/nodes
```

### 3. Apresentar Canvas

```
canvas action:present node:<node-id> target:http://localhost:18793/__moltbot__/canvas/dashboard.html
```

**Exemplo:**
```
canvas action:present node:mac-63599bc4 target:http://localhost:18793/__moltbot__/canvas/dashboard.html
```

### 4. Navegar/Ocultar

```
# Navegar para outra URL
canvas action:navigate node:<node-id> url:http://localhost:18793/__moltbot__/canvas/outro.html

# Tirar screenshot
canvas action:snapshot node:<node-id>

# Ocultar canvas
canvas action:hide node:<node-id>

# Executar JavaScript
canvas action:eval node:<node-id> script:"alert('Hello!')"
```

---

## ⚙️ Configuração

### moltbot.json

```json
{
  "canvasHost": {
    "enabled": true,
    "port": 18793,
    "root": "/home/node/clawd/canvas",
    "liveReload": true
  },
  "gateway": {
    "bind": "auto"  // ou "loopback", "lan", "tailnet"
  }
}
```

**Live Reload:** Quando `liveReload: true`, mudanças nos arquivos HTML recarregam automaticamente o canvas.

---

## 🔍 Comandos Úteis

### Verificar Canvas Host

```bash
# Ver se servidor está rodando
docker exec aleffai lsof -i :18793

# Testar diretamente
curl http://localhost:18793/__moltbot__/canvas/
```

### Criar Canvas Dinâmico

```html
<!-- metrics.html -->
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <canvas id="chart" width="800" height="400"></canvas>

    <script>
        // Gráfico em tempo real
        const ctx = document.getElementById('chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Faturamento',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Atualizar dados a cada 2 segundos
        setInterval(() => {
            const now = new Date().toLocaleTimeString();
            const value = Math.random() * 100000;

            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(value);

            // Manter apenas últimos 10 pontos
            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }

            chart.update();
        }, 2000);
    </script>
</body>
</html>
```

---

## 🐛 Troubleshooting

### Canvas não aparece (tela branca)

**Causa:** URL incorreta ou servidor não acessível

**Debug:**
```bash
# 1. Verificar bind mode
cat /data/moltbot.json | jq '.gateway.bind'

# 2. Testar URL diretamente
curl http://localhost:18793/__moltbot__/canvas/dashboard.html

# 3. Ver logs do container
docker logs aleffai | grep canvas
```

**Solução:** Usar hostname correto baseado no bind mode.

### Live reload não funciona

**Causa:** `liveReload: false` ou watcher não iniciou

**Solução:**
```json
{
  "canvasHost": {
    "liveReload": true  // Garantir que está true
  }
}
```

Restart container após mudança.

### Node não conecta

**Sintoma:** `node not connected` error

**Causa:** Device app offline ou não registrado

**Solução:**
1. Abrir Moltbot app no Mac/iOS/Android
2. Conectar ao servidor (porta 18790)
3. Listar nodes: `canvas list-nodes`

### Imagens não carregam

**Causa:** Caminhos relativos incorretos

**Solução:**
```html
<!-- Usar caminhos relativos ao canvas root -->
<img src="logo.png">  <!-- /home/node/clawd/canvas/logo.png -->

<!-- Ou absolutos -->
<img src="/__moltbot__/canvas/images/logo.png">
```

---

## 📂 Estrutura de Arquivos

```
/home/node/clawd/canvas/          # Canvas root
├── index.html                     # Página padrão
├── dashboard.html                 # Dashboard customizado
├── game.html                      # Jogo/demo
├── assets/
│   ├── logo.png
│   ├── style.css
│   └── script.js
└── charts/
    └── metrics.html
```

**URLs:**
- `http://host:18793/__moltbot__/canvas/index.html`
- `http://host:18793/__moltbot__/canvas/dashboard.html`
- `http://host:18793/__moltbot__/canvas/charts/metrics.html`

---

## 💡 Use Cases para a Holding

### IAVANCADA (Dashboards)
- **Dashboard executivo:** Métricas em tempo real
- **Demos para clientes:** Apresentações interativas
- **Monitoramento de projetos:** Status visual

### MENTORINGBASE (Melissa)
- **Preview de cursos:** Navegar estrutura do curso
- **Analytics:** Visualizar engajamento de alunos
- **Player customizado:** Testar vídeos antes de publicar

### AGILCONTRATOS (Carlos André)
- **Timeline de contratos:** Visualizar prazos
- **Dashboard jurídico:** Status de processos
- **Ferramentas interativas:** Calculadoras, simuladores

### CFO (Financeiro)
- **Dashboard financeiro:** Faturamento, despesas, lucro
- **Gráficos de fluxo de caixa:** Tempo real
- **Relatórios interativos:** Drill-down em métricas

---

## 🚀 Evolução Futura

**V1 (atual):**
- ✅ Canvas host funcionando
- ✅ Live reload ativo
- ✅ Suporte a HTML/CSS/JS completo

**V2 (planejado):**
- [ ] Templates prontos para a holding
  - Dashboard executivo IAVANCADA
  - Analytics MENTORINGBASE
  - Timeline AGILCONTRATOS
  - Financeiro CFO
- [ ] Integração com Supabase (dados reais)
- [ ] Autenticação para canvases privados

**V3 (futuro):**
- [ ] Editor visual de canvases
- [ ] Componentes reutilizáveis
- [ ] Comunicação bidirecional (canvas ↔ Aleff via WebSocket)
- [ ] Multi-canvas (vários ao mesmo tempo)

---

## 🎨 Exemplo Completo: Dashboard Executivo

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>IAVANCADA - Dashboard Executivo</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 30px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 32px;
        }

        .time {
            font-size: 18px;
            opacity: 0.7;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }

        .card h3 {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 10px;
        }

        .card .value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .card .change {
            font-size: 14px;
        }

        .change.positive {
            color: #10b981;
        }

        .change.negative {
            color: #ef4444;
        }

        .chart-container {
            background: #1e293b;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🦞 IAVANCADA - Dashboard Executivo</h1>
        <div class="time" id="time"></div>
    </div>

    <div class="grid">
        <div class="card">
            <h3>Faturamento Mensal</h3>
            <div class="value">R$ <span id="revenue">0</span></div>
            <div class="change positive">↑ +15% vs mês anterior</div>
        </div>

        <div class="card">
            <h3>Clientes Ativos</h3>
            <div class="value"><span id="clients">0</span></div>
            <div class="change positive">↑ +3 novos</div>
        </div>

        <div class="card">
            <h3>Projetos em Andamento</h3>
            <div class="value"><span id="projects">0</span></div>
            <div class="change">5 finalizados este mês</div>
        </div>

        <div class="card">
            <h3>Taxa de Sucesso</h3>
            <div class="value"><span id="success">0</span>%</div>
            <div class="change positive">↑ +2%</div>
        </div>
    </div>

    <div class="chart-container">
        <canvas id="revenueChart"></canvas>
    </div>

    <script>
        // Atualizar hora
        function updateTime() {
            document.getElementById('time').textContent =
                new Date().toLocaleString('pt-BR');
        }
        updateTime();
        setInterval(updateTime, 1000);

        // Animar números
        function animateValue(id, start, end, duration) {
            const obj = document.getElementById(id);
            const range = end - start;
            const increment = range / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                    current = end;
                    clearInterval(timer);
                }
                obj.textContent = Math.floor(current).toLocaleString('pt-BR');
            }, 16);
        }

        // Valores de exemplo
        animateValue('revenue', 0, 120000, 2000);
        animateValue('clients', 0, 42, 1500);
        animateValue('projects', 0, 8, 1000);
        animateValue('success', 0, 94, 2000);

        // Gráfico de faturamento
        const ctx = document.getElementById('revenueChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Faturamento (R$ mil)',
                    data: [65, 78, 90, 105, 112, 120],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: '#334155'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: '#334155'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
```

---

## 📚 Documentação Externa

**Moltbot Canvas:**
- Docs: (ver `/skills/canvas/SKILL.md`)
- Architecture: Integrado nativamente

**Web Technologies:**
- HTML5: https://developer.mozilla.org/en-US/docs/Web/HTML
- CSS3: https://developer.mozilla.org/en-US/docs/Web/CSS
- Chart.js: https://www.chartjs.org/

---

**Criado:** 2026-01-29
**Última atualização:** 2026-01-29
**Autor:** CTO Ronald + Claude Code
**Versão:** 1.0.0
**Status:** ✅ Nativa e funcionando
