# Use a imagem oficial do Node.js para a etapa de construção
FROM node:16-alpine as build

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale as dependências do projeto
RUN npm ci

# Copie os arquivos de código fonte
COPY . .

# Gere o cliente Prisma
RUN npx prisma generate

# Construa o aplicativo
RUN npm run build

# Use a imagem oficial do Node.js para a etapa de execução
FROM node:16-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale apenas as dependências de produção
RUN npm ci --only=production

# Copie os arquivos de construção do estágio de construção
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

ENV DATABASE_URL="postgresql://neondb_owner:JgnFV0QKvot7@ep-sweet-glitter-a5qf2a17.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Execute as migrações do Prisma
RUN npx prisma migrate deploy

# Exponha a porta que o aplicativo usa
EXPOSE 3000

# Defina o comando para iniciar o aplicativo
CMD ["node", "dist/main.js"]
