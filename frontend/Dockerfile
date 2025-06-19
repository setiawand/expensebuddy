# Build stage
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=build /app .
EXPOSE 3001
CMD ["npm", "start"]
