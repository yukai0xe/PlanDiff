# ----------- 第一階段：建置 (Build Stage) -----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  else \
    npm ci; \
  fi

COPY . .

RUN npm run build || pnpm run build || yarn build

# ----------- 第二階段：執行 (Runtime Stage) -----------
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
