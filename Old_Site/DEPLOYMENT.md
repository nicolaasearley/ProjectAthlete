# Deployment Guide: Unraid + Cloudflare Tunnel

This guide walks you through deploying the Fitness Programming app on your Unraid server with Cloudflare Tunnel for external access.

## Prerequisites

- Unraid server with Docker enabled
- Cloudflare account with a domain
- Cloudflare Tunnel (cloudflared) installed and configured
- Access to your Unraid server's web interface

## Step 1: Prepare Your Application Files

1. Copy the entire project folder to your Unraid server (e.g., to `/mnt/user/appdata/fitness-programming/`)

2. Generate a secure secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
Save this key - you'll need it for the environment variable.
9a3c96cfe533489f0433a00e81e14f9dda4c0240a7fc782348e9660a62de59c3
## Step 2: Deploy with Docker on Unraid

### Option A: Using Docker Compose (Recommended)

1. **Via Unraid UI (Community Applications):**
   - Install "Docker Compose" if not already installed
   - Go to Docker tab → Add Container
   - Select "Use Docker Compose"
   - Point to your `docker-compose.yml` file

2. **Via Terminal/SSH:**
   ```bash
   cd /mnt/user/appdata/fitness-programming
   docker-compose up -d
   ```

### Option B: Using Unraid's Docker UI

1. Go to Unraid Dashboard → Docker tab
2. Click "Add Container"
3. Configure:
   - **Name**: `fitness-programming`
   - **Repository**: Build from Dockerfile (local)
   - **Network Type**: Bridge
   - **Port Mappings**: 
     - Container Port: `5000`
     - Host Port: `5001` (or your preferred port)
   - **Paths**:
     - Add Path: `/mnt/user/appdata/fitness-programming/instance` → Container: `/app/instance`
   - **Environment Variables**:
     - `SECRET_KEY`: (paste the secret key you generated)
     - `DATABASE_URL`: `sqlite:///instance/workouts.db`
     - `FLASK_DEBUG`: `False`
     - `PORT`: `5000`

## Step 3: Configure Cloudflare Tunnel

### 3.1 Install Cloudflare Tunnel (if not already installed)

If you're using the Cloudflare Tunnel Docker container on Unraid, skip to step 3.2.

### 3.2 Create/Update Tunnel Configuration

In your Cloudflare Tunnel config file (typically in the cloudflared container's config directory):

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  # Your fitness programming app
  - hostname: fitness.yourdomain.com  # Replace with your subdomain
    service: http://unraid-server-ip:5001  # Use your Unraid server's IP and the port you mapped
  # Catch-all rule (keep this last)
  - service: http_status:404
```

**Important Notes:**
- Replace `fitness.yourdomain.com` with your desired subdomain
- Replace `unraid-server-ip` with your Unraid server's local IP (e.g., `192.168.1.100`)
- Use the **host port** you configured (e.g., `5001`), not the container port

### 3.3 Create DNS Record in Cloudflare

1. Go to Cloudflare Dashboard → DNS → Records
2. Add a new record:
   - **Type**: CNAME
   - **Name**: `fitness` (or your preferred subdomain)
   - **Target**: Your tunnel's hostname (e.g., `your-tunnel-id.cfargotunnel.com`)
   - **Proxy status**: Proxied (orange cloud)
3. Save

### 3.4 Restart Cloudflare Tunnel

Restart your cloudflared container/service to apply changes.

## Step 4: Verify Deployment

1. **Check container is running:**
   ```bash
   docker ps | grep fitness-programming
   ```

2. **Check logs:**
   ```bash
   docker logs fitness-programming
   ```

3. **Test locally:**
   - Visit `http://your-unraid-ip:5001` (should show the public workout page)

4. **Test via Cloudflare Tunnel:**
   - Visit `https://fitness.yourdomain.com` (should show the public workout page)

## Step 5: Initial Setup

1. Visit your app (locally or via tunnel)
2. Click "Admin" → Login
3. Default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
4. **IMPORTANT**: Change the admin password immediately after first login!

## Maintenance & Updates

### Updating the Application

1. Stop the container:
   ```bash
   docker-compose down
   # or
   docker stop fitness-programming
   ```

2. Pull/update your code files

3. Rebuild and restart:
   ```bash
   docker-compose build
   docker-compose up -d
   # or let Unraid UI handle it
   ```

### Backup Database

The database is stored in `./instance/workouts.db`. To backup:

```bash
# Via Unraid file system
cp /mnt/user/appdata/fitness-programming/instance/workouts.db /mnt/user/backups/workouts_$(date +%Y%m%d).db

# Or via Docker
docker exec fitness-programming cp /app/instance/workouts.db /app/logs/backup.db
docker cp fitness-programming:/app/logs/backup.db /mnt/user/backups/
```

### View Logs

```bash
docker logs -f fitness-programming
```

## Security Considerations

1. **Change the default admin password** immediately
2. **Use a strong SECRET_KEY** (generate with the command in Step 1)
3. **Keep Cloudflare Tunnel updated**
4. **Consider adding Cloudflare Access** for additional authentication
5. **Regular backups** of the database file

## Troubleshooting

### Container won't start
- Check logs: `docker logs fitness-programming`
- Verify port 5001 isn't in use: `netstat -tuln | grep 5001`
- Check file permissions on the instance directory

### Can't access via Cloudflare Tunnel
- Verify tunnel config has correct hostname and service URL
- Check Cloudflare DNS record is correct and proxied
- Verify tunnel container is running: `docker ps | grep cloudflared`
- Check tunnel logs for connection errors

### Database issues
- Ensure `./instance` directory is properly mounted
- Check file permissions (should be writable by container)
- Verify `DATABASE_URL` environment variable is correct

## Port Reference

- **Container Port**: 5000 (internal)
- **Host Port**: 5001 (can be changed in docker-compose.yml or Unraid UI)
- **Cloudflare Tunnel**: Points to `http://unraid-ip:5001`

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Flask secret key for sessions | (none) | Yes |
| `DATABASE_URL` | SQLite database path | `sqlite:///instance/workouts.db` | No |
| `PORT` | Internal container port | `5000` | No |
| `FLASK_DEBUG` | Enable debug mode | `False` | No |

## Support

For issues specific to:
- **Unraid**: Check Unraid forums
- **Cloudflare Tunnel**: Cloudflare Tunnel documentation
- **Application**: Check application logs and this repository
