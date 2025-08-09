FROM node:20-alpine
WORKDIR /app
# Copy dependency manifests first for layer caching
COPY package.json ./
# Copy lock file if present (separate so build doesn't fail when absent)
# These will be ignored if they don't exist
COPY package-lock.json* ./  
COPY pnpm-lock.yaml* ./  
COPY yarn.lock* ./  
RUN npm install --legacy-peer-deps
# Copy rest of app
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host"]
