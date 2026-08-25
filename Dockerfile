FROM node:24-alpine

WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node pm2.json ./
COPY --chown=node:node lib/cjs/ ./lib/cjs/
COPY --chown=node:node lib/data/ ./lib/data/
COPY --chown=node:node public/dist/ ./public/dist/
COPY --chown=node:node public/pictures/ ./public/pictures/
COPY --chown=node:node public/index.html ./public/index.html
COPY --chown=node:node build/checkInstalls.js ./build/checkInstalls.js

RUN apk add --no-cache git
RUN apk add --no-cache curl
# mia-inputs / robotjs: native linux-x64 addon needs X11 (and gcompat on musl)
RUN apk add --no-cache libx11 libxtst libxinerama libxi libpng gcompat
RUN npm install --omit=dev --omit=optional
RUN npm install -g pm2
RUN npm audit fix || echo 0
RUN node ./build/checkInstalls.js

EXPOSE 8000
ENV PORT=8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD sh -c 'curl -fsS "http://127.0.0.1:${PORT:-8000}/" || exit 1'

CMD [ "pm2-runtime", "start", "./pm2.json" ]
