FROM node:alpine3.18
WORKDIR /app
COPY package.json .
RUN npm i -g pnpm
RUN pnpm install
COPY . .
CMD ["pnpm", "start"]