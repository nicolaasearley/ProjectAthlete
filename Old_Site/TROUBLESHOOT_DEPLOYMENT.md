# Troubleshooting: Changes Not Reflecting

If your changes aren't showing up after deployment, try these solutions:

## Quick Fixes

### 1. Hard Refresh Browser (Most Common Issue)
- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: `Cmd+Option+R`

Static files (CSS/JS) are often cached by browsers.

### 2. Clear Browser Cache
- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or: Settings → Clear browsing data → Cached images and files

### 3. Restart Container
```bash
docker restart fitness-programming
```

### 4. Rebuild Without Cache
```bash
docker stop fitness-programming
docker build --no-cache -t nic/fitness-programming:latest .
docker start fitness-programming
```

### 5. Check File Permissions
```bash
# Make sure files are readable
chmod -R 644 static/* templates/* app.py run.py
chmod 755 static templates
```

### 6. Verify Volume Mounts
```bash
# Check if files are actually mounted
docker exec fitness-programming ls -la /app/static/
docker exec fitness-programming ls -la /app/templates/
```

### 7. Check Container Logs
```bash
docker logs -f fitness-programming
```
Look for errors or warnings.

### 8. Force Flask Reload (if using development mode)
If `FLASK_DEBUG=True`, Flask should auto-reload. If not, restart container.

### 9. Clear Python Cache
```bash
# On host
find . -type d -name __pycache__ -exec rm -r {} +
find . -name "*.pyc" -delete

# In container
docker exec fitness-programming find /app -name "*.pyc" -delete
docker exec fitness-programming find /app -type d -name __pycache__ -exec rm -r {} +
```

### 10. Complete Fresh Rebuild
```bash
# Stop and remove container
docker stop fitness-programming
docker rm fitness-programming

# Remove old image
docker rmi nic/fitness-programming:latest

# Rebuild from scratch
docker build -t nic/fitness-programming:latest .

# Start fresh
docker-compose up -d
```

## Check What's Actually Running

### Verify File Contents in Container
```bash
# Check if your changes are in the container
docker exec fitness-programming cat /app/static/js/main.js | head -20
docker exec fitness-programming cat /app/app.py | grep -A 5 "def index"
```

### Check File Timestamps
```bash
# On host
ls -lh static/js/main.js
ls -lh templates/index.html

# In container
docker exec fitness-programming ls -lh /app/static/js/main.js
docker exec fitness-programming ls -lh /app/templates/index.html
```

## Common Issues

### Issue: CSS changes not showing
**Solution**: Hard refresh browser (Ctrl+Shift+R) or add cache-busting query string

### Issue: JavaScript changes not showing
**Solution**: Hard refresh browser, check browser console for errors

### Issue: Python code changes not working
**Solution**: Restart container (Python code needs restart, unlike static files)

### Issue: Template changes not showing
**Solution**: Restart container (Flask caches templates)

### Issue: Database changes not working
**Solution**: Check database migrations ran, verify schema matches code

## Using the Fix Script

Run the automated fix script:
```bash
chmod +x fix_deployment.sh
./fix_deployment.sh
```

This will:
1. Stop container
2. Clear Python cache
3. Rebuild without cache
4. Start fresh container

## Still Not Working?

1. **Check if files were actually copied to production**
   ```bash
   ls -lh /mnt/user/www/FitnessProgramming/static/js/main.js
   ```

2. **Compare dev vs production files**
   ```bash
   diff /path/to/dev/FitnessProgramming/static/js/main.js \
        /mnt/user/www/FitnessProgramming/static/js/main.js
   ```

3. **Check Docker volume mounts are working**
   ```bash
   docker inspect fitness-programming | grep -A 10 Mounts
   ```

4. **Verify you're looking at the right URL**
   - Check port mapping: `docker ps` should show `5001:5000`
   - Access via correct port

