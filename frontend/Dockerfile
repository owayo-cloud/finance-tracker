# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:25 AS build-stage

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json /app/

# Install dependencies with verbose output and no progress bar for CI/CD
RUN npm ci --verbose --no-progress || npm install --verbose --no-progress

# Copy the rest of the files
COPY ./ /app/

ARG VITE_API_URL=${VITE_API_URL}
ENV VITE_API_URL=${VITE_API_URL}

# Increase Node.js memory limit for build and add timeout handling
ENV NODE_OPTIONS="--max-old-space-size=4096 --unhandled-rejections=strict"

# Build with progress output and error handling
RUN echo "Starting frontend build..." && \
    npm run build || (echo "Build failed! Exit code: $?" && exit 1) && \
    echo "Build completed successfully!"


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
