# Use the official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Copy prisma directory for generation
COPY prisma ./prisma

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN bunx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 4001

# Start the application
CMD ["bun", "run", "src/start.ts"]
