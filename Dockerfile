# Common build stage
FROM node:14.20-alpine3.16

WORKDIR /usr/src/app
COPY package.json ./

RUN npm install

COPY . .
RUN npm run build
RUN npm run minify


FROM node:14.20-alpine3.16

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install --only=prod
RUN npm install -g cross-env

COPY --from=0 /usr/src/app/dist ./dist
COPY --from=0 /usr/src/app/build/swagger.json ./dist/swagger.json

ENV LOG_DIR=/tmp/logs
EXPOSE 3000

CMD npm run prod
