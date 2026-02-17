# AWS EC2 Free Tier Setup - Step by Step Guide

## Prerequisites
- AWS Account (sign up at https://aws.amazon.com/)
- Credit card (won't be charged with free tier)
- SSH client (built into Windows 10+)

---

## Phase 1: Launch EC2 Instance (10 minutes)

### Step 1: Login to AWS
1. Go to https://console.aws.amazon.com/
2. Sign in to your account
3. Search for "EC2" in the top search bar
4. Click "EC2" to open EC2 Dashboard

### Step 2: Launch Instance
1. Click **"Launch Instance"** (orange button)

2. **Name and tags**:
   - Name: `openclaw-server`

3. **Application and OS Images (AMI)**:
   - Quick Start: **Ubuntu**
   - Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - Architecture: **64-bit (x86)**
   - ✅ Make sure it says "Free tier eligible"

4. **Instance type**:
   - Select: **t2.micro** (Free tier eligible - 1 vCPU, 1 GB RAM)

5. **Key pair (login)**:
   - Click "Create new key pair"
   - Key pair name: `openclaw-key`
   - Key pair type: **RSA**
   - Private key file format: **.pem** (for SSH)
   - Click "Create key pair"
   - ⚠️ **IMPORTANT**: Save the downloaded `openclaw-key.pem` file securely!
     - You'll need this to connect to your server
     - You can't download it again!

6. **Network settings**:
   - Click "Edit" on Network settings
   - **Firewall (security groups)**: Create security group
   - Security group name: `openclaw-sg`
   - Description: `Security group for OpenClaw`
   
   - **Inbound security group rules**:
     - Rule 1: SSH
       - Type: SSH
       - Source type: Anywhere (0.0.0.0/0)
       - Description: SSH access
     
     - Click "Add security group rule"
     - Rule 2: Custom TCP
       - Port range: 8000
       - Source type: Anywhere (0.0.0.0/0)
       - Description: OpenClaw API
     
     - Click "Add security group rule"
     - Rule 3: HTTP
       - Type: HTTP
       - Source type: Anywhere (0.0.0.0/0)
       - Description: HTTP
     
     - Click "Add security group rule"
     - Rule 4: HTTPS
       - Type: HTTPS
       - Source type: Anywhere (0.0.0.0/0)
       - Description: HTTPS

7. **Configure storage**:
   - Size: **30 GB** (Free tier allows up to 30 GB)
   - Volume type: **gp3**
   - ✅ Leave "Delete on termination" checked

8. **Advanced details**: Leave as default

9. **Summary**:
   - Review: 1 instance, t2.micro, 30 GB storage
   - Click **"Launch instance"** (orange button)

10. Wait for instance to start (2-3 minutes)
    - Click "View all instances"
    - Wait until "Instance state" shows **"Running"**
    - Wait until "Status check" shows **"2/2 checks passed"**

### Step 3: Get Your Server IP
1. Click on your instance (openclaw-server)
2. In the Details tab below, find:
   - **Public IPv4 address**: (e.g., 3.15.123.456)
   - **Public IPv4 DNS**: (e.g., ec2-3-15-123-456.compute-1.amazonaws.com)
3. **Copy the Public IPv4 address** - you'll need this!

---

## Phase 2: Connect to Your Server (5 minutes)

### Step 1: Prepare SSH Key (Windows)
1. Move your `openclaw-key.pem` to a safe location:
   ```powershell
   # Create .ssh directory if it doesn't exist
   mkdir $HOME\.ssh -Force
   
   # Move the key file
   Move-Item .\openclaw-key.pem $HOME\.ssh\openclaw-key.pem
   ```

2. Set correct permissions:
   ```powershell
   # Open PowerShell as Administrator
   icacls $HOME\.ssh\openclaw-key.pem /inheritance:r
   icacls $HOME\.ssh\openclaw-key.pem /grant:r "$($env:USERNAME):(R)"
   ```

### Step 2: Connect via SSH
```powershell
ssh -i $HOME\.ssh\openclaw-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Replace `YOUR_EC2_PUBLIC_IP` with the IP you copied earlier.

Example:
```powershell
ssh -i $HOME\.ssh\openclaw-key.pem ubuntu@3.15.123.456
```

If prompted "Are you sure you want to continue connecting?", type `yes` and press Enter.

✅ **You should now be connected to your server!**

You'll see something like:
```
ubuntu@ip-172-31-12-34:~$
```

---

## Phase 3: Install Software (10 minutes)

### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```
(Wait 2-3 minutes)

### Step 2: Install Node.js 20
```bash
# Download Node.js setup script
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
# Press 'q' to exit
```

### Step 4: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Step 5: Install Git
```bash
sudo apt install -y git
```

---

## Phase 4: Setup PostgreSQL Database (5 minutes)

```bash
# Switch to postgres user
sudo -u postgres psql

# You're now in PostgreSQL prompt (postgres=#)
# Run these commands one by one:
```

```sql
CREATE DATABASE openclaw_db;
CREATE USER openclaw WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE openclaw_db TO openclaw;
\q
```

**⚠️ IMPORTANT**: Replace `your_secure_password_here` with a strong password!
- Example: `OpEnCl@w2024!SecUre`
- Save this password - you'll need it later!

---

## Phase 5: Upload OpenClaw Code (10 minutes)

### Option A: Using Git (Recommended)

If you have your code on GitHub:

```bash
# Create app directory
sudo mkdir -p /var/www/openclaw
sudo chown ubuntu:ubuntu /var/www/openclaw
cd /var/www/openclaw

# Clone your repository
git clone https://github.com/YOUR_USERNAME/cortex.git .

# Navigate to openclaw directory
cd openclaw
```

### Option B: Using SCP (Upload from Your Computer)

On your **local computer** (PowerShell), from the cortex directory:

```powershell
# Compress openclaw directory
Compress-Archive -Path .\openclaw -DestinationPath openclaw.zip

# Upload to EC2
scp -i $HOME\.ssh\openclaw-key.pem openclaw.zip ubuntu@YOUR_EC2_IP:/home/ubuntu/

# Now on EC2 server (SSH), extract it:
```

```bash
# Create app directory
sudo mkdir -p /var/www/openclaw
sudo chown ubuntu:ubuntu /var/www/openclaw

# Extract uploaded file
unzip openclaw.zip -d /var/www/
cd /var/www/openclaw
```

---

## Phase 6: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Press `i` to enter insert mode, then paste:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=cortex-memories
CLERK_SECRET_KEY=your_clerk_secret_key_here
DATABASE_URL=postgresql://openclaw:your_db_password@localhost:5432/openclaw_db
PORT=8000
NODE_ENV=production
ALLOWED_ORIGINS=http://YOUR_EC2_IP:8000,http://localhost:5173
```

**Replace**:
- `your_gemini_api_key_here` - Your Gemini API key
- `your_pinecone_api_key_here` - Pinecone API key (get from pinecone.io)
- `your_clerk_secret_key_here` - Clerk secret key
- `your_db_password` - The PostgreSQL password you set earlier
- `YOUR_EC2_IP` - Your EC2 public IP

**Save and exit**:
- Press `Esc`
- Type `:wq`
- Press `Enter`

---

## Phase 7: Install Dependencies & Build

```bash
# Install Node.js dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Build TypeScript
npm run build
```

---

## Phase 8: Start OpenClaw

```bash
# Start with PM2
pm2 start dist/index.js --name openclaw

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it shows you

# Check status
pm2 status
```

You should see:
```
┌─────┬──────────┬─────────┬─────────┐
│ id  │ name     │ status  │ restart │
├─────┼──────────┼─────────┼─────────┤
│ 0   │ openclaw │ online  │ 0       │
└─────┴──────────┴─────────┴─────────┘
```

---

## Phase 9: Test OpenClaw

```bash
# Test health endpoint
curl http://localhost:8000/health
```

Should return:
```json
{"status":"ok","timestamp":"...","version":"1.0.0"}
```

✅ **OpenClaw is running!**

---

## Phase 10: Access from Outside

Your OpenClaw API is now accessible at:
```
http://YOUR_EC2_PUBLIC_IP:8000
```

Test from your computer:
```powershell
curl http://YOUR_EC2_IP:8000/health
```

---

## Useful Commands

```bash
# View logs
pm2 logs openclaw

# Restart OpenClaw
pm2 restart openclaw

# Stop OpenClaw
pm2 stop openclaw

# Check status
pm2 status

# Monitor
pm2 monit
```

---

## Next Steps

1. ✅ OpenClaw is deployed on AWS EC2
2. 📍 Get Pinecone API key (if you haven't already)
3. 📍 Test API with Clerk token
4. 📍 Then I'll update Cortex frontend to connect

---

## Troubleshooting

**If PM2 shows "errored"**:
```bash
pm2 logs openclaw --lines 50
```

**If database connection fails**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U openclaw -d openclaw_db -h localhost
```

**If port 8000 not accessible**:
- Check Security Group in AWS Console
- Make sure port 8000 is allowed

---

**Ready to start? Let me know when you want to begin!** 🚀
