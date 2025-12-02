# Workout Programming Webapp

A mobile-first workout programming web application for coaches to create and manage team workout schedules. Features a swipeable weekly calendar view for athletes and a comprehensive admin interface for coaches.

## Features

- **Public View**: Mobile-first design with swipeable weekly calendar
  - Swipe left/right to navigate between weeks
  - Click any day to view that day's workout
  - Displays structured workout information with exercises, sets, reps, weight, tempo, rest, and notes

- **Coach Admin Interface**: 
  - Secure login system for coaches
  - Create, edit, and delete workouts
  - Structured exercise editor with fields for:
    - Exercise name
    - Sets
    - Reps
    - Weight
    - Tempo
    - Rest period
    - Notes
  - Calendar view of all scheduled workouts

## Tech Stack

- **Backend**: Python Flask
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Calendar**: Swiper.js for swipeable calendar
- **Authentication**: Flask-Login for session management

## Installation

### Prerequisites

- Python 3.9 or higher (Python 3.10+ recommended)
- pip (Python package installer)

**Note**: If you're using Python 3.9, the code automatically uses PBKDF2 password hashing for compatibility.

### Setup Steps

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize the database**:
   The database will be automatically created when you first run the application.

4. **Set environment variables (optional)**:
   ```bash
   export SECRET_KEY="your-secret-key-here"
   export DATABASE_URL="sqlite:///workouts.db"
   export PORT=5000
   export FLASK_DEBUG=False
   ```
   
   For production, generate a strong SECRET_KEY:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

5. **Run the application**:
   ```bash
   python run.py
   ```
   
   Or directly:
   ```bash
   python app.py
   ```

6. **Access the application**:
   - Public view: http://localhost:5000
   - Admin login: http://localhost:5000/admin/login
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`
     
   **Important**: Change the default password immediately after first login!

## Creating Additional Coach Accounts

After logging in as admin, you can create additional coach accounts by making a POST request to `/api/coaches/register`:

```bash
curl -X POST http://localhost:5000/api/coaches/register \
  -H "Content-Type: application/json" \
  -d '{"username": "coach2", "password": "secure-password"}'
```

Or add this functionality to the admin dashboard UI if needed.

## Deployment on Home Server

### Option 1: Direct Python Run (Development/Simple Setup)

1. Follow installation steps above on your server
2. Run the application: `python run.py`
3. Configure your web server (nginx/Apache) as a reverse proxy
4. Set up a firewall rule to allow traffic on your chosen port

### Option 2: Systemd Service (Recommended for Production)

1. Create a systemd service file at `/etc/systemd/system/workout-app.service`:

```ini
[Unit]
Description=Workout Programming Webapp
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/FitnessProgramming
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="SECRET_KEY=your-secret-key-here"
Environment="DATABASE_URL=sqlite:////path/to/FitnessProgramming/workouts.db"
Environment="PORT=5000"
Environment="FLASK_DEBUG=False"
ExecStart=/usr/bin/python3 /path/to/FitnessProgramming/run.py
Restart=always

[Install]
WantedBy=multi-user.target
```

2. Enable and start the service:
```bash
sudo systemctl enable workout-app
sudo systemctl start workout-app
sudo systemctl status workout-app
```

### Nginx Reverse Proxy Configuration

Add to your nginx configuration (e.g., `/etc/nginx/sites-available/default`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then restart nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### SSL/HTTPS Setup (Recommended)

Use Let's Encrypt with Certbot:

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Database Backup

The SQLite database file is `workouts.db` in the project directory. To backup:

```bash
cp workouts.db workouts_backup_$(date +%Y%m%d).db
```

## Upgrading to PostgreSQL (Optional)

If you need a more robust database for larger deployments:

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE workouts;
   ```
3. Update `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/workouts"
   ```
4. Install additional dependency:
   ```bash
   pip install psycopg2-binary
   ```
5. The existing SQLAlchemy models will work without changes!

## Security Considerations

1. **Change default admin password** immediately
2. **Use a strong SECRET_KEY** in production
3. **Enable HTTPS** for secure connections
4. **Keep dependencies updated**: `pip install --upgrade -r requirements.txt`
5. **Regular backups** of the database file
6. **Firewall configuration**: Only expose necessary ports

## Future Enhancements

The database schema and architecture are designed to support:
- Individual team member accounts
- Workout templates and copying
- Exercise library with history
- Multiple teams per coach
- Progress tracking per athlete

## Troubleshooting

### Database locked errors
- Ensure only one instance of the app is running
- Check file permissions on `workouts.db`

### Port already in use
- Change the PORT environment variable
- Or kill the process using the port: `lsof -ti:5000 | xargs kill`

### Can't access from other devices
- Ensure the app is running on `0.0.0.0` not `127.0.0.1`
- Check firewall rules
- Verify router port forwarding if accessing from outside network

## License

This project is for internal team use.

## Support

For issues or questions, check the code comments or review the Flask and SQLAlchemy documentation.
