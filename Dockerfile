# Common build stage
FROM node:14.20.0-alpine3.16 as common-build-stage

WORKDIR /usr/src/app
COPY package.json ./

RUN npm install

COPY . .
RUN npm run build
RUN npm run minify


FROM common-build-stage as production-build-stage

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install --production
COPY --from=0 /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "prod"]
