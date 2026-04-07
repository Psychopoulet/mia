FROM node:24-alpine

WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node pm2.json ./
COPY --chown=node:node lib/cjs/ ./lib/cjs/
COPY --chown=node:node public/dist/ ./public/dist/

RUN apk add --no-cache git
RUN npm install --omit=dev
RUN npm audit fix || echo 0

EXPOSE 8000

CMD [ "npm", "run", "start", "--", "--port", "8000" ]
