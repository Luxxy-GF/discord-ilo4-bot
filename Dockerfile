FROM node:20-alpine

RUN mkdir -p /usr/src/ilo
WORKDIR /usr/src/ilo
COPY ./ /usr/src/ilo/

RUN npm install

CMD ["node index.js"]
