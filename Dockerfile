# Use official Node 22 LTS image
FROM node:22-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy app source
COPY . .

# Build the project (creates ./dist)
RUN yarn build

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]
