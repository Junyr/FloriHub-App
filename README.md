# 🌺 FloriHub — App

> **Projeto acadêmico** · SENAI Fatesg · Engenharia de Software · 6º Período · 2026

Aplicativo **cross-platform** de Ponto de Venda (PDV) para floricultura, desenvolvido com **React Native** e **Expo**. Roda no celular (Android/iOS) e no navegador web a partir do mesmo código-fonte.

Para o backend consulte a [FloriHub API](https://github.com/gabrielfernandesgf/floriHub-api-rest.git).

---

## 👥 Equipe

| Nome                                         |
|----------------------------------------------|
| Gabriel Fernandes Gomes Castanheira de Matos |
| João Vítor Oliveira                          |
| Willian Junior Custorio Firmo                |

---

## 📱 Sobre o projeto

O **FloriHub App** permite gerenciar produtos, vendas, usuários e relatórios de uma floricultura em qualquer dispositivo. O mesmo projeto roda no celular via **Expo Go** ou build nativo, e no navegador via **Expo Web** — sem necessidade de projetos separados.

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
| PDF (mobile) | expo-file-system/legacy + expo-sharing |
| PDF (web) | Fetch + download via `<a>` |

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

O projeto detecta automaticamente o ambiente — nenhuma configuração necessária para o emulador Android ou navegador web. Para **celular físico**, abra `src/api/api.ts` e substitua `10.0.2.2` pelo IP da sua máquina na rede local:

```ts
const BASE_URL = Platform.OS === "web"
  ? "http://localhost:8080"        // navegador web
  : "http://SEU_IP_LOCAL:8080";   // celular físico
```

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
│   ├── dashboard.tsx       # Dashboard com métricas e atalhos
│   ├── produtos.tsx        # CRUD de produtos (grid no web)
│   ├── vendas.tsx          # Registro e acompanhamento de vendas
│   ├── usuarios.tsx        # Gerenciamento de usuários (ADMIN)
│   └── relatorio.tsx       # Relatório de vendas com exportação PDF
├── components/
│   └── ConfirmModal.tsx    # Modal de confirmação reutilizável
├── styles/
│   └── global.ts           # Paleta de cores e tipografia
├── utils/
│   ├── helpers.ts          # Funções auxiliares (brl, parseData, mascaraData, etc.)
│   └── types/
│       ├── Produto.ts      # Interfaces e constantes de produto
│       ├── Venda.ts        # Interfaces e constantes de venda
│       ├── Usuario.ts      # Interfaces de usuário
│       └── Relatorio.ts    # Interfaces de relatório
└── web/
    └── index.html          # Layout web com largura fixa centralizada
```

---

## 📲 Telas disponíveis

| Tela | Descrição |
|---|---|
| `index` | Verifica token JWT e redireciona para login ou dashboard |
| `login` | Autenticação com e-mail e senha |
| `dashboard` | Métricas de receita, vendas abertas, estoque crítico e atalhos de navegação |
| `produtos` | Catálogo com criação, edição e desativação — grid de 3 colunas no web |
| `vendas` | Registro de vendas, filtros por status, busca por cliente e período |
| `usuarios` | Gerenciamento de usuários — exclusivo para ADMIN, grid no web |
| `relatorio` | Relatório com métricas e top produtos, exportação em PDF |

---

## 🔐 Autenticação

Após o login, o token JWT é salvo no `AsyncStorage` e enviado automaticamente no header `Authorization: Bearer <token>` em todas as requisições. Tokens expirados redirecionam automaticamente para o login.

```ts
headers: {
  "Content-Type": "application/json",
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
| Vendas (próprias) | ✅ | ✅ |
| Vendas (todas) | ❌ | ✅ |
| Usuários | ❌ | ✅ |
| Relatório | ✅ | ✅ |

---

## 📄 Exportação de PDF

O relatório de vendas pode ser exportado em PDF com filtros de período e status. O comportamento varia por plataforma:

**Mobile** — download autenticado via `expo-file-system` e compartilhamento nativo:
```ts
const { uri } = await FileSystem.downloadAsync(url, destino, {
  headers: { Authorization: `Bearer ${token}` },
});
await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
```

**Web** — download direto via fetch e `<a download>`:
```ts
const blob = await response.blob();
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "relatorio-florihub.pdf";
link.click();
```

---

## 📝 Observações

- **Cross-platform:** o mesmo código roda no Android, iOS e navegador web sem alterações.
- **Grid responsivo:** telas de produtos e usuários exibem 3 colunas no web e 1 coluna no mobile.
- **Soft delete:** produtos e usuários desativados são ocultados das listagens sem serem removidos do banco.
- **Snapshot de preço:** o preço registrado na venda não muda mesmo que o produto seja editado posteriormente.
- **Restauração de estoque:** ao cancelar uma venda, o estoque dos produtos é restaurado automaticamente pelo backend.
- **Emulador Android:** usa `http://10.0.2.2:8080` automaticamente — `localhost` não funciona no emulador.
- **Sessão expirada:** token JWT expirado redireciona automaticamente para o login sem mostrar erro.