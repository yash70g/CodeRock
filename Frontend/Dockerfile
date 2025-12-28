FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY public ./public
COPY src ./src

ARG REACT_APP_SERVER_URL=http://localhost:8080
ARG REACT_APP_SERVER_WS_URL=ws://localhost:8080
RUN echo "REACT_APP_SERVER_URL=${REACT_APP_SERVER_URL}" > .env && \
    echo "REACT_APP_SERVER_WS_URL=${REACT_APP_SERVER_WS_URL}" >> .env

RUN npm run build

FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
