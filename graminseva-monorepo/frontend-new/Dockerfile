# frontend/Dockerfile
FROM node:20-bullseye-slim

# Accept build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set them as environment variables
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV DOCKER_RUNNING=true

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Now, when this runs, the ENV variables will be available
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]