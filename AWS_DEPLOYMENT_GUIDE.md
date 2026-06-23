# Complete AWS Deployment Guide for NoteSage

This guide will walk you through pointing your Cloudflare/Hostinger domain to an AWS EC2 instance and securely deploying your Dockerized application.

## 🔒 Security Reassurance

**Your private files are safe.** Because of your `.gitignore` file, your local `.env` (which contains your Gemini and AWS keys) was **never** uploaded to GitHub. When you pull your code to AWS, it will be missing the `.env` file. You will securely create it directly on the AWS server in Step 4.

---

## Part 1: Domain Setup (Cloudflare + Hostinger)

Since your domain (`traffic-intel.online`) is registered with Hostinger but managed by Cloudflare, you must do all DNS configuration in **Cloudflare**.

1. **Get your AWS IP:** After you launch your EC2 instance (see Part 2), copy its **Public IPv4 Address**.
2. **Open Cloudflare:** Go to your Cloudflare dashboard and select `traffic-intel.online`.
3. **Go to DNS Settings:** Click on **DNS** -> **Records** on the left sidebar.
4. **Add a Record:**
   * **Type:** `A`
   * **Name:** `notesage` *(This makes the URL notesage.traffic-intel.online)*
   * **IPv4 address:** Paste your AWS EC2 Public IP address here.
   * **Proxy status:** **Proxied (Orange Cloud)**. *(This is crucial! Cloudflare will automatically provide free SSL/HTTPS for you, so you don't need to manually configure certificates on AWS).*
5. Click **Save**.

---

## Part 2: AWS EC2 Server Setup

### Step 1: Launch the Instance

1. Go to the AWS Console -> **EC2** -> **Launch Instance**.
2. **Name:** NoteSage-Server
3. **OS:** Ubuntu 24.04 LTS (or 22.04 LTS).
4. **Instance Type:** `t3.small` or `t3.medium` (Next.js and pgvector need at least 2GB of RAM to build and run smoothly. Do not use t2.micro).
5. **Key Pair:** Create a new key pair (save the `.pem` file to your computer) or use an existing one.
6. **Network Settings (Security Group):**
   * Allow SSH traffic from anywhere.
   * Allow HTTP traffic from the internet (Port 80).
   * Allow HTTPS traffic from the internet (Port 443).
7. **Storage:** At least 20GB.
8. Click **Launch**.

### Step 2: SSH into your Server

Open your terminal on your local computer and connect using the key you downloaded:

```bash
# Fix permissions on your key (Mac/Linux only)
chmod 400 your-key.pem

# SSH into the server (replace with your actual IP)
ssh -i "your-key.pem" ubuntu@YOUR_AWS_PUBLIC_IP
```

### Step 3: Install Docker and Git

Once inside the AWS server, run these commands to install Docker and Git:

```bash
sudo apt update
sudo apt install docker.io docker-compose git -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```

*(You may need to log out by typing `exit` and SSH back in for the Docker permissions to apply).*

### Step 4: Clone Your Code and Add Private Keys

```bash
cd NoteSage# Clone your repository
git clone https://github.com/Shubhamkr585/NoteSage.git
cd NoteSage

# Create your private environment file
nano .env
```

This will open a text editor inside the terminal. Paste your production environment variables here:

```env
DATABASE_URL=postgresql://postgres:notesage_secure_pass_123@db:5432/notesage?schema=public
BETTER_AUTH_SECRET=your_super_secret_string_here
GEMINI_API_KEY=your_gemini_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket
```

Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.

### Step 5: Start the Application!

Now that your code is on the server and your `.env` is securely created, just start Docker:

```bash
docker-compose up -d --build
```

* **What this does:** It builds your Next.js application into a standalone Docker image and downloads the `pgvector` Postgres database.
* **Note:** The first build will take 3-5 minutes depending on your server size.

---

## Part 3: Verify Deployment

Because we configured your `docker-compose.yml` to map port `80` to your Next.js app's port `3000`, the app will automatically serve traffic on standard HTTP.

Because you set the Cloudflare DNS record to **Proxied (Orange Cloud)** in Part 1, Cloudflare intercepts requests to `https://notesage.traffic-intel.online`, provides the green padlock (HTTPS), and safely routes the traffic to port 80 on your AWS server.

You can now visit:
**`https://notesage.traffic-intel.online`**

### Post-Deployment (Database Push)

Once the container is running, you need to push your Prisma schema to the new production database so your tables are created. Run this command on your AWS server:

```bash
docker-compose exec app npx prisma db push
```

You are officially live!
