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
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
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

## 🚀 Deployment Options

### Option 1: Automatic Deployment (GitHub Actions)

Once configured, deployment happens automatically:
- Push to `master` branch triggers deployment
- GitHub Actions will SSH to your server
- Pull latest code and restart services

### Option 2: Manual Deployment

On your server:
```bash
cd /path/to/expensebuddy
./deploy.sh
```

## 🔍 Monitoring and Troubleshooting

### Check Service Status
```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
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