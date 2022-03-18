FROM node:17-slim

ARG APP_NAME=spotify-radio
ARG HOME=/home/node

RUN apt-get update \
  && apt-get install sox libsox-fmt-mp3 -y
  #libsox-fmt-all
USER node

RUN mkdir -p ${HOME}/${APP_NAME}

WORKDIR ${HOME}/${APP_NAME}

ENV NPM_CONFIG_PREFIX=$HOME/.npm-global
# allow npx executions like jest to work
ENV PATH=$PATH:$HOME/.npm-global/bin

COPY package*.json ./

RUN npm ci --silent

COPY --chown=node:node . .

CMD npm start