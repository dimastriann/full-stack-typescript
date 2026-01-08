FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN apt-get update -y && apt-get install -y openssl

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
