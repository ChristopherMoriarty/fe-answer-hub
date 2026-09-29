FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm install --no-save @rolldown/binding-linux-x64-gnu

COPY . .

ARG VITE_API_URL=
ARG VITE_ACCESS_TOKEN_KEY=answer-hub.access-token
ARG VITE_REFRESH_TOKEN_KEY=answer-hub.refresh-token
ENV VITE_API_URL=$VITE_API_URL \
    VITE_ACCESS_TOKEN_KEY=$VITE_ACCESS_TOKEN_KEY \
    VITE_REFRESH_TOKEN_KEY=$VITE_REFRESH_TOKEN_KEY

RUN npm run build

FROM nginx:1.28-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
