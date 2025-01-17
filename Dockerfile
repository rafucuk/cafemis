# syntax = docker/dockerfile:1.4

ARG NODE_VERSION=22.11.0-alpine3.20

FROM node:${NODE_VERSION} as build

RUN apk add git linux-headers build-base

ENV PYTHONUNBUFFERED=1
RUN apk add --update python3 && ln -sf python3 /usr/bin/python
RUN apk add py3-pip py3-setuptools

RUN corepack enable

WORKDIR /cafemis

COPY --link . ./

RUN git submodule update --init --recursive
RUN pnpm config set fetch-retries 5
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
	pnpm i --frozen-lockfile --aggregate-output
RUN pnpm build
RUN node scripts/trim-deps.mjs
RUN mv packages/frontend/assets cafemis-assets
RUN mv packages/frontend-embed/assets cafemis-embed-assets
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
	pnpm prune
RUN rm -r node_modules packages/frontend packages/frontend-shared packages/frontend-embed packages/sw
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
	pnpm i --prod --frozen-lockfile --aggregate-output
RUN rm -rf .git

FROM node:${NODE_VERSION}

ARG UID="991"
ARG GID="991"

RUN apk add ffmpeg tini jemalloc \
	&& corepack enable \
	&& addgroup -g "${GID}" cafemis \
	&& adduser -D -u "${UID}" -G cafemis -h /cafemis cafemis \
	&& mkdir /cafemis/files \
	&& chown cafemis:cafemis /cafemis/files \
	&& find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /u+s -exec chmod u-s {} \; \
	&& find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /g+s -exec chmod g-s {} \;

USER cafemis
WORKDIR /cafemis

# add package.json to add pnpm
COPY --chown=cafemis:cafemis ./package.json ./package.json
RUN corepack install

COPY --chown=cafemis:cafemis --from=build /cafemis/node_modules ./node_modules
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/backend/node_modules ./packages/backend/node_modules
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/misskey-js/node_modules ./packages/misskey-js/node_modules
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/misskey-reversi/node_modules ./packages/misskey-reversi/node_modules
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/misskey-bubble-game/node_modules ./packages/misskey-bubble-game/node_modules
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/megalodon/node_modules ./packages/megalodon/node_modules
COPY --chown=cafemis:cafemis --from=build /cafemis/built ./built
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/misskey-js/built ./packages/misskey-js/built
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/misskey-reversi/built ./packages/misskey-reversi/built
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/misskey-bubble-game/built ./packages/misskey-bubble-game/built
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/backend/built ./packages/backend/built
COPY --chown=cafemis:cafemis --from=build /cafemis/packages/megalodon/lib ./packages/megalodon/lib
COPY --chown=cafemis:cafemis --from=build /cafemis/fluent-emojis ./fluent-emojis
COPY --chown=cafemis:cafemis --from=build /cafemis/tossface-emojis/dist ./tossface-emojis/dist
COPY --chown=cafemis:cafemis --from=build /cafemis/cafemis-assets ./packages/frontend/assets
COPY --chown=cafemis:cafemis --from=build /cafemis/cafemis-embed-assets ./packages/frontend-embed/assets

COPY --chown=cafemis:cafemis pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --chown=cafemis:cafemis packages/backend/package.json ./packages/backend/package.json
COPY --chown=cafemis:cafemis packages/backend/scripts/check_connect.js ./packages/backend/scripts/check_connect.js
COPY --chown=cafemis:cafemis packages/backend/ormconfig.js ./packages/backend/ormconfig.js
COPY --chown=cafemis:cafemis packages/backend/migration ./packages/backend/migration
COPY --chown=cafemis:cafemis packages/backend/assets ./packages/backend/assets
COPY --chown=cafemis:cafemis packages/megalodon/package.json ./packages/megalodon/package.json
COPY --chown=cafemis:cafemis packages/misskey-js/package.json ./packages/misskey-js/package.json
COPY --chown=cafemis:cafemis packages/misskey-reversi/package.json ./packages/misskey-reversi/package.json
COPY --chown=cafemis:cafemis packages/misskey-bubble-game/package.json ./packages/misskey-bubble-game/package.json

ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "run", "migrateandstart"]
