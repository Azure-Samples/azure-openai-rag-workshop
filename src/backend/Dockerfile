# syntax=docker/dockerfile:1

# Build Node.js app
# ------------------------------------
FROM node:18-alpine as build
WORKDIR /app
COPY ./package*.json ./
COPY ./packages/backend ./packages/backend
RUN npm ci --cache /tmp/empty-cache
RUN npm run build --workspace=backend

# Run Node.js app
# ------------------------------------
FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ./package*.json ./
COPY ./packages/backend/package.json ./packages/backend/
RUN npm ci --omit=dev --workspace=backend --cache /tmp/empty-cache
COPY --from=build app/packages/backend/dist packages/backend/dist
EXPOSE 3000
CMD [ "npm", "start", "--workspace=backend" ]
