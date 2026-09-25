# ARKA — Enterprise AI Unified Platform

> **CONFIDENTIAL & PROPRIETARY**  
> Copyright © 2026 ARKA Inc. All Rights Reserved.  
> This software is proprietary and confidential. Unauthorized copying, modification, distribution, reverse engineering, or public disclosure of this codebase, via any medium, is strictly prohibited without explicit written permission from the copyright owner. **Not open source.**

---

## 1. Overview

**ARKA** is a high-performance, enterprise-grade unified AI gateway and multi-model conversational hub. Designed from the ground up with a minimalist monochrome aesthetic (black, white, and silver), Persian RTL localization, and robust system-level security.

### Core Capabilities

- **Unified Multi-Model Gateway**: Seamlessly query Claude Sonnet 4, Claude 3.5 Haiku, GPT-4o, Gemini 2.5 Pro/Flash, DeepSeek-R1, and FLUX.1 Image Studio from a single, responsive conversational interface.
- **Enterprise Key Security (BYOK & Multi-Key Pools)**: Hardware-accelerated AES-256-GCM envelope encryption for all stored API keys. Decryption occurs strictly in-memory during server-side stream dispatch; keys are never transmitted to the client.
- **Intelligent Auto-Failover Engine**: When an upstream provider returns HTTP 429 (Rate Limit) or quota exhaustion, the failover orchestrator automatically switches to the next standby key in the provider pool without terminating the user's active session or stream.
- **Single-Identity Google OAuth**: Exclusively leverages official Google OAuth 2.0 (state CSRF verification, atomic database upsert, secure HTTP-only cookies). Completely eliminates password fatigue, SMS OTP latency, and credential stuffing vectors.
- **Centralized Admin Center (`/c-xroladi1n`)**: Real-time KPI telemetry, interactive registration timeline charts with segmented period toggles (7D / 30D / 90D), user access control (instant bans, temporary timeouts with live countdown timers), provider cluster management, and broadcast announcements.
- **Server CLI Utility (`arka-cli`)**: An interactive 7-option terminal operations tool for backup, restoration, database synchronization, PM2 cluster control, and system health checks.

---

## 2. Technology Stack

- **Framework**: Next.js 15 (React 19, Server Components, App Router)
- **Language**: TypeScript 5.x (Strict mode)
- **Styling**: Tailwind CSS, Lucide Icons, Custom Canvas Mesh Animation
- **Database & ORM**: PostgreSQL 16+ with Prisma ORM
- **Cryptography**: Node.js `crypto` (AES-256-GCM, PBKDF2 key derivation, secure IV/authTag)
- **Process Manager**: PM2 Cluster Mode (`ecosystem.config.js`)
- **Web Server / Reverse Proxy**: Nginx with SSL (Let's Encrypt / Certbot)

---

## 3. Environment Variables Reference

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# PostgreSQL Database Connection
DATABASE_URL="postgresql://arka_user:your_secure_password@127.0.0.1:5432/arka?schema=public"

# Google OAuth 2.0 (Required for Authentication)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Security & Master Encryption Keys
# Generate random 32-byte hex strings via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
BYOK_ENCRYPTION_KEY=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210

# Admin Portal Password
ADMIN_PASSWORD=your-ultra-secure-admin-password
```

---

## 4. Git Push Guide (Uploading to Your Private GitHub)

Follow these exact steps to push this project to your **private** GitHub repository:

### Step 4.1. Initialize Git & Set User Identity (if not set)
```bash
cd /path/to/arka
git init
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

### Step 4.2. Verify `.gitignore`
Ensure sensitive files (`.env`, `node_modules`, `.next`, build artifacts) are ignored:
```bash
git status
```

### Step 4.3. Stage and Commit
```bash
git add .
git commit -m "feat: complete enterprise release of ARKA unified AI platform"
```

### Step 4.4. Set Remote to Your GitHub Repo (`AliRezaC-xrol/arka`)
```bash
# Rename branch to main
git branch -M main

# Set remote origin to your GitHub repository
git remote add origin https://github.com/AliRezaC-xrol/arka.git
# If origin already exists:
# git remote set-url origin https://github.com/AliRezaC-xrol/arka.git

# Push to your private repo (using your Personal Access Token or SSH Key)
git push -u origin main
```

---

## 5. Remote Server Deployment Guide (Ubuntu 22.04 / 24.04 LTS)

Run these commands on your remote server as `root` or a `sudo` user.

### Step 5.1. System Update & Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

### Step 5.2. Install Node.js 20 LTS & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 5.3. Configure PostgreSQL Database
```bash
sudo -u postgres psql <<EOF
CREATE DATABASE arka;
CREATE USER arka_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE arka TO arka_user;
ALTER DATABASE arka OWNER TO arka_user;
\q
EOF
```

### Step 5.4. Clone Your Private Repository
```bash
# Clone to /var/www/arka
sudo mkdir -p /var/www/arka
sudo chown -R $USER:$USER /var/www/arka
cd /var/www/arka

# Clone using your GitHub repository
git clone https://github.com/AliRezaC-xrol/arka.git .
```

### Step 5.5. Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
*(Fill in your PostgreSQL URL, Google Client ID/Secret, random 32-byte hex keys, and Admin Password).*

### Step 5.6. Install Dependencies, Sync Database & Build
```bash
# Install production dependencies
npm ci

# Push database schema to PostgreSQL
npx prisma db push

# Generate optimized Next.js production build
npm run build
```

### Step 5.7. Launch with PM2 Process Manager
```bash
# Start cluster using ecosystem configuration
pm2 start ecosystem.config.js

# Configure PM2 to auto-start on server reboot
pm2 save
pm2 startup
```

### Step 5.8. Install ARKA Server CLI
```bash
sudo cp scripts/arka-cli.sh /usr/local/bin/arka-cli
sudo chmod +x /usr/local/bin/arka-cli
```
*You can now manage the server anytime simply by running:*
```bash
arka-cli
```

### Step 5.9. Configure Nginx Reverse Proxy & SSL
Create `/etc/nginx/sites-available/arka`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Disable buffering for real-time SSE streaming
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

Enable site and issue Free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/arka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 6. Maintenance & Operational Commands

| Command | Action |
|---|---|
| `arka-cli` | Launch interactive terminal management dashboard |
| `pm2 status` | View status of cluster worker processes |
| `pm2 logs arka` | Stream live server logs |
| `pm2 restart arka` | Zero-downtime rolling reload |
| `npx prisma studio` | Open web GUI for database exploration |
| `npm run test` | Run complete automated verification test suite |

---

## 7. Proprietary License Notice

This codebase contains proprietary trade secrets and intellectual property belonging exclusively to the author. **Strictly Closed Source.**  
No license is granted to copy, distribute, modify, merge, publish, sublicense, or sell copies of this software under any circumstances without prior written authorization.
