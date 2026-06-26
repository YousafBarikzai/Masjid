FROM node:20-slim

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Railway provides PORT; this is just a default for local runs.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
