# backend/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-bullseye-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Your app binds to port 5001, so expose it
EXPOSE 5001

# Define the command to run your app
CMD ["node", "index.js"]