FROM python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install system dependencies including supervisor and Node.js for MJML
RUN apt-get update && apt-get install -y \
    supervisor \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g mjml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create log directories for supervisor
RUN mkdir -p /var/log/supervisor && chmod -R 755 /var/log/supervisor

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

COPY ./scripts /app/scripts

COPY ./pyproject.toml ./uv.lock ./alembic.ini /app/

COPY ./app /app/app
COPY ./tests /app/tests

# Copy supervisor configuration
COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./scheduler.py /app/scheduler.py

# Build MJML email templates to HTML
RUN mkdir -p /app/app/email-templates/build && \
    for file in /app/app/email-templates/src/*.mjml; do \
        mjml "$file" -o "/app/app/email-templates/build/$(basename "$file" .mjml).html"; \
    done

# Sync the project
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]