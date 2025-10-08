# Build pgloader for ARM64 (Apple Silicon)
FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y \
    pgloader \
    postgresql-client \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /work

# Default command
ENTRYPOINT ["pgloader"]
