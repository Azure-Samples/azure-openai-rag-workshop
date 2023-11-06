# syntax=docker/dockerfile:1

# Build Node.js app
# ------------------------------------
FROM node:18-alpine as build
WORKDIR /app
COPY ./package*.json ./
COPY ./src/indexer ./src/indexer
RUN npm ci --cache /tmp/empty-cache
RUN npm run build --workspace=indexer

# Run Node.js app
# ------------------------------------
FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ./package*.json ./
COPY ./src/indexer/package.json ./src/indexer/
RUN npm ci --omit=dev --workspace=indexer --cache /tmp/empty-cache
COPY --from=build app/src/indexer/dist src/indexer/dist
EXPOSE 3001
CMD [ "npm", "start", "--workspace=indexer" ]
