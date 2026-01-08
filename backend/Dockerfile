FROM node:lts-alpine3.17

WORKDIR /app

COPY package*.json ./

# RUN apk add --no-cache openssl libc6-compat

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
