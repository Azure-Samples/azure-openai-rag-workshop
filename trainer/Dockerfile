# syntax=docker/dockerfile:1

# Build Node.js app
# ------------------------------------
FROM node:18-alpine as build
WORKDIR /app
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./src ./src
RUN npm ci --cache /tmp/empty-cache
RUN npm run build

# Run Node.js app
# ------------------------------------
FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ./package*.json ./
RUN npm ci --omit=dev --cache /tmp/empty-cache
COPY --from=build app/dist ./dist
EXPOSE 3000
CMD [ "npm", "start" ]
