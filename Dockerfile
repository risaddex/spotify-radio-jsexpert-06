FROM node:17-slim

RUN apt-get update \
  && apt-get install sox libsox-fmt-mp3 -y
  #libsox-fmt-all

WORKDIR /spotify-radio

COPY package*.json ./

RUN npm ci --silent

COPY . .

USER node

CMD npm start