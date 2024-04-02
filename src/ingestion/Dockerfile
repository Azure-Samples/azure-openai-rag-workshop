# syntax=docker/dockerfile:1

# Build Node.js app
# ------------------------------------
FROM node:20-alpine as build
WORKDIR /app
COPY ./package*.json ./
COPY ./src/ingestion ./src/ingestion
RUN npm ci --cache /tmp/empty-cache
RUN npm run build --workspace=ingestion

# Run Node.js app
# ------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ./package*.json ./
COPY ./src/ingestion/package.json ./src/ingestion/
RUN npm ci --omit=dev --workspace=ingestion --cache /tmp/empty-cache
COPY --from=build app/src/ingestion/dist src/ingestion/dist
EXPOSE 3001
CMD [ "npm", "start", "--workspace=ingestion" ]
