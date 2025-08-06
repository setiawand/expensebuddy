# 🚀 ExpenseBuddy Deployment Guide

This guide explains how to deploy ExpenseBuddy to your VM server using GitHub Actions for automatic deployment.

## 📋 Prerequisites

### On Your VM Server:
- Ubuntu/Debian Linux (or similar)
- Docker and Docker Compose installed
- Git installed
- SSH access enabled
- Ports 3000 and 8004 open

### On GitHub:
- Repository with admin access
- Ability to add secrets

## 🔧 Server Setup

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Verify Docker installation
docker --version

# Docker Compose V2 is included with Docker by default
# Verify Docker Compose installation
docker compose version
```

### 2. Clone Repository on Server

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/expensebuddy.git
cd expensebuddy

# Make sure you're on the master branch
git checkout master
```

### 3. Set Up Environment Variables

```bash
# Create environment file for frontend
cp frontend/.env.example frontend/.env.local

# Edit the environment file
nano frontend/.env.local
```

Add your actual values:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://your-server-ip:3000
NEXT_PUBLIC_API_URL=http://your-server-ip:8004
```

## 🔐 GitHub Actions Setup

### 1. Generate SSH Key Pair

On your local machine:
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@expensebuddy"

# This creates:
# - Private key: ~/.ssh/id_rsa (keep this secret)
# - Public key: ~/.ssh/id_rsa.pub (add to server)
```

### 2. Add Public Key to Server

On your VM server:
```bash
# Add the public key to authorized_keys
mkdir -p ~/.ssh
echo "your_public_key_content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_PRIVATE_KEY` | Private SSH key content | Content of `~/.ssh/id_rsa` |
| `SERVER_HOST` | Your server IP or domain | `192.168.1.100` or `your-domain.com` |
| `SSH_USER` | SSH username | `ubuntu` or `root` |

### 4. Update Deployment Path

Edit `.github/workflows/deploy.yml` and update the path:
```yaml
# Change this line:
cd /path/to/your/expensebuddy || exit 1

# To your actual path:
cd /home/ubuntu/expensebuddy || exit 1
```

## 🌐 Accessing Your Application

After successful deployment, your ExpenseBuddy application will be accessible at:

### On Your VM Server (103.84.206.186):
- **Frontend**: `http://103.84.206.186:3000`
- **Backend API**: `http://103.84.206.186:8004`
- **API Documentation**: `http://103.84.206.186:8004/docs`

### Port Configuration:
- **Frontend**: Exposed on port `3000`
- **Backend**: Exposed on port `8004`
- **Internal Communication**: Frontend connects to backend via Docker network (`http://backend:8004`)

### Firewall Configuration:
Make sure your VM firewall allows incoming connections on ports 3000 and 8004:

```bash
# For Ubuntu/Debian with ufw
sudo ufw allow 3000
sudo ufw allow 8004
sudo ufw status

# For CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8004/tcp
sudo firewall-cmd --reload

# Check if ports are open
sudo netstat -tlnp | grep -E ':(3000|8004)'
```

### Testing Access:
```bash
# Test from your local machine
curl -I http://103.84.206.186:3000
curl -I http://103.84.206.186:8004/docs

# Test from the server itself (via SSH)
curl -I http://localhost:3000
curl -I http://localhost:8004/docs
```

### Option 1: Automatic Deployment (GitHub Actions)

Once configured, deployment happens automatically:
- Push to `master` branch triggers deployment
- GitHub Actions will SSH to your server
- Pull latest code and restart services

### Option 2: Manual Deployment

If you prefer to deploy manually or need to troubleshoot:

```bash
# SSH into your server
ssh username@your_server_ip

# Navigate to project directory
cd /path/to/expensebuddy

# Run deployment script
./deploy.sh

# Or run commands manually:
git pull origin master
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

## 🧹 Disk Space Management

The deployment script includes comprehensive cleanup to save VM disk space:

### Automatic Cleanup (After Each Deployment)
- **Unused Docker images** (including intermediate layers)
- **Unused Docker volumes** (orphaned data)
- **Unused Docker networks** (disconnected networks)
- **Docker build cache** (temporary build files)
- **System-wide cleanup** (containers, networks, images, cache)

### Manual Cleanup Commands
```bash
# Remove all unused Docker resources
docker system prune -a -f

# Remove specific resources
docker image prune -a -f      # Remove unused images
docker volume prune -f        # Remove unused volumes
docker network prune -f       # Remove unused networks
docker builder prune -f       # Remove build cache

# Check disk usage
docker system df
```

### Monitoring Disk Usage
```bash
# Check overall disk usage
df -h

# Check Docker disk usage
docker system df

# Check largest directories
du -sh /* 2>/dev/null | sort -hr | head -10
## 🔍 Monitoring and Troubleshooting

### Health Check Process

The deployment includes robust health checks with:
- **10 retry attempts** for each service
- **15-second intervals** between attempts
- **10-second connection timeout** per attempt
- **30-second maximum time** per request
- **Automatic log display** on failure

### Check Service Status

```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Check service logs
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend

# Check specific container logs
docker logs expensebuddy-frontend-1
docker logs expensebuddy-backend-1
```

### Manual Health Checks

```bash
# Test frontend
curl -f http://localhost:3000

# Test backend API
curl -f http://localhost:8004/docs

# Test backend health endpoint
curl -f http://localhost:8004/health
```

### Common Issues

1. **Port Already in Use**
   ```bash
   # Stop existing services
   docker-compose -f docker-compose.prod.yml down
   
   # Kill processes using the ports
   sudo lsof -ti:3000 | xargs kill -9
   sudo lsof -ti:8004 | xargs kill -9
   ```

2. **Permission Denied**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER /path/to/expensebuddy
   ```

3. **Database Issues**
   ```bash
   # Reset database (WARNING: This deletes all data)
   rm backend/expenses.db
   docker-compose -f docker-compose.prod.yml restart backend
   ```

### Health Checks

After deployment, verify services:
- Frontend: `http://your-server-ip:3000`
- Backend API: `http://your-server-ip:8004`
- API Docs: `http://your-server-ip:8004/docs`

## 🔒 Security Considerations

1. **Firewall Setup**
   ```bash
   # Allow SSH, HTTP, and your app ports
   sudo ufw allow ssh
   sudo ufw allow 3000
   sudo ufw allow 8004
   sudo ufw enable
   ```

2. **SSL/HTTPS** (Recommended for production)
   - Use nginx as reverse proxy
   - Set up Let's Encrypt certificates
   - Update environment variables to use HTTPS URLs

3. **Environment Variables**
   - Never commit `.env` files to git
   - Use strong, unique secrets
   - Regularly rotate API keys

## 📝 Maintenance

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up Docker
docker system prune -f
```

### Backup Database
```bash
# Backup SQLite database
cp backend/expenses.db backup/expenses_$(date +%Y%m%d_%H%M%S).db
```

## 🆘 Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables are set correctly
3. Ensure all ports are accessible
4. Check GitHub Actions logs for deployment issues

---

**Happy Deploying! 🎉**