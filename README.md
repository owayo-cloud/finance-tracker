# Full Stack FastAPI Project



## Technology Stack and Features

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) for the Python backend API.
    - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) for the Python SQL database interactions (ORM).
    - 🔍 [Pydantic](https://docs.pydantic.dev), used by FastAPI, for the data validation and settings management.
    - 💾 [PostgreSQL](https://www.postgresql.org) as the SQL database.
- 🚀 [React](https://react.dev) for the frontend.
    - 💃 Using TypeScript, hooks, Vite, and other parts of a modern frontend stack.
    - 🎨 [Chakra UI](https://chakra-ui.com) for the frontend components.
    - 🤖 An automatically generated frontend client.
    - 🧪 [Playwright](https://playwright.dev) for End-to-End testing.
    - 🦇 Dark mode support.
- 🐋 [Docker Compose](https://www.docker.com) for development and production.
- 🔒 Secure password hashing by default.
- 🔑 JWT (JSON Web Token) authentication.
- 📫 Email based password recovery.
- ✅ Tests with [Pytest](https://pytest.org).
- 📞 [Traefik](https://traefik.io) as a reverse proxy / load balancer.
- 🚢 Deployment instructions using Docker Compose, including how to set up a frontend Traefik proxy to handle automatic HTTPS certificates.
- 🏭 CI (continuous integration) and CD (continuous deployment) based on GitHub Actions.

### Dashboard Login

The login page features:
- ✨ Real-time form validation with visual feedback
- 🎨 Modern, animated UI with gradient backgrounds
- 🔒 Secure password input with strength indicators
- ✅ Success/error states with clear messaging
- ♿ Full accessibility support (ARIA labels, keyboard navigation)

[![API docs](img/login.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Admin

[![API docs](img/dashboard.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Create User

[![API docs](img/dashboard-create.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Items

[![API docs](img/dashboard-items.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - User Settings

[![API docs](img/dashboard-user-settings.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Dark Mode

[![API docs](img/dashboard-dark.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Interactive API Documentation

[![API docs](img/docs.png)](https://github.com/fastapi/full-stack-fastapi-template)

## How To Use It

You can **just fork or clone** this repository and use it as is.

✨ It just works. ✨


```bash
git clone https://github.com/owayo-cloud/finance-tracker.git
```

- Enter into the new directory:

```bash
cd finance-tracker
```

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [uv](https://docs.astral.sh/uv/) for Python package management (for local backend development)

### Installing uv (Windows)

If you're on Windows and don't have `uv` installed, run:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Then add it to your PATH for the current session:

```powershell
$env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
```

To make it permanent, add `C:\Users\<YourUsername>\.local\bin` to your system PATH.

### Starting the Application

1. **Configure environment variables** - Copy `.env.example` to `.env` and update the required values (see [Configure](#configure) section below).

2. **Start with Docker Compose**:

```bash
docker compose watch
```

This will:
- Build and start all services (backend, frontend, database, etc.)
- Watch for file changes and automatically rebuild
- **Frontend**: Runs Vite dev server with **Hot Module Replacement (HMR)** - browser auto-refreshes on code changes
- **Backend**: Auto-reloads on Python file changes
- Make services available at:
  - Frontend: http://localhost:5173 (with live reload)
  - Backend API: http://localhost:8000
  - API Docs: http://localhost:8000/docs
  - Adminer (DB): http://localhost:8080
  - Traefik UI: http://localhost:8090
  - MailCatcher: http://localhost:1080

#### Auto-Refresh Features

✅ **Frontend (Vite HMR)**:
- Changes to React components automatically update in the browser without full page reload
- CSS changes apply instantly
- State is preserved during updates (where possible)

✅ **Backend (FastAPI --reload)**:
- Python code changes trigger automatic server restart
- No need to manually restart the backend

✅ **File Watching**:
- Docker Compose `watch` mode syncs file changes into containers
- Both frontend and backend detect changes automatically

### Local Backend Development (Optional)

If you want to run the backend locally instead of in Docker:

1. **Install Python 3.10+** (required for `psycopg-binary` compatibility)

2. **Install dependencies**:

```bash
cd backend
uv sync --python 3.10
```

3. **Activate virtual environment**:

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

4. **Run the development server**:

```bash
fastapi dev app/main.py
```

### Viewing Logs

The application includes comprehensive logging with colored output to help you see what's happening:

#### Docker Compose Logs

**View all logs:**
```bash
docker compose logs -f
```

**View specific service logs:**
```bash
# Backend logs
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend

# Database logs
docker compose logs -f db
```

**View last N lines:**
```bash
docker compose logs --tail 100 backend
```

#### Log Features

The backend includes:
- 🎨 **Colored logs** - Different colors for INFO, WARNING, ERROR levels
- 📊 **Request/Response logging** - See all API requests with status codes and timing
- 🚀 **Startup logs** - Detailed information when the app starts
- 🔄 **Database logs** - Connection status and initialization progress
- ⚠️ **Error logs** - Full stack traces for debugging

**Example log output:**
```
2025-11-18 13:20:00 | INFO     | app.main | ============================================================
2025-11-18 13:20:00 | INFO     | app.main | 🚀 Starting Finance Tracker
2025-11-18 13:20:00 | INFO     | app.main | 📍 Environment: local
2025-11-18 13:20:00 | INFO     | app.main | 🌐 API URL: /api/v1
2025-11-18 13:20:01 | INFO     | app.main | → GET /api/v1/users/me | Client: 172.18.0.1
2025-11-18 13:20:01 | INFO     | app.main | ← GET /api/v1/users/me | Status: 200 | Time: 0.045s
```

### Troubleshooting

#### Port Already in Use

If you get an error like `port is already allocated`:

1. **Check what's using the port**:

```powershell
# Windows
netstat -ano | findstr :5432

# Or check Docker containers
docker ps -a | findstr 5432
```

2. **Stop conflicting containers**:

```bash
docker stop <container-name>
```

Or change the port mapping in `docker-compose.yml` if you need both services running.

#### Docker Build Fails

- **Frontend build errors**: Make sure `vite.config.ts` has `open: false` for production builds (already configured)
- **Backend build errors**: Ensure Docker has enough resources allocated (4GB+ RAM recommended)

#### Python Version Issues

If `uv sync` fails with Python version errors:

```bash
# Install Python 3.10 using uv
uv python install 3.10

# Then sync with explicit Python version
uv sync --python 3.10
```

#### Debugging with Logs

If something isn't working:

1. **Check backend logs**:
   ```bash
   docker compose logs backend --tail 50
   ```

2. **Check for errors**:
   ```bash
   docker compose logs backend | findstr ERROR
   ```

3. **Watch logs in real-time**:
   ```bash
   docker compose logs -f backend frontend
   ```


### Configure

You can then update configs in the `.env` files to customize your configurations.

Before deploying it, make sure you change at least the values for:

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

You can (and should) pass these as environment variables from secrets.

Read the [deployment.md](./deployment.md) docs for more details.

### Generate Secret Keys

Some environment variables in the `.env` file have a default value of `changethis`.

You have to change them with a secret key, to generate secret keys you can run the following command:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the content and use that as password / secret key. And run that again to generate another secure key.


// ...existing code...

### Input Variables

Before running the project, review and update the following input variables in your `.env` file. These are essential for security, database connections, and email functionality. For each variable, locate it in the `.env` file, and replace the default value with a secure, appropriate one as described. You can generate secure keys using the command: `python -c "import secrets; print(secrets.token_urlsafe(32))"`.

- **SECRET_KEY**: Find `SECRET_KEY=changethis` in `.env`. Generate a new secret key and replace `changethis` to secure your application's sessions and tokens.
- **FIRST_SUPERUSER_PASSWORD**: Locate `FIRST_SUPERUSER_PASSWORD=changethis`. Create a strong password for the initial admin user and update this value.
- **POSTGRES_PASSWORD**: Find `POSTGRES_PASSWORD=changethis`. Set a secure password for your PostgreSQL database connection.
- **FIRST_SUPERUSER**: Check `FIRST_SUPERUSER=admin@example.com`. If needed, change this to the desired email for the first superuser account.
- **SMTP_HOST**, **SMTP_USER**, **SMTP_PASSWORD**: These are under the `# Emails` section. If you're setting up email functionality, provide your SMTP server details here; otherwise, leave them blank for now.
- **EMAILS_FROM_EMAIL**: Find `EMAILS_FROM_EMAIL=info@example.com`. Update to the email address from which your app will send emails.
- **SENTRY_DSN**: Locate `SENTRY_DSN=`. If using Sentry for error

## Backend Development

Backend docs: [backend/README.md](./backend/README.md).

**Key Features:**
- Python 3.10+ with `uv` for fast dependency management
- FastAPI with automatic OpenAPI documentation
- SQLModel ORM with PostgreSQL
- Alembic for database migrations
- Pytest for testing with coverage reports

## Frontend Development

Frontend docs: [frontend/README.md](./frontend/README.md).

**Key Features:**
- React 19 with TypeScript
- Vite for fast development and optimized builds
- Chakra UI v3 for modern, accessible components
- TanStack Router for type-safe routing
- Automatic API client generation from OpenAPI schema
- Dark mode support
- Playwright for E2E testing

## Deployment

Deployment docs: [deployment.md](./deployment.md).

## Development

General development docs: [development.md](./development.md).

This includes using Docker Compose, custom local domains, `.env` configurations, etc.

## Release Notes

Check the file [release-notes.md](./release-notes.md).

## License

The Full Stack FastAPI Template is licensed under the terms of the MIT license.
