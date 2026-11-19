FROM oven/bun:1.4.5-alpine

WORKDIR /app

# copy basic files
COPY package.json bun.lock ./
COPY lib/src/ ./lib/src/
COPY public/pictures/ ./public/pictures/
COPY build/checkInstalls.js ./build/checkInstalls.js

# copy mia-core files
COPY plugins/mia-core/package.json plugins/mia-core/bun.lock ./plugins/mia-core/
COPY plugins/mia-core/lib/src/ ./plugins/mia-core/lib/src/
COPY plugins/mia-core/lib/data/ ./plugins/mia-core/lib/data/
COPY plugins/mia-core/public/dist/ ./plugins/mia-core/public/dist/
COPY plugins/mia-core/public/index.html ./plugins/mia-core/public/index.html

# install binaries
RUN apk add --no-cache git
RUN apk add --no-cache curl
# mia-inputs / robotjs: native linux-x64 addon needs X11 (and gcompat on musl)
RUN apk add --no-cache libx11 libxtst libxinerama libxi libpng gcompat
# mia-vlc-read-sound looks up `cvlc` / `vlc` on PATH at plugin init
RUN apk add --no-cache vlc
# Alpine VLC refuses to run as root (container default)
RUN sed -i 's/geteuid/getppid/' /usr/bin/vlc

# install packages
RUN bun run install-prod

# force plugins compilation for this platform
RUN bun ./build/checkInstalls.js

EXPOSE 8000
ENV PORT=8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD sh -c 'curl -fsS "http://127.0.0.1:${PORT:-8000}/" || exit 1'

CMD ["bun", "--conditions=require", "lib/src/main.cts"]
