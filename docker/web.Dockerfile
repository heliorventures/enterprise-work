FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:3001/api
ARG VITE_WS_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN npm install
COPY . .
RUN npm run build -w @wmp/web

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
