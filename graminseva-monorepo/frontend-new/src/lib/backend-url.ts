/**
 * Get the correct backend URL based on the environment.
 * - In Docker containers: use the service name 'backend' + internal port 5001
 * - Locally or custom: use NEXT_PUBLIC_BACKEND_URL (defaults to localhost:5001)
 */
export function getBackendUrl(): string {
  // Check if running in Docker by looking for Docker-specific env variables
  // or checking if we're running as a Next.js server (node process)
  const isDocker = process.env.DOCKER_RUNNING === 'true' || process.env.NODE_ENV === 'production'
  
  if (isDocker) {
    // Inside Docker Compose, use the service name 'backend' and internal port 5001
    return 'http://backend:5001'
  }
  
  // For local development, use NEXT_PUBLIC_BACKEND_URL or default
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'
}
