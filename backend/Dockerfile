FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN apt-get update -y && apt-get install -y openssl

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "npm run db:deploy && npm run start:prod"]
