# VPN dev-04 (WireGuard)

Acesso VPN direto ao dev-04 para o Founder.

## Endpoint

```
Server: 178.156.214.14:51820
Network: 10.10.10.0/24
DNS: 10.10.10.1
```

## Domínios Internos

| Domínio | IP | Serviço |
|---------|-----|---------|
| aleffai.abckx.corp | 172.20.0.3 | Aleff AI Gateway |
| dev04.abckx.corp | 10.10.10.1 | VPN Server |

## Config Cliente (Founder)

Salvar como `dev04.conf` e importar no WireGuard app:

```ini
[Interface]
PrivateKey = AAfIm5AQaLXmNdXoU1ST+mWeT7YWmoL6c1/89R9jrmM=
Address = 10.10.10.2/32
DNS = 10.10.10.1

[Peer]
PublicKey = tFDyhGZdNS2caqCESRmziTt/WmUVK1NBBTJSrpyhvkY=
Endpoint = 178.156.214.14:51820
AllowedIPs = 10.10.10.0/24, 172.20.0.0/24
PersistentKeepalive = 25
```

## Testar Conexão

```bash
# Ping VPN gateway
ping 10.10.10.1

# Ping Aleff container
ping 172.20.0.3

# DNS resolution
ping aleffai.abckx.corp

# Acesso HTTP
curl http://aleffai.abckx.corp:18789
```

## Adicionar Novo Peer

```bash
# No servidor
cd /opt/wireguard

# Gerar keys
wg genkey | tee peer2_private.key | wg pubkey > peer2_public.key

# Adicionar ao wg0.conf
cat >> wg0.conf << EOF

[Peer]
# Nome do Peer
PublicKey = $(cat peer2_public.key)
AllowedIPs = 10.10.10.3/32
EOF

# Reiniciar
docker compose restart
```

## Adicionar Novo Domínio

```bash
# Editar hosts.corp
echo "172.20.0.X novo.abckx.corp" >> /opt/wireguard/hosts.corp

# Reiniciar para aplicar
docker compose restart
```

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        dev-04                                │
│                   178.156.214.14                             │
│                                                              │
│  ┌─────────────────┐     ┌─────────────────┐                │
│  │  WireGuard      │     │   Docker        │                │
│  │  :51820/udp     │     │   Networks      │                │
│  │                 │     │                 │                │
│  │  wg0:           │     │  aleff_default: │                │
│  │  10.10.10.1     │────▶│  172.20.0.0/24  │                │
│  │                 │     │                 │                │
│  │  dnsmasq:       │     │  ┌───────────┐  │                │
│  │  DNS interno    │     │  │ aleffai   │  │                │
│  └─────────────────┘     │  │ 172.20.0.3│  │                │
│                          │  └───────────┘  │                │
│                          └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
            ▲
            │ WireGuard Tunnel
            │
┌───────────┴───────────┐
│  Cliente (Mac/iOS)    │
│  10.10.10.2           │
│  DNS: 10.10.10.1      │
└───────────────────────┘
```
