FROM node:20-alpine
WORKDIR /app

# 1. Copia apenas os arquivos de dependência primeiro
COPY package*.json ./

# 2. Instala as dependências (isso será cacheado se package.json não mudar)
RUN npm install

# 3. Copia o restante do código fonte
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]