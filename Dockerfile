FROM node:24-alpine

WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node pm2.json ./
COPY --chown=node:node lib/cjs/ ./lib/cjs/
COPY --chown=node:node public/dist/ ./public/dist/
COPY --chown=node:node public/pictures/ ./public/pictures/
COPY --chown=node:node public/index.html ./public/index.html

RUN apk add --no-cache git
RUN npm install --omit=dev --omit=optional
RUN npm install -g pm2
RUN npm audit fix || echo 0

EXPOSE 8000
ENV PORT=8000

CMD [ "pm2-runtime", "start", "./pm2.json" ]
