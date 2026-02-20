
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5300
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
