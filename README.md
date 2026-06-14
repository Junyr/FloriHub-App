# 🌺 FloriHub — Mobile

> **Projeto acadêmico** · SENAI Fatesg · Engenharia de Software · 6º Período · 2026

App reativo do sistema PDV FloriHub para floricultura, desenvolvido com **React Native** e **Expo**.  
Este repositório é o frontend reativo com mobile e web e para o backend consulte a [FloriHub API](https://github.com/gabrielfernandesgf/floriHub-api-rest.git).

---

## 👥 Equipe

| Nome                                         |
|----------------------------------------------|
| Gabriel Fernandes Gomes Castanheira de Matos |
| João Vítor Oliveira                          |
| Willian Junior Custodio Firmo                |

---

## 📱 Sobre o projeto

O **FloriHub Mobile** é um aplicativo de Ponto de Venda (PDV) para floriculturas que permite gerenciar produtos, vendas e usuários tanto pelo celular quanto pelo computador.

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | React Native 0.83.6 |
| Plataforma | Expo SDK 55 |
| Navegação | Expo Router |
| Linguagem | TypeScript 5.9 |
| Cliente HTTP | Fetch API nativa |
| Armazenamento local | AsyncStorage |
| PDF | expo-file-system + expo-sharing |

---

## 📋 Pré-requisitos

- Node.js 18+
- Expo CLI instalado globalmente
- Android Emulator (Android Studio) ou Expo Go no celular
- Backend FloriHub rodando — siga as instruções em [floriHub-api-rest](https://github.com/gabrielfernandesgf/floriHub-api-rest.git)

---

## ⚙️ Instalação

**1. Clone o repositório**
```bash
git clone https://github.com/Junyr/FloriHub-Mobile.git
cd FloriHub-Mobile
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure a URL da API**

Abra `src/api/api.ts` e ajuste o `BASE_URL` conforme o ambiente:

```ts
const BASE_URL = Platform.OS === "web"
  ? "http://localhost:8080"    // navegador
  : "http://10.0.2.2:8080";   // emulador Android
```

> Para celular físico, substitua `10.0.2.2` pelo IP da sua máquina na rede local.

**4. Rode o projeto**
```bash
npm start
```

| Tecla | Ação |
|---|---|
| `a` | Abrir no Android Emulator |
| `i` | Abrir no iOS Simulator |
| `w` | Abrir no navegador web |
| QR Code | Escanear com o Expo Go |

---

## 🗂️ Estrutura do projeto

```
src/
├── api/
│   └── api.ts              # Todas as chamadas HTTP ao backend
├── app/
│   ├── index.tsx           # Redirecionador (verifica token JWT)
│   ├── login.tsx           # Tela de login
│   ├── dashboard.tsx       # Dashboard com métricas
│   ├── produtos.tsx        # CRUD de produtos
│   ├── vendas.tsx          # Registro e acompanhamento de vendas
│   ├── usuarios.tsx        # Gerenciamento de usuários (ADMIN)
│   └── relatorio.tsx       # Relatório de vendas com exportação PDF
├── styles/
│   └── global.ts           # Paleta de cores e tipografia
├── utils/
│   ├── helpers.ts          # Funções auxiliares (brl, parseData, etc.)
│   └── types/
│       ├── Produto.ts      # Interfaces e constantes de produto
│       ├── Venda.ts        # Interfaces e constantes de venda
│       ├── Usuario.ts      # Interfaces de usuário
│       └── Relatorio.ts    # Interfaces de relatório
└── web/
    └── index.html          # Layout web com largura fixa (390px)
```

---

## 📲 Telas disponíveis

| Tela | Descrição                                                     |
|---|---------------------------------------------------------------|
| `index` | Verifica token JWT e redireciona para login ou dashboard      |
| `login` | Autenticação com e-mail e senha                               |
| `dashboard` | Métricas de receita, vendas abertas, estoque crítico e atalhos |
| `produtos` | Catálogo com criação, edição e desativação de produtos        |
| `vendas` | Registro de vendas, filtros por status, cliente e período     |
| `usuarios` | Gerenciamento de usuários, exclusivo para ADMIN               |
| `relatorio` | Relatório com métricas, top produtos e exportação em PDF      |

---

## 🔐 Autenticação

Após o login, o token JWT é salvo no `AsyncStorage` e enviado automaticamente no header `Authorization: Bearer <token>` em todas as requisições.

```ts
headers: {
  "Content-Type": "application/json":
  ...(token && { Authorization: `Bearer ${token}` }),
}
```

---

## 👤 Controle de acesso

| Funcionalidade | VENDEDOR | ADMIN |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Produtos (visualizar) | ✅ | ✅ |
| Produtos (criar/editar/desativar) | ✅ | ✅ |
| Vendas | ✅ | ✅ |
| Usuários | ❌ | ✅ |
| Relatório | ✅ | ✅ |

---

## 📄 Exportação de PDF

O relatório de vendas pode ser exportado em PDF diretamente pelo app. O backend gera o arquivo via `GET /relatorios/vendas.pdf` e o app faz o download autenticado e abre o menu de compartilhamento.

```ts
const { uri } = await FileSystem.downloadAsync(url, destino, {
  headers: { Authorization: `Bearer ${token}` },
});
await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
```

---

## 📝 Observações

- **Soft delete:** produtos e usuários desativados são ocultados das listagens sem serem removidos do banco.
- **Snapshot de preço:** o preço registrado na venda não muda mesmo que o produto seja editado posteriormente.
- **Restauração de estoque:** ao cancelar uma venda, o estoque dos produtos é restaurado automaticamente pelo backend.
- **Emulador Android:** use `http://10.0.2.2:8080` como URL do backend — `localhost` não funciona no emulador.
- **Web:** ao rodar com `w`, o app é exibido em largura fixa de 390px centralizado na tela.