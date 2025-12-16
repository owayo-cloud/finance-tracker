# FastAPI Project - Deployment

You can deploy the project using Docker Compose to a remote server.

This project expects you to have a Traefik proxy handling communication to the outside world and HTTPS certificates.

You can use CI/CD (continuous integration and continuous deployment) systems to deploy automatically, there are already configurations to do it with GitHub Actions.

But you have to configure a couple things first. 🤓

## Preparation

* Have a remote server ready and available.
* Configure the DNS records of your domain to point to the IP of the server you just created.
* Configure a wildcard subdomain for your domain, so that you can have multiple subdomains for different services, e.g. `*.fastapi-project.example.com`. This will be useful for accessing different components, like `dashboard.fastapi-project.example.com`, `api.fastapi-project.example.com`, `traefik.fastapi-project.example.com`, `adminer.fastapi-project.example.com`, etc. And also for `staging`, like `dashboard.staging.fastapi-project.example.com`, `adminer.staging.fastapi-project.example.com`, etc.
* Install and configure [Docker](https://docs.docker.com/engine/install/) on the remote server (Docker Engine, not Docker Desktop).

## Public Traefik

We need a Traefik proxy to handle incoming connections and HTTPS certificates.

You need to do these next steps only once.

### Traefik Docker Compose

* Create a remote directory to store your Traefik Docker Compose file:

```bash
mkdir -p /root/code/traefik-public/
```

Copy the Traefik Docker Compose file to your server. You could do it by running the command `rsync` in your local terminal:

```bash
rsync -a docker-compose.traefik.yml root@your-server.example.com:/root/code/traefik-public/
```

### Traefik Public Network

This Traefik will expect a Docker "public network" named `traefik-public` to communicate with your stack(s).

This way, there will be a single public Traefik proxy that handles the communication (HTTP and HTTPS) with the outside world, and then behind that, you could have one or more stacks with different domains, even if they are on the same single server.

To create a Docker "public network" named `traefik-public` run the following command in your remote server:

```bash
docker network create traefik-public
```

### Traefik Environment Variables

The Traefik Docker Compose file expects some environment variables to be set in your terminal before starting it. You can do it by running the following commands in your remote server.

* Create the username for HTTP Basic Auth, e.g.:

```bash
export USERNAME=admin
```

* Create an environment variable with the password for HTTP Basic Auth, e.g.:

```bash
export PASSWORD=changethis
```

* Use openssl to generate the "hashed" version of the password for HTTP Basic Auth and store it in an environment variable:

```bash
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
```

To verify that the hashed password is correct, you can print it:

```bash
echo $HASHED_PASSWORD
```

* Create an environment variable with the domain name for your server, e.g.:

```bash
export DOMAIN=fastapi-project.example.com
```

* Create an environment variable with the email for Let's Encrypt, e.g.:

```bash
export EMAIL=admin@example.com
```

**Note**: you need to set a different email, an email `@example.com` won't work.

### Start the Traefik Docker Compose

Go to the directory where you copied the Traefik Docker Compose file in your remote server:

```bash
cd /root/code/traefik-public/
```

Now with the environment variables set and the `docker-compose.traefik.yml` in place, you can start the Traefik Docker Compose running the following command:

```bash
docker compose -f docker-compose.traefik.yml up -d
```

## Deploy the FastAPI Project

Now that you have Traefik in place you can deploy your FastAPI project with Docker Compose.

**Note**: You might want to jump ahead to the section about Continuous Deployment with GitHub Actions.

## Environment Variables

You need to set some environment variables first.

Set the `ENVIRONMENT`, by default `local` (for development), but when deploying to a server you would put something like `staging` or `production`:

```bash
export ENVIRONMENT=production
```

Set the `DOMAIN`, by default `localhost` (for development), but when deploying you would use your own domain, for example:

```bash
export DOMAIN=fastapi-project.example.com
```

You can set several variables, like:

* `PROJECT_NAME`: The name of the project, used in the API for the docs and emails.
* `STACK_NAME`: The name of the stack used for Docker Compose labels and project name, this should be different for `staging`, `production`, etc. You could use the same domain replacing dots with dashes, e.g. `fastapi-project-example-com` and `staging-fastapi-project-example-com`.
* `BACKEND_CORS_ORIGINS`: A list of allowed CORS origins separated by commas.
* `SECRET_KEY`: The secret key for the FastAPI project, used to sign tokens.
* `FIRST_SUPERUSER`: The email of the first superuser, this superuser will be the one that can create new users.
* `FIRST_SUPERUSER_PASSWORD`: The password of the first superuser.
* `SMTP_HOST`: The SMTP server host to send emails, this would come from your email provider (E.g. Mailgun, Sparkpost, Sendgrid, etc).
* `SMTP_USER`: The SMTP server user to send emails.
* `SMTP_PASSWORD`: The SMTP server password to send emails.
* `EMAILS_FROM_EMAIL`: The email account to send emails from.
* `POSTGRES_SERVER`: The hostname of the PostgreSQL server. You can leave the default of `db`, provided by the same Docker Compose. You normally wouldn't need to change this unless you are using a third-party provider.
* `POSTGRES_PORT`: The port of the PostgreSQL server. You can leave the default. You normally wouldn't need to change this unless you are using a third-party provider.
* `POSTGRES_PASSWORD`: The Postgres password.
* `POSTGRES_USER`: The Postgres user, you can leave the default.
* `POSTGRES_DB`: The database name to use for this application. You can leave the default of `app`.
* `SENTRY_DSN`: The DSN for Sentry, if you are using it.

### Email Configuration for Background Jobs

The application uses **Supervisor** to manage background jobs that send automated emails for:
- Debt reminders (daily at 8:00 AM)
- Low stock alerts (daily at 9:00 AM)  
- Notification cleanup (weekly on Sundays)

**Required Email Variables** (same as above):
* `SMTP_HOST`: Your SMTP server hostname
* `SMTP_PORT`: SMTP port (usually 587 for TLS or 465 for SSL)
* `SMTP_USER`: SMTP authentication username
* `SMTP_PASSWORD`: SMTP authentication password
* `SMTP_TLS`: Set to `true` for TLS or `false` for SSL
* `EMAILS_FROM_EMAIL`: Sender email address
* `EMAILS_FROM_NAME`: Sender display name (optional, defaults to PROJECT_NAME)

**Note**: Without valid SMTP configuration, background jobs will run but email sending will fail. Check supervisor logs to verify email delivery.

## GitHub Actions Environment Variables

There are some environment variables only used by GitHub Actions that you can configure:

* `LATEST_CHANGES`: Used by the GitHub Action [latest-changes](https://github.com/tiangolo/latest-changes) to automatically add release notes based on the PRs merged. It's a personal access token, read the docs for details.
* `SMOKESHOW_AUTH_KEY`: Used to handle and publish the code coverage using [Smokeshow](https://github.com/samuelcolvin/smokeshow), follow their instructions to create a (free) Smokeshow key.

### Generate secret keys

Some environment variables in the `.env` file have a default value of `changethis`.

You have to change them with a secret key, to generate secret keys you can run the following command:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the content and use that as password / secret key. And run that again to generate another secure key.

### Deploy with Docker Compose

With the environment variables in place, you can deploy with Docker Compose:

```bash
docker compose -f docker-compose.yml up -d
```

**Security note:** Do **not** forward the runner's `GITHUB_TOKEN` (or other CI tokens) directly to your server—if a token is echoed or the server is compromised the token can be abused. Prefer one of these approaches:

- Use a server-side, scoped read-only token for GHCR (configured as a secret on the server) or store a minimal GHCR PAT as a repo secret (`GHCR_TOKEN`) and let the runner pull images and securely transfer them to the server (the workflow now supports this pattern).
- Or use a deploy key on the server for repository access and avoid sending runner tokens over SSH.

For production you wouldn't want to have the overrides in `docker-compose.override.yml`, that's why we explicitly specify `docker-compose.yml` as the file to use.

### Verify Deployment

After deployment, verify that both the FastAPI application and background scheduler are running:

```bash
# Check all processes managed by Supervisor
docker exec -it <backend-container-name> supervisorctl status
```

Expected output:
```
fastapi                          RUNNING   pid 12, uptime 0:01:23
scheduler                        RUNNING   pid 13, uptime 0:01:23
```

To view scheduler logs and verify background jobs are scheduled:

```bash
# View scheduler logs
docker exec -it <backend-container-name> tail -f /var/log/supervisor/scheduler.log

# View FastAPI logs
docker exec -it <backend-container-name> tail -f /var/log/supervisor/fastapi.log
```

For detailed supervisor management, see `backend/SUPERVISOR.md`.

## Continuous Deployment (CD)

You can use GitHub Actions to deploy your project automatically. 😎

You can have multiple environment deployments.

There are already two environments configured, `staging` and `production`. 🚀

### Install GitHub Actions Runner

* On your remote server, create a user for your GitHub Actions:

```bash
sudo adduser github
```

* Add Docker permissions to the `github` user:

```bash
sudo usermod -aG docker github
```

* Temporarily switch to the `github` user:

```bash
sudo su - github
```

* Go to the `github` user's home directory:

```bash
cd
```

* [Install a GitHub Action self-hosted runner following the official guide](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners#adding-a-self-hosted-runner-to-a-repository).

* When asked about labels, add a label for the environment, e.g. `production`. You can also add labels later.

After installing, the guide would tell you to run a command to start the runner. Nevertheless, it would stop once you terminate that process or if your local connection to your server is lost.

To make sure it runs on startup and continues running, you can install it as a service. To do that, exit the `github` user and go back to the `root` user:

```bash
exit
```

After you do it, you will be on the previous user again. And you will be on the previous directory, belonging to that user.

Before being able to go the `github` user directory, you need to become the `root` user (you might already be):

```bash
sudo su
```

* As the `root` user, go to the `actions-runner` directory inside of the `github` user's home directory:

```bash
cd /home/github/actions-runner
```

* Install the self-hosted runner as a service with the user `github`:

```bash
./svc.sh install github
```

* Start the service:

```bash
./svc.sh start
```

* Check the status of the service:

```bash
./svc.sh status
```

You can read more about it in the official guide: [Configuring the self-hosted runner application as a service](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service).

### Set Secrets

On your repository, configure secrets for the environment variables you need, the same ones described above, including `SECRET_KEY`, etc. Follow the [official GitHub guide for setting repository secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

The current Github Actions workflows expect these secrets:

* `DOMAIN_PRODUCTION`
* `DOMAIN_STAGING`
* `STACK_NAME_PRODUCTION`
* `STACK_NAME_STAGING`
* `EMAILS_FROM_EMAIL`
* `FIRST_SUPERUSER`
* `FIRST_SUPERUSER_PASSWORD`
* `POSTGRES_PASSWORD`
* `SECRET_KEY`
* `LATEST_CHANGES`
* `SMOKESHOW_AUTH_KEY`

## GitHub Action Deployment Workflows

There are GitHub Action workflows in the `.github/workflows` directory already configured for deploying to the environments (GitHub Actions runners with the labels):

* `staging`: after pushing (or merging) to the branch `master`.
* `production`: after publishing a release.

If you need to add extra environments you could use those as a starting point.

## URLs

Replace `fastapi-project.example.com` with your domain.

### Main Traefik Dashboard

Traefik UI: `https://traefik.fastapi-project.example.com`

### Production

Frontend: `https://dashboard.fastapi-project.example.com`

Backend API docs: `https://api.fastapi-project.example.com/docs`

Backend API base URL: `https://api.fastapi-project.example.com`

Adminer: `https://adminer.fastapi-project.example.com`

### Staging

Frontend: `https://dashboard.staging.fastapi-project.example.com`

Backend API docs: `https://api.staging.fastapi-project.example.com/docs`

Backend API base URL: `https://api.staging.fastapi-project.example.com`

Adminer: `https://adminer.staging.fastapi-project.example.com`

## Background Jobs & Supervisor

The backend container uses **Supervisor** to manage two processes:

1. **FastAPI Application** - Your main web server (4 workers)
2. **Scheduler** - APScheduler for automated background jobs

### Background Jobs Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| Debt Reminders | Daily at 8:00 AM | Sends email reminders for overdue supplier payments |
| Reorder Alerts | Daily at 9:00 AM | Alerts admins about products below reorder level |
| Notification Cleanup | Weekly (Sunday midnight) | Deletes read notifications older than 30 days |

### Managing Supervisor Processes

**Check process status:**
```bash
docker exec -it <backend-container> supervisorctl status
```

**Restart a process:**
```bash
# Restart scheduler after configuration changes
docker exec -it <backend-container> supervisorctl restart scheduler

# Restart FastAPI
docker exec -it <backend-container> supervisorctl restart fastapi

# Restart all
docker exec -it <backend-container> supervisorctl restart all
```

**View logs:**
```bash
# Scheduler logs (see background job execution)
docker exec -it <backend-container> tail -f /var/log/supervisor/scheduler.log

# FastAPI logs
docker exec -it <backend-container> tail -f /var/log/supervisor/fastapi.log

# All supervisor logs
docker logs <backend-container>
```

### Email Templates

Email templates are automatically built from MJML sources during the Docker build process. The templates are located in:

- **MJML Sources**: `backend/app/email-templates/src/*.mjml`
- **Built HTML**: `backend/app/email-templates/build/*.html`

If you modify email templates:

1. Edit the MJML source files
2. Rebuild the Docker image: `docker-compose build backend`
3. Restart the container: `docker-compose up -d backend`

### Troubleshooting Background Jobs

**Jobs not running:**
```bash
# Check scheduler status
docker exec -it <backend-container> supervisorctl status scheduler

# Check for errors in scheduler logs
docker exec -it <backend-container> tail -100 /var/log/supervisor/scheduler_error.log

# Verify database connectivity
docker exec -it <backend-container> python -c "from app.core.db import engine; print('DB OK')"
```

**Emails not sending:**
```bash
# Verify SMTP configuration
docker exec -it <backend-container> env | grep SMTP

# Test email sending manually
docker exec -it <backend-container> python -m app.background_services debt_reminders
```

**Customize job schedules:**

Edit `backend/scheduler.py` and modify the cron expressions, then:
```bash
docker-compose build backend
docker-compose up -d backend
docker exec -it <backend-container> supervisorctl restart scheduler
```

For detailed documentation on Supervisor configuration and management, see:
- `backend/SUPERVISOR.md` - Complete Supervisor guide
- `backend/QUICK_REFERENCE.md` - Quick command reference
- `backend/supervisor-ctl.sh` - Helper script for common operations

