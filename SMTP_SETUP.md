# SMTP Setup Guide

This guide shows you how to set up SMTP for email functionality in your finance-tracker application.

## Why You Need SMTP

SMTP is required for:
- Password reset emails
- Account verification emails
- Notification emails
- Background job notifications

---

## Option 1: Gmail (Easiest for Testing)

### Step 1: Enable App Password

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for app passwords)
3. Go to: https://myaccount.google.com/apppasswords
4. Create a new app password:
   - Select "Mail" and "Other (Custom name)"
   - Name it: "Finance Tracker Production"
   - Click "Generate"
5. **Copy the 16-character password** (you'll use this, not your regular Gmail password)

### Step 2: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `SMTP_HOST` | `smtp.gmail.com` | smtp.gmail.com |
| `SMTP_USER` | Your Gmail address | your-email@gmail.com |
| `SMTP_PASSWORD` | The 16-character app password | xxxx xxxx xxxx xxxx (no spaces) |
| `SMTP_PORT` | `587` | 587 |
| `SMTP_TLS` | `True` | True |
| `EMAILS_FROM_EMAIL` | Your Gmail address | your-email@gmail.com |
| `EMAILS_FROM_NAME` | Display name | Finance Tracker |

**Important:** Use the app password, NOT your regular Gmail password!

---

## Option 2: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account

1. Go to: https://sendgrid.com/
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Create API Key

1. Go to: **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: "Finance Tracker Production"
4. Select permissions: **"Full Access"** (or "Mail Send" only)
5. Click **"Create & View"**
6. **Copy the API key** (you can only see it once!)

### Step 3: Verify Sender

1. Go to: **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in your details
4. Verify the email they send you

### Step 4: Add GitHub Secrets

| Secret Name | Value | Example |
|------------|-------|---------|
| `SMTP_HOST` | `smtp.sendgrid.net` | smtp.sendgrid.net |
| `SMTP_USER` | `apikey` | apikey (literal word) |
| `SMTP_PASSWORD` | Your SendGrid API key | SG.xxxxx... |
| `SMTP_PORT` | `587` | 587 |
| `SMTP_TLS` | `True` | True |
| `EMAILS_FROM_EMAIL` | Your verified sender email | noreply@yourdomain.com |
| `EMAILS_FROM_NAME` | Display name | Finance Tracker |

---

## Option 3: Mailgun

### Step 1: Create Mailgun Account

1. Go to: https://www.mailgun.com/
2. Sign up (free tier: 5,000 emails/month)
3. Verify your account

### Step 2: Get SMTP Credentials

1. Go to: **Sending** → **Domain Settings**
2. Click on your domain
3. Go to **"SMTP credentials"** section
4. Use the provided SMTP username and password

### Step 3: Add GitHub Secrets

| Secret Name | Value | Example |
|------------|-------|---------|
| `SMTP_HOST` | `smtp.mailgun.org` | smtp.mailgun.org |
| `SMTP_USER` | Your Mailgun SMTP username | postmaster@mg.yourdomain.com |
| `SMTP_PASSWORD` | Your Mailgun SMTP password | (from Mailgun dashboard) |
| `SMTP_PORT` | `587` | 587 |
| `SMTP_TLS` | `True` | True |
| `EMAILS_FROM_EMAIL` | Your domain email | noreply@yourdomain.com |
| `EMAILS_FROM_NAME` | Display name | Finance Tracker |

---

## Option 4: AWS SES (For High Volume)

1. Set up AWS SES
2. Verify your domain or email
3. Get SMTP credentials from AWS Console
4. Use AWS SES SMTP endpoint (varies by region)

---

## Quick Setup Checklist

- [ ] Choose an email provider (Gmail for testing, SendGrid/Mailgun for production)
- [ ] Set up account and get credentials
- [ ] Add secrets to GitHub:
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASSWORD`
  - [ ] `SMTP_PORT` (usually 587)
  - [ ] `SMTP_TLS` (usually True)
  - [ ] `EMAILS_FROM_EMAIL`
  - [ ] `EMAILS_FROM_NAME` (optional)
- [ ] Test email sending after deployment

---

## Testing After Setup

After deployment, you can test email sending by:

1. **Triggering a password reset** on your app
2. **Checking backend logs:**
   ```bash
   ssh root@173.255.249.250
   docker logs finance-tracker-backend-1 | grep -i email
   ```

---

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials are correct
2. Verify the sender email is verified (for SendGrid/Mailgun)
3. Check spam folder
4. Check backend logs for errors:
   ```bash
   docker logs finance-tracker-backend-1
   ```

### Gmail App Password Not Working

- Make sure 2-Step Verification is enabled
- Use the 16-character app password (no spaces)
- Don't use your regular Gmail password

### SendGrid Issues

- Make sure sender email is verified
- Check API key has correct permissions
- Use `apikey` as the SMTP_USER (literal word)

---

## Recommended for Production

- **SendGrid** or **Mailgun** are recommended for production
- They provide better deliverability
- More reliable than Gmail for business use
- Better analytics and monitoring

**For now (testing/development):** Gmail with App Password works fine!

