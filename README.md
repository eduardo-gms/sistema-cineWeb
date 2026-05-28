## 🚀 Como Executar Localmente

### Pré-requisitos
*   [Git](https://git-scm.com/)
*   [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
*   [Node.js](https://nodejs.org/) (Apenas para rodar o Mobile localmente)

### Passo a Passo

1.  **Clone o repositório com os submódulos:**
    Como este repositório usa Git Submodules, você deve cloná-lo com a flag `--recursive` para baixar o código dos repositórios filhos automaticamente.
    ```bash
    git clone --recursive https://github.com/eduardo-gms/sistema-cineWeb.git
    cd sistema-cineWeb
    ```
    *(Se você já clonou sem a flag, rode: `git submodule update --init --recursive`)*

2.  **Configure as Variáveis de Ambiente:**
    Crie o arquivo `.env` na raiz do projeto baseado no exemplo fornecido.
    ```bash
    cp .env.example .env
    ```

3.  **Inicie os Serviços (Backend, Frontend e Banco de Dados):**
    ```bash
    docker-compose up -d --build
    ```
    *   O Backend estará disponível em: `http://localhost:3000`
    *   O Frontend estará disponível em: `http://localhost:5173`

4.  **Inicie o Aplicativo Mobile:**
    Recomenda-se rodar o mobile fora do Docker para facilitar a comunicação com o Expo Go no seu celular físico.
    ```bash
    cd sistema-cineWeb-mobile
    npm install
    npm start
    ```

---

## ☁️ Como Executar no GitHub Codespaces

O GitHub Codespaces é um ambiente de desenvolvimento em nuvem perfeito para este projeto, pois já vem com Docker, Node.js e Git configurados.

### Passo 1: Criar o Codespace
1.  Acesse este repositório no GitHub.
2.  Clique no botão verde **Code** > aba **Codespaces** > **Create codespace on main**.
3.  Aguarde o VS Code no navegador carregar (pode levar alguns minutos na primeira vez).

### Passo 2: Inicializar os Submódulos
Por padrão, o Codespaces clona o repositório, mas pode não inicializar os submódulos dependendo da sua configuração global. No terminal do Codespace, execute:
```bash
git submodule update --init --recursive
```

### Passo 3: Configurar Variáveis e Subir o Docker
```bash
cp .env.example .env
docker-compose up -d --build
```

### Passo 4: Configurar o Encaminhamento de Portas (Port Forwarding)
Para que o Frontend Web e o aplicativo Mobile consigam se comunicar com o Backend rodando na nuvem, você precisa ajustar a visibilidade das portas no Codespaces:
1.  No painel inferior do VS Code, clique na aba **Ports** (Portas).
2.  Você verá as portas `3000` (Backend) e `5173` (Frontend) ativas.
3.  **MUITO IMPORTANTE:** Clique com o botão direito na porta `3000` (Backend), vá em **Port Visibility** (Visibilidade da Porta) e altere de `Private` para **`Public`**. 
    *   *Nota: Sem fazer isso, o Frontend e o Mobile não conseguirão fazer requisições para a API devido às regras de CORS e autenticação do GitHub.*
4.  O GitHub gerará URLs públicas para essas portas (ex: `https://orange-robot-xxyyzz-3000.app.github.dev`).

### Passo 5: Executar o Mobile no Codespaces (Acesso via Expo Go)
1. Abra um novo terminal integrado no Codespace.
2. Navegue até a pasta mobile: `cd sistema-cineWeb-mobile`
3. Instale as dependências: `npm install`
4. Altere a URL da API no código do Mobile (`src/services/api.ts` ou `.env` do mobile) para a **URL Pública do Backend** gerada pelo Codespaces no Passo 4 (não use `localhost`).
5. Inicie o Expo: `npx expo start --tunnel`
    *   *Nota: A flag `--tunnel` é crucial em ambientes de nuvem. Ela gera um QR Code roteado via ngrok, permitindo que você escaneie o código com o app Expo Go no seu celular físico (em qualquer rede) e acesse a aplicação sendo desenvolvida no Codespaces.*

---

## ⚠️ Erros Comuns e Boas Práticas

*   **Submódulos Desatualizados:** Se outros desenvolvedores (ou você mesmo) atualizarem o backend/frontend/mobile nos repositórios originais, o repositório pai não puxará essas alterações automaticamente. Para atualizar todos os filhos para o último commit, rode:
    ```bash
    git submodule update --remote
    ```
*   **Problemas de CORS no Codespaces:** Sempre verifique se a porta `3000` está marcada como **Pública** na aba de portas. Se estiver privada, o frontend receberá um erro de conexão (`Network Error`).
*   **Não comite o `.env`:** O arquivo `.env` está ignorado globalmente para segurança. Atualize apenas o `.env.example` caso adicione novas variáveis ao sistema.
README.md
A apresentar README.md.
