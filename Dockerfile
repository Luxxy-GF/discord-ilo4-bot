FROM node:20-alpine

LABEL org.opencontainers.image.source = "https://github.com/Luxxy-GF/discord-ilo4-bot"

RUN mkdir -p /usr/src/ilo
WORKDIR /usr/src/ilo
COPY ./ /usr/src/ilo/

RUN apk add --no-cache python3 make g++
RUN npm install --global node-gyp
RUN npm install

CMD ["node index.js"]
