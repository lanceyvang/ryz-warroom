FROM node:22-alpine

WORKDIR /app
COPY server.mjs ./
COPY site ./site

ENV PORT=5129
EXPOSE 5129

USER node
CMD ["node", "server.mjs"]
