# OpenClaw - Deployment Guide

This guide shows you how to deploy OpenClaw backend to a VPS.

---

## Option 1: Deploy to Railway (Easiest - Recommended)

Railway is the easiest way to deploy OpenClaw with PostgreSQL and HTTPS automatically configured.

### Steps:

1. **Sign up for Railway**:
   - Go to [railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your Cortex repo
   - Select the `openclaw` folder as root

3. **Add PostgreSQL**:
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically provision a database

4. **Set Environment Variables**:
   Go to your OpenClaw service → Variables tab and add:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ALLOWED_ORIGINS=https://cortex.yourdomain.com
   PORT=8000
   ```

5. **Deploy**:
   - Railway will auto-deploy
   - You'll get a URL like: `https://openclaw-production.up.railway.app`

6. **Update Cortex**:
   In Cortex `.env.local`, add:
   ```
   VITE_OPENCLAW_API_URL=https://your-railway-url.railway.app
   ```

**Cost**: ~$5-10/month

---

## Option 2: Deploy to AWS EC2 (Free Tier)

### Prerequisites:
- AWS account
- Basic SSH knowledge

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Configure:
   - Name: `openclaw-server`
   - AMI: Ubuntu 22.04 LTS (Free tier eligible)
   - Instance type: `t2.micro` (Free tier)
   - Key pair: Create new or use existing
   - Security Group: Allow ports 22 (SSH), 8000 (OpenClaw), 5432 (PostgreSQL)

4. Launch instance

### Step 2: SSH into Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE openclaw_db;
CREATE USER openclaw WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE openclaw_db TO openclaw;
\q
```

### Step 5: Clone and Setup OpenClaw

```bash
# Create app directory
sudo mkdir -p /var/www/openclaw
sudo chown ubuntu:ubuntu /var/www/openclaw
cd /var/www/openclaw

# Upload your openclaw code (use scp or git)
# If using git:
git clone https://github.com/yourusername/cortex.git .
cd openclaw

# Install dependencies
npm install

# Create .env file
nano .env
```

Add environment variables:
```
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=postgresql://openclaw:your_strong_password@localhost:5432/openclaw_db
PORT=8000
ALLOWED_ORIGINS=https://cortex.yourdomain.com
NODE_ENV=production
```

### Step 6: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push
```

### Step 7: Build and Start

```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name openclaw

# Save PM2 config
pm2 save
pm2 startup
```

### Step 8: Setup HTTPS with Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/openclaw
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Step 9: Verify Deployment

```bash
# Check if OpenClaw is running
curl http://localhost:8000/health

# Should return:
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

**Cost**: FREE (with AWS Free Tier for 12 months)

---

## What You Need From Your Side

### 1. API Keys (Get these ready):
- ✅ **Gemini API Key**: You already have this
- 🆕 **Pinecone API Key**: 
  - Go to [pinecone.io](https://www.pinecone.io/)
  - Sign up (free tier)
  - Create index: `cortex-memories` (768 dimensions, cosine metric)
  - Copy API key
- ✅ **Clerk Secret Key**: 
  - Go to Clerk dashboard
  - Settings → API Keys
  - Copy "Secret Key" (starts with `sk_`)

### 2. Domain (Optional):
- If you want custom domain (e.g., `api.cortex.com`)
- Point DNS A record to your server IP

### 3. Testing:
- After deployment, test health endpoint: `https://your-url/health`
- Test create memory endpoint from Cortex

---

## Next Steps After Deployment

1. Get OpenClaw URL (Railway or your EC2 domain)
2. Update Cortex to connect to OpenClaw
3. Migrate existing Convex data to OpenClaw
4. Test voice → save → search flow

Let me know which option you prefer! 🚀
