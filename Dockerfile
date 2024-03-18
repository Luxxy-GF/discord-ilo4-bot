FROM node:20-alpine

LABEL org.opencontainers.image.source = "https://github.com/Luxxy-GF/discord-ilo4-bot"

RUN mkdir -p /usr/src/ilo
WORKDIR /usr/src/ilo
COPY ./ /usr/src/ilo/

RUN npm install

CMD ["node index.js"]
