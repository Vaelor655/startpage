FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
COPY server.mjs ./server.mjs
ENV HOST=0.0.0.0 PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
