# TailorPal Deployment Guide

This guide walks you through deploying TailorPal to production.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Environment variables set correctly
- [ ] Database schema migrated
- [ ] All tests passing locally
- [ ] GitHub repository connected (if using Vercel)

## Deployment to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Step 1: Prepare Your Repository

Push your code to GitHub:
```bash
git add .
git commit -m "TailorPal v1.0.0"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js configuration

### Step 3: Environment Variables

Add these variables in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional (for Groq voice assistant):
```
GROQ_API_KEY=your_groq_api_key
```

### Step 4: Deploy

1. Click "Deploy"
2. Vercel builds and deploys automatically
3. Your app is live at `https://your-project.vercel.app`

### Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Configure SSL certificate (automatic)

## Self-Hosted Deployment

### Requirements

- Node.js 18+
- npm/pnpm
- Reverse proxy (nginx/Apache)
- SSL certificate

### Deployment Steps

1. **Build the Application**
```bash
pnpm install
pnpm build
```

2. **Start Production Server**
```bash
pnpm start
```

Server runs on `http://localhost:3000`

3. **Configure Reverse Proxy**

**nginx example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable HTTPS**
```bash
sudo certbot certonly --nginx -d yourdomain.com
```

5. **Start Service**
Use PM2 for process management:
```bash
npm install -g pm2
pm2 start "pnpm start" --name "tailorpal"
pm2 startup
pm2 save
```

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm prune

COPY .next ./
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t tailorpal:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  tailorpal:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

Deploy with:
```bash
docker-compose up -d
```

## Database Migration

### Supabase Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Get your URL and anon key
3. Run migrations manually:
   - Go to SQL Editor
   - Copy contents of `scripts/001_create_schema.sql`
   - Execute in SQL Editor
   - Copy contents of `scripts/002_create_profile_trigger.sql`
   - Execute in SQL Editor

### Automated Setup (Alternative)

Use Node.js script:
```bash
node scripts/setup-database.js
```

## SSL/TLS Setup

### Vercel
Automatic SSL for all deployments.

### Self-Hosted with Let's Encrypt

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Renew automatically
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
```

## Monitoring & Logging

### Vercel Analytics
Available in Vercel Dashboard → Analytics

### Self-Hosted Monitoring

Use PM2 Plus:
```bash
pm2 plus
```

Or setup ELK stack for logs:
```bash
# Using Docker
docker run -d --name elasticsearch \
  -e discovery.type=single-node \
  docker.elastic.co/elasticsearch/elasticsearch:8.0.0

docker run -d --name kibana -p 5601:5601 \
  docker.elastic.co/kibana/kibana:8.0.0
```

## Scaling

### Horizontal Scaling

For high traffic, use load balancing:

```nginx
upstream tailorpal_backend {
    server app1.example.com;
    server app2.example.com;
    server app3.example.com;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://tailorpal_backend;
        proxy_set_header Host $host;
    }
}
```

### Database Optimization

Supabase provides:
- Automatic backups
- Replication
- Connection pooling via PgBouncer
- Performance monitoring

## Maintenance

### Regular Tasks

- Monitor application logs
- Update dependencies: `pnpm update`
- Review security updates
- Check database performance
- Monitor user analytics

### Backups

Supabase automatically backs up your database daily. You can also:
1. Go to Supabase Dashboard → Backups
2. Download backup anytime
3. Create manual backups before major changes

## Troubleshooting

### 502 Bad Gateway

Check if app is running:
```bash
pm2 status
pm2 logs tailorpal
```

### Environment Variables Not Loading

Verify in Vercel Dashboard:
- Settings → Environment Variables
- Redeploy after adding variables

### Database Connection Issues

Check in Supabase Dashboard:
- Project Settings → Database
- Verify connection string
- Check Row Level Security policies

### Voice Assistant Not Working

- Check Groq API key if set
- Verify Vercel AI Gateway access
- Check browser console for Speech API errors

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Supabase docs: https://supabase.com/docs
- GitHub Issues for TailorPal bugs

---

**Happy deploying!**
