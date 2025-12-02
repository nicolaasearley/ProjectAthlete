from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from functools import wraps
import os
import re
import random
from sqlalchemy import inspect, text, func

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configure database URI with proper path handling
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    # Use absolute path for default database location
    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    database_path = os.path.join(instance_path, 'workouts.db')
    database_url = f'sqlite:///{database_path}'
else:
    # Normalize SQLite URIs to use absolute paths
    # sqlite:///path (3 slashes) or sqlite:////path (4 slashes)
    if database_url.startswith('sqlite:///'):
        # Extract the path part
        path_part = database_url[10:]  # Remove 'sqlite:///'
        # If it's a relative path, make it absolute
        if not os.path.isabs(path_part):
            # In Docker, /app is the working directory
            # For relative paths, resolve relative to app directory
            app_dir = os.path.dirname(os.path.abspath(__file__))
            abs_path = os.path.join(app_dir, path_part)
            # Ensure parent directory exists
            parent_dir = os.path.dirname(abs_path)
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)
            database_url = f'sqlite:///{abs_path}'
        else:
            # Absolute path - ensure parent directory exists
            parent_dir = os.path.dirname(path_part)
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)
            database_url = f'sqlite:///{path_part}'

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching of static files in development
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=30)  # Remember login for 30 days
app.config['REMEMBER_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['REMEMBER_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

@login_manager.unauthorized_handler
def unauthorized():
    """Handle unauthorized access - return JSON for API endpoints, redirect for pages"""
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Authentication required'}), 401
    return redirect(url_for('admin_login'))

# Database Models
class Coach(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    role = db.Column(db.String(20), default='admin', nullable=False)  # 'user', 'coach', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_id(self):
        """Return a unique identifier for Flask-Login that includes model type"""
        return f"coach:{self.id}"
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_coach(self):
        return self.role in ['coach', 'admin']
    
    def is_user(self):
        return self.role in ['user', 'coach', 'admin']
    
    def get_initials(self):
        """Get initials for profile icon"""
        first = self.first_name[0].upper() if self.first_name else ''
        last = self.last_name[0].upper() if self.last_name else ''
        if not first and not last:
            return self.username[0].upper() if self.username else '?'
        return f"{first}{last}"

class User(UserMixin, db.Model):
    """Regular users who can log weights and view workouts"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'user', 'coach', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    logged_weights = db.relationship('LoggedWeight', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def get_id(self):
        """Return a unique identifier for Flask-Login that includes model type"""
        return f"user:{self.id}"
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_coach(self):
        return self.role in ['coach', 'admin']
    
    def is_user(self):
        return True  # All User model instances are users
    
    def get_initials(self):
        """Get initials for profile icon"""
        first = self.first_name[0].upper() if self.first_name else ''
        last = self.last_name[0].upper() if self.last_name else ''
        if not first and not last:
            return self.username[0].upper() if self.username else '?'
        return f"{first}{last}"

class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, index=True)
    workout_name = db.Column(db.String(200), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    exercises = db.relationship('Exercise', backref='workout', lazy=True, cascade='all, delete-orphan', order_by='Exercise.order')
    exercise_groups = db.relationship('ExerciseGroup', backref='workout', lazy=True, cascade='all, delete-orphan', order_by='ExerciseGroup.order')
    creator = db.relationship('Coach', backref='workouts')

class ExerciseGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workout.id'), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    group_name = db.Column(db.String(200))
    rounds = db.Column(db.String(50))
    rep_scheme = db.Column(db.String(200))
    notes = db.Column(db.Text)
    
    exercises = db.relationship('Exercise', backref='group', lazy=True, cascade='all, delete-orphan', order_by='Exercise.order')

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workout.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('exercise_group.id'), nullable=True)
    order = db.Column(db.Integer, nullable=False)
    exercise_name = db.Column(db.String(200), nullable=False)
    sets = db.Column(db.String(50))
    reps = db.Column(db.String(50))
    weight = db.Column(db.String(50))
    tempo = db.Column(db.String(50))
    rest = db.Column(db.String(50))
    notes = db.Column(db.Text)
    has_1rm_calculator = db.Column(db.Boolean, default=False, nullable=False)
    has_weight_logging = db.Column(db.Boolean, default=False, nullable=False)

class LoggedWeight(db.Model):
    """Track user's and coach's logged weights for exercises"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    coach_id = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=True)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercise.id'), nullable=False)
    workout_id = db.Column(db.Integer, db.ForeignKey('workout.id'), nullable=False)
    weight = db.Column(db.Float, nullable=False)
    reps = db.Column(db.Integer)
    sets = db.Column(db.Integer)
    date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    exercise = db.relationship('Exercise', backref='logged_weights')
    workout = db.relationship('Workout', backref='logged_weights')

class UserCheckIn(db.Model):
    """Track daily check-ins for users and coaches"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    coach_id = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=True)
    date = db.Column(db.Date, nullable=False, index=True)
    check_in_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='unique_user_checkin'), 
                      db.UniqueConstraint('coach_id', 'date', name='unique_coach_checkin'))

class MurphEntry(db.Model):
    """Track daily Murph challenge progress"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    coach_id = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=True) # Added for coaches/admins
    date = db.Column(db.Date, nullable=False, index=True)
    duration = db.Column(db.String(20)) # "MM:SS" or similar
    rep_scheme = db.Column(db.String(100)) # e.g. "5-10-15", "Cindy"
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Ensure one entry per day per user/coach
    __table_args__ = (
        db.UniqueConstraint('date', 'user_id', name='unique_murph_entry_user'),
        db.UniqueConstraint('date', 'coach_id', name='unique_murph_entry_coach'),
    )

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID, handling both Coach and User models"""
    # Parse the user_id which is now in format "coach:1" or "user:1"
    if ':' in str(user_id):
        model_type, id_value = str(user_id).split(':', 1)
        if model_type == 'coach':
            return Coach.query.get(int(id_value))
        elif model_type == 'user':
            return User.query.get(int(id_value))
    else:
        # Backward compatibility: try to load as integer ID
        # Try Coach first, then User
        coach = Coach.query.get(int(user_id))
        if coach:
            return coach
        return User.query.get(int(user_id))

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            # Return JSON error for API endpoints
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            # Redirect for regular pages
            return redirect(url_for('admin_login'))
        if not (hasattr(current_user, 'is_admin') and current_user.is_admin()):
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Admin access required'}), 403
            return redirect(url_for('admin_dashboard'))
        return f(*args, **kwargs)
    return decorated_function

def coach_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('admin_login'))
        if not (hasattr(current_user, 'is_coach') and current_user.is_coach()):
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Coach access required'}), 403
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Initialize database
def init_db():
    with app.app_context():
        db.create_all()
        
        # Migrate: Add has_1rm_calculator column if it doesn't exist
        try:
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('exercise')]
            if 'has_1rm_calculator' not in columns:
                db.session.execute(text('ALTER TABLE exercise ADD COLUMN has_1rm_calculator BOOLEAN DEFAULT 0'))
                db.session.commit()
                print("Added has_1rm_calculator column to exercise table")
            # Add has_weight_logging column
            if 'has_weight_logging' not in columns:
                db.session.execute(text('ALTER TABLE exercise ADD COLUMN has_weight_logging BOOLEAN DEFAULT 0'))
                db.session.commit()
                print("Added has_weight_logging column to exercise table")
        except Exception as e:
            print(f"Migration check: {e}")
        
        # Migrate: Add coach_id column to logged_weight table and make user_id nullable
        try:
            inspector = inspect(db.engine)
            if 'logged_weight' in inspector.get_table_names():
                logged_weight_columns = [col['name'] for col in inspector.get_columns('logged_weight')]
                
                # Check if migration is needed (user_id is NOT NULL or coach_id doesn't exist)
                needs_migration = False
                if 'coach_id' not in logged_weight_columns:
                    needs_migration = True
                else:
                    # Check if user_id is nullable by checking column info
                    for col in inspector.get_columns('logged_weight'):
                        if col['name'] == 'user_id' and not col.get('nullable', True):
                            needs_migration = True
                            break
                
                if needs_migration:
                    print("Migrating logged_weight table to support nullable user_id and coach_id...")
                    # Create new table with correct schema
                    db.session.execute(text('''
                        CREATE TABLE logged_weight_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER REFERENCES user(id),
                            coach_id INTEGER REFERENCES coach(id),
                            exercise_id INTEGER NOT NULL REFERENCES exercise(id),
                            workout_id INTEGER NOT NULL REFERENCES workout(id),
                            weight REAL NOT NULL,
                            reps INTEGER,
                            sets INTEGER,
                            date DATE NOT NULL,
                            created_at DATETIME
                        )
                    '''))
                    
                    # Copy data from old table
                    db.session.execute(text('''
                        INSERT INTO logged_weight_new 
                        (id, user_id, coach_id, exercise_id, workout_id, weight, reps, sets, date, created_at)
                        SELECT id, user_id, NULL, exercise_id, workout_id, weight, reps, sets, date, created_at
                        FROM logged_weight
                    '''))
                    
                    # Drop old table
                    db.session.execute(text('DROP TABLE logged_weight'))
                    
                    # Rename new table
                    db.session.execute(text('ALTER TABLE logged_weight_new RENAME TO logged_weight'))
                    
                    # Recreate indexes
                    db.session.execute(text('CREATE INDEX ix_logged_weight_date ON logged_weight(date)'))
                    
                    db.session.commit()
                    print("Successfully migrated logged_weight table")
                elif 'coach_id' not in logged_weight_columns:
                    # Just add coach_id if it doesn't exist
                    db.session.execute(text('ALTER TABLE logged_weight ADD COLUMN coach_id INTEGER REFERENCES coach(id)'))
                    db.session.commit()
                    print("Added coach_id column to logged_weight table")
        except Exception as e:
            db.session.rollback()
            print(f"Migration check for logged_weight: {e}")
        
        # Migrate: Create user_check_in table if it doesn't exist
        try:
            inspector = inspect(db.engine)
            if 'user_check_in' not in inspector.get_table_names():
                db.create_all()  # This will create the table if model exists
                print("Created user_check_in table")
            else:
                print("user_check_in table already exists")
        except Exception as e:
            db.session.rollback()
            print(f"Migration check (user_check_in): {e}")

        # Migrate: Create MurphEntry table if it doesn't exist
        try:
            inspector = inspect(db.engine)
            if 'murph_entry' not in inspector.get_table_names():
                MurphEntry.__table__.create(db.engine)
                print("Created murph_entry table")
        except Exception as e:
            db.session.rollback()
            print(f"Migration check (murph_entry): {e}")
        
        # Migrate: Add role column to coach table if it doesn't exist
        try:
            inspector = inspect(db.engine)
            if 'coach' in inspector.get_table_names():
                coach_columns = [col['name'] for col in inspector.get_columns('coach')]
                if 'role' not in coach_columns:
                    db.session.execute(text('ALTER TABLE coach ADD COLUMN role VARCHAR(20) DEFAULT "admin"'))
                    db.session.commit()
                    print("Added role column to coach table")
                # Add first_name and last_name columns
                if 'first_name' not in coach_columns:
                    db.session.execute(text('ALTER TABLE coach ADD COLUMN first_name VARCHAR(100)'))
                    db.session.commit()
                    print("Added first_name column to coach table")
                if 'last_name' not in coach_columns:
                    db.session.execute(text('ALTER TABLE coach ADD COLUMN last_name VARCHAR(100)'))
                    db.session.commit()
                    print("Added last_name column to coach table")
        except Exception as e:
            print(f"Migration check for role: {e}")
        
        # Create User table if it doesn't exist
        try:
            inspector = inspect(db.engine)
            if 'user' not in inspector.get_table_names():
                User.__table__.create(db.engine)
                print("Created user table")
            else:
                # Add first_name and last_name columns to existing user table
                user_columns = [col['name'] for col in inspector.get_columns('user')]
                if 'first_name' not in user_columns:
                    db.session.execute(text('ALTER TABLE user ADD COLUMN first_name VARCHAR(100)'))
                    db.session.commit()
                    print("Added first_name column to user table")
                if 'last_name' not in user_columns:
                    db.session.execute(text('ALTER TABLE user ADD COLUMN last_name VARCHAR(100)'))
                    db.session.commit()
                    print("Added last_name column to user table")
                # Add email column
                if 'email' not in user_columns:
                    db.session.execute(text('ALTER TABLE user ADD COLUMN email VARCHAR(120)'))
                    db.session.commit()
                    print("Added email column to user table")
        except Exception as e:
            print(f"Migration check for user table: {e}")
        
        # Create LoggedWeight table if it doesn't exist
        try:
            inspector = inspect(db.engine)
            if 'logged_weight' not in inspector.get_table_names():
                LoggedWeight.__table__.create(db.engine)
                print("Created logged_weight table")
        except Exception as e:
            print(f"Migration check for logged_weight table: {e}")
        
        # If migration fails, try to recreate tables (only in development)
        if os.environ.get('FLASK_DEBUG', 'False').lower() == 'true':
            try:
                db.create_all()
            except Exception as e:
                print(f"Error creating tables: {e}")
        
        if Coach.query.count() == 0:
            admin = Coach(
                username='admin',
                password_hash=generate_password_hash('admin123', method='pbkdf2:sha256'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Created default admin account: username='admin', password='admin123'")

# Routes - Public
@app.route('/')
def index():
    # Pass user info to template if logged in
    user_info = None
    if current_user.is_authenticated:
        user_info = {
            'id': current_user.id,
            'username': current_user.username,
            'first_name': current_user.first_name if hasattr(current_user, 'first_name') else None,
            'last_name': current_user.last_name if hasattr(current_user, 'last_name') else None,
            'initials': current_user.get_initials() if hasattr(current_user, 'get_initials') else (current_user.username[0].upper() if current_user.username else '?'),
            'role': current_user.role if hasattr(current_user, 'role') else 'user',
            'is_admin': current_user.is_admin() if hasattr(current_user, 'is_admin') else False,
            'is_coach': current_user.is_coach() if hasattr(current_user, 'is_coach') else False
        }
    return render_template('index.html', current_user=user_info)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    # If already logged in, redirect based on role
    if current_user.is_authenticated:
        if hasattr(current_user, 'is_admin') and current_user.is_admin():
            return redirect(url_for('admin_dashboard'))
        elif hasattr(current_user, 'is_coach') and current_user.is_coach():
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('user_profile'))
    
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        username = data.get('username')
        password = data.get('password')
        
        # Try Coach first, then User (case-insensitive username lookup)
        user = Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first()
        if not user:
            user = User.query.filter(func.lower(User.username) == func.lower(username)).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=True)  # Enable persistent login
            if request.is_json:
                # Redirect based on role
                if hasattr(user, 'is_admin') and user.is_admin():
                    redirect_url = url_for('admin_dashboard')
                elif hasattr(user, 'is_coach') and user.is_coach():
                    redirect_url = url_for('admin_dashboard')
                else:
                    redirect_url = url_for('user_profile')
                return jsonify({'success': True, 'redirect': redirect_url})
            else:
                # Redirect based on role
                if hasattr(user, 'is_admin') and user.is_admin():
                    return redirect(url_for('admin_dashboard'))
                elif hasattr(user, 'is_coach') and user.is_coach():
                    return redirect(url_for('admin_dashboard'))
                else:
                    return redirect(url_for('user_profile'))
        else:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            else:
                return render_template('admin_login.html', error='Invalid credentials')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
def admin_dashboard():
    # Only admins and coaches can access the dashboard
    if not (hasattr(current_user, 'is_coach') and current_user.is_coach()):
        return redirect(url_for('user_profile'))
    
    # Determine user type for template
    user_type = 'coach' if isinstance(current_user, Coach) else 'user'
    
    return render_template('admin_dashboard.html', 
                         user_role=current_user.role if hasattr(current_user, 'role') else 'coach', 
                         is_admin=current_user.is_admin() if hasattr(current_user, 'is_admin') else False,
                         current_user_type=user_type)

@app.route('/admin/workouts/all')
@login_required
@coach_required
def all_workouts_page():
    """Page showing all past workouts"""
    return render_template('all_workouts.html',
                         user_role=current_user.role if hasattr(current_user, 'role') else 'coach',
                         is_admin=current_user.is_admin() if hasattr(current_user, 'is_admin') else False)

@app.route('/user/profile')
@login_required
def user_profile():
    return render_template('user_profile.html', page='profile')

@app.route('/user/profile/logged-lifts')
@login_required
def user_logged_lifts():
    return render_template('user_profile.html', page='logged-lifts')

@app.route('/user/profile/checkins')
@login_required
def user_checkins():
    return render_template('user_profile.html', page='checkins')

@app.route('/user/profile/my-workouts')
@login_required
def user_workouts():
    return render_template('user_profile.html', page='my-workouts')

@app.route('/admin/users')
@coach_required
def user_management():
    return render_template('user_management.html', user_role=current_user.role if hasattr(current_user, 'role') else 'coach', is_admin=current_user.is_admin() if hasattr(current_user, 'is_admin') else False)

# Murph Challenge Routes

@app.route('/murph/log', methods=['GET', 'POST'])
@login_required
def murph_log():
    # Determine if current user is a coach or regular user
    is_coach = hasattr(current_user, 'is_coach') and current_user.is_coach()
    user_id = current_user.id if not is_coach else None
    coach_id = current_user.id if is_coach else None
    
    if request.method == 'POST':
        date_str = request.form.get('date')
        duration = request.form.get('duration')
        rep_scheme = request.form.get('rep_scheme')
        if rep_scheme == 'Other':
            rep_scheme = request.form.get('rep_scheme_custom')
            
        notes = request.form.get('notes')
        
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # Check if entry exists
            if is_coach:
                entry = MurphEntry.query.filter_by(date=date_obj, coach_id=coach_id).first()
            else:
                entry = MurphEntry.query.filter_by(date=date_obj, user_id=user_id).first()
            
            if entry:
                entry.duration = duration
                entry.rep_scheme = rep_scheme
                entry.notes = notes
            else:
                entry = MurphEntry(
                    user_id=user_id,
                    coach_id=coach_id,
                    date=date_obj,
                    duration=duration,
                    rep_scheme=rep_scheme,
                    notes=notes
                )
                db.session.add(entry)
            
            db.session.commit()
            return redirect(url_for('murph_tracker'))
        except Exception as e:
            return render_template('murph_input.html', error=str(e), today=date_str)

    # Default to today
    today = datetime.now().strftime('%Y-%m-%d')
    return render_template('murph_input.html', today=today)

@app.route('/murph/tracker')
def murph_tracker():
    # Public view (or shareable)
    # If logged in, show my progress.
    # If not logged in, show the main admin's progress (as this is a personal app).
    
    target_user_id = None
    target_coach_id = None
    
    if current_user.is_authenticated:
        if hasattr(current_user, 'is_coach') and current_user.is_coach():
            target_coach_id = current_user.id
        else:
            target_user_id = current_user.id
    else:
        # Find the main user to display (prioritize 'nic.earley' as owner, then admin)
        target_coach = Coach.query.filter_by(username='nic.earley').first()
        if not target_coach:
            target_coach = Coach.query.filter_by(role='admin').first()
            
        if target_coach:
            target_coach_id = target_coach.id
            
    entries = []
    if target_coach_id:
        entries = MurphEntry.query.filter_by(coach_id=target_coach_id).order_by(MurphEntry.date).all()
    elif target_user_id:
        entries = MurphEntry.query.filter_by(user_id=target_user_id).order_by(MurphEntry.date).all()
        
    # Calculate stats
    total_days = len(entries)
    
    # Simple total time calculation (assuming MM:SS format)
    total_seconds = 0
    valid_times = 0
    
    for entry in entries:
        if entry.duration:
            try:
                parts = entry.duration.split(':')
                if len(parts) == 2:
                    total_seconds += int(parts[0]) * 60 + int(parts[1])
                    valid_times += 1
                elif len(parts) == 3:
                     total_seconds += int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                     valid_times += 1
            except:
                pass
                
    avg_seconds = total_seconds / valid_times if valid_times > 0 else 0
    avg_time_str = f"{int(avg_seconds // 60):02d}:{int(avg_seconds % 60):02d}"
    
    return render_template('murph_public.html', entries=entries, total_days=total_days, avg_time=avg_time_str)

# API Routes - Workouts
@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Workout.query
    
    # Filter based on user access
    # Only coach/admin workouts are public
    # User workouts are only visible to the user who created them
    coach_ids = [c.id for c in Coach.query.all()]
    
    if current_user.is_authenticated:
        # Get current user ID if it's a User (not Coach)
        is_user = isinstance(current_user, User)
        if is_user:
            # Show coach workouts + ONLY this user's own workouts
            query = query.filter(
                db.or_(
                    Workout.created_by.in_(coach_ids),
                    Workout.created_by == current_user.id
                )
            )
        else:
            # Coach/admin sees all workouts (coach workouts + all user workouts)
            pass
    else:
        # Not logged in - show only coach workouts (no user workouts)
        if coach_ids:
            query = query.filter(Workout.created_by.in_(coach_ids))
        else:
            query = query.filter(False)  # No coaches exist, return empty
    
    if start_date:
        query = query.filter(Workout.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Workout.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    workouts = query.order_by(Workout.date).all()
    
    result = []
    for workout in workouts:
        # Get creator information - check both Coach and User tables
        creator = None
        creator_name = None
        creator_initials = None
        
        # Try Coach first
        creator = Coach.query.get(workout.created_by)
        if not creator:
            # If not found in Coach, try User table
            creator = User.query.get(workout.created_by)
        
        if creator:
            if hasattr(creator, 'first_name') and creator.first_name and hasattr(creator, 'last_name') and creator.last_name:
                creator_name = f"{creator.first_name} {creator.last_name}"
            else:
                creator_name = creator.username
            creator_initials = creator.get_initials() if hasattr(creator, 'get_initials') else (creator.username[0].upper() if creator.username else '?')
        
        standalone_exercises = [ex for ex in workout.exercises if ex.group_id is None]
        groups = []
        for group in sorted(workout.exercise_groups, key=lambda x: x.order):
            groups.append({
                'id': group.id,
                'order': group.order,
                'group_name': group.group_name,
                'rounds': group.rounds,
                'rep_scheme': group.rep_scheme,
                'notes': group.notes,
                'exercises': [{
                    'id': ex.id,
                    'order': ex.order,
                    'exercise_name': ex.exercise_name,
                    'sets': ex.sets,
                    'reps': ex.reps,
                    'weight': ex.weight,
                    'tempo': ex.tempo,
                    'rest': ex.rest,
                    'notes': ex.notes,
                    'has_1rm_calculator': ex.has_1rm_calculator,
                    'has_weight_logging': ex.has_weight_logging
                } for ex in sorted(group.exercises, key=lambda x: x.order)]
            })
        
        result.append({
            'id': workout.id,
            'date': workout.date.isoformat(),
            'workout_name': workout.workout_name,
            'created_by': workout.created_by,
            'creator_name': creator_name,
            'creator_initials': creator_initials,
            'exercises': [{
                'id': ex.id,
                'order': ex.order,
                'exercise_name': ex.exercise_name,
                'sets': ex.sets,
                'reps': ex.reps,
                'weight': ex.weight,
                'tempo': ex.tempo,
                'rest': ex.rest,
                'notes': ex.notes,
                'has_1rm_calculator': ex.has_1rm_calculator
            } for ex in sorted(standalone_exercises, key=lambda x: x.order)],
            'exercise_groups': groups
        })
    
    return jsonify(result)

@app.route('/api/workouts/<int:workout_id>', methods=['GET'])
def get_workout(workout_id):
    workout = Workout.query.get_or_404(workout_id)
    
    # Check access: user workouts are private, coach workouts are public
    coach_ids = [c.id for c in Coach.query.all()]
    is_coach_workout = workout.created_by in coach_ids
    
    if not is_coach_workout:
        # This is a user workout - check if current user has access
        if not current_user.is_authenticated:
            return jsonify({'error': 'Access denied'}), 403
        
        is_user = isinstance(current_user, User)
        if is_user:
            # Regular user can only see their own workouts
            if workout.created_by != current_user.id:
                return jsonify({'error': 'Access denied'}), 403
        # Coach/admin can see all user workouts, so allow access
    
    # Get creator information - check both Coach and User tables
    creator = None
    creator_name = None
    creator_initials = None
    
    # Try Coach first
    creator = Coach.query.get(workout.created_by)
    if not creator:
        # If not found in Coach, try User table
        creator = User.query.get(workout.created_by)
    
    if creator:
        if hasattr(creator, 'first_name') and creator.first_name and hasattr(creator, 'last_name') and creator.last_name:
            creator_name = f"{creator.first_name} {creator.last_name}"
        else:
            creator_name = creator.username
        creator_initials = creator.get_initials() if hasattr(creator, 'get_initials') else (creator.username[0].upper() if creator.username else '?')
    
    standalone_exercises = [ex for ex in workout.exercises if ex.group_id is None]
    
    groups = []
    for group in sorted(workout.exercise_groups, key=lambda x: x.order):
        groups.append({
            'id': group.id,
            'order': group.order,
            'group_name': group.group_name,
            'rounds': group.rounds,
            'rep_scheme': group.rep_scheme,
            'notes': group.notes,
            'exercises': [{
                'id': ex.id,
                'order': ex.order,
                'exercise_name': ex.exercise_name,
                'sets': ex.sets,
                'reps': ex.reps,
                'weight': ex.weight,
                'tempo': ex.tempo,
                'rest': ex.rest,
                'notes': ex.notes,
                'has_1rm_calculator': ex.has_1rm_calculator,
                'has_weight_logging': ex.has_weight_logging
            } for ex in sorted(group.exercises, key=lambda x: x.order)]
        })
    
    return jsonify({
        'id': workout.id,
        'date': workout.date.isoformat(),
        'workout_name': workout.workout_name,
        'created_by': workout.created_by,
        'created_by_type': 'coach' if Coach.query.get(workout.created_by) else ('user' if User.query.get(workout.created_by) else None),
        'creator_name': creator_name,
        'creator_initials': creator_initials,
        'exercises': [{
            'id': ex.id,
            'order': ex.order,
            'exercise_name': ex.exercise_name,
            'sets': ex.sets,
            'reps': ex.reps,
            'weight': ex.weight,
            'tempo': ex.tempo,
            'rest': ex.rest,
            'notes': ex.notes,
            'has_1rm_calculator': ex.has_1rm_calculator,
            'has_weight_logging': ex.has_weight_logging
        } for ex in sorted(standalone_exercises, key=lambda x: x.order)],
        'exercise_groups': groups
    })

@app.route('/api/workouts', methods=['POST'])
@coach_required
def create_workout():
    try:
        data = request.get_json()
        
        if not data or 'date' not in data or 'workout_name' not in data:
            return jsonify({'error': 'Missing required fields: date and workout_name'}), 400
        
        workout_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        # REMOVED: No longer checking for duplicate dates - allow multiple workouts per day
        
        workout = Workout(
            date=workout_date,
            workout_name=data['workout_name'],
            created_by=data.get('created_by', current_user.id)
        )
        
        db.session.add(workout)
        db.session.flush()
        
        order_counter = 0
        
        # Add standalone exercises
        for exercise_data in data.get('exercises', []):
            if not exercise_data.get('exercise_name'):
                continue
            exercise = Exercise(
                workout_id=workout.id,
                group_id=None,
                order=order_counter,
                exercise_name=exercise_data.get('exercise_name', ''),
                sets=exercise_data.get('sets', ''),
                reps=exercise_data.get('reps', ''),
                weight=exercise_data.get('weight', ''),
                tempo=exercise_data.get('tempo', ''),
                rest=exercise_data.get('rest', ''),
                notes=exercise_data.get('notes', ''),
                has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                has_weight_logging=exercise_data.get('has_weight_logging', False)
            )
            db.session.add(exercise)
            order_counter += 1
        
        # Add exercise groups
        for group_data in data.get('exercise_groups', []):
            group = ExerciseGroup(
                workout_id=workout.id,
                order=order_counter,
                group_name=group_data.get('group_name', ''),
                rounds=group_data.get('rounds', ''),
                rep_scheme=group_data.get('rep_scheme', ''),
                notes=group_data.get('notes', '')
            )
            db.session.add(group)
            db.session.flush()
            order_counter += 1
            
            # Add exercises to the group
            for idx, exercise_data in enumerate(group_data.get('exercises', [])):
                if not exercise_data.get('exercise_name'):
                    continue
                exercise = Exercise(
                    workout_id=workout.id,
                    group_id=group.id,
                    order=idx,
                    exercise_name=exercise_data.get('exercise_name', ''),
                    sets=exercise_data.get('sets', ''),
                    reps=exercise_data.get('reps', ''),
                    weight=exercise_data.get('weight', ''),
                    tempo=exercise_data.get('tempo', ''),
                    rest=exercise_data.get('rest', ''),
                    notes=exercise_data.get('notes', ''),
                    has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                    has_weight_logging=exercise_data.get('has_weight_logging', False)
                )
                db.session.add(exercise)
        
        db.session.commit()
        
        return jsonify({'id': workout.id, 'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create workout: {str(e)}'}), 500

def is_main_lift(exercise_name, weight, notes):
    """Detect if an exercise is a main lift based on name patterns and weight percentages"""
    if not exercise_name:
        return False
    
    exercise_lower = exercise_name.lower()
    main_lift_keywords = ['squat', 'bench', 'deadlift', 'press', 'clean', 'snatch', 'jerk']
    
    # Check if exercise name contains main lift keywords
    if any(keyword in exercise_lower for keyword in main_lift_keywords):
        return True
    
    # Check if weight or notes contain percentage indicators
    weight_str = str(weight) if weight else ''
    notes_str = str(notes) if notes else ''
    combined = (weight_str + ' ' + notes_str).lower()
    
    if '%' in combined or 'percent' in combined:
        return True
    
    return False

def generate_variation(exercise_name, sets, reps, weight, notes):
    """Generate creative variations for accessory exercises"""
    if not exercise_name:
        return exercise_name, sets, reps, weight, notes
    
    exercise_lower = exercise_name.lower()
    
    # Exercise variations database
    variations = {
        'row': ['Barbell Row', 'Cable Row', 'Dumbbell Row', 'T-Bar Row', 'Chest Supported Row'],
        'pull': ['Pull-up', 'Chin-up', 'Lat Pulldown', 'Cable Pull-down'],
        'push': ['Push-up', 'Dumbbell Press', 'Cable Press', 'Incline Press'],
        'curl': ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Cable Curl'],
        'extension': ['Tricep Extension', 'Overhead Extension', 'Cable Extension', 'Dumbbell Extension'],
        'raise': ['Lateral Raise', 'Front Raise', 'Rear Delt Raise', 'Cable Raise'],
        'fly': ['Dumbbell Fly', 'Cable Fly', 'Pec Deck'],
        'press': ['Shoulder Press', 'Arnold Press', 'Push Press', 'Seated Press'],
        'squat': ['Goblet Squat', 'Front Squat', 'Bulgarian Split Squat', 'Box Squat'],
        'lunge': ['Walking Lunge', 'Reverse Lunge', 'Lateral Lunge', 'Dumbbell Lunge'],
        'leg': ['Leg Press', 'Leg Extension', 'Leg Curl', 'Romanian Deadlift'],
        'deadlift': ['Romanian Deadlift', 'Sumo Deadlift', 'Stiff Leg Deadlift'],
        'curl': ['Hamstring Curl', 'Nordic Curl', 'Single Leg Curl'],
        'extension': ['Quad Extension', 'Single Leg Extension'],
        'raise': ['Calf Raise', 'Single Leg Calf Raise', 'Seated Calf Raise'],
        'crunch': ['Bicycle Crunch', 'Reverse Crunch', 'Russian Twist', 'Plank'],
        'plank': ['Side Plank', 'Plank', 'Plank Up-Down', 'Mountain Climber'],
    }
    
    # Find matching variation category
    variation_list = None
    for key, variants in variations.items():
        if key in exercise_lower:
            variation_list = variants
            break
    
    # If we found variations, pick one that's different from current
    if variation_list:
        filtered_variants = [v for v in variation_list if v.lower() != exercise_lower]
        if filtered_variants:
            exercise_name = random.choice(filtered_variants)
    
    # Slightly adjust reps (±1-2 reps if it's a number range)
    if reps:
        try:
            # Try to parse rep ranges like "8-10" or "12"
            if '-' in str(reps):
                parts = str(reps).split('-')
                if len(parts) == 2:
                    low = int(parts[0].strip())
                    high = int(parts[1].strip())
                    adjustment = random.randint(-2, 2)
                    new_low = max(1, low + adjustment)
                    new_high = max(new_low + 1, high + adjustment)
                    reps = f"{new_low}-{new_high}"
            else:
                num_reps = int(str(reps).strip())
                adjustment = random.randint(-2, 2)
                new_reps = max(1, num_reps + adjustment)
                reps = str(new_reps)
        except (ValueError, AttributeError):
            pass  # Keep original reps if parsing fails
    
    return exercise_name, sets, reps, weight, notes

@app.route('/api/workouts/generate-from-week', methods=['POST'])
@coach_required
def generate_workouts_from_week():
    """Generate workouts for a target week based on a reference week template"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing request data'}), 400
        
        reference_start = datetime.strptime(data.get('reference_start_date'), '%Y-%m-%d').date()
        reference_end = datetime.strptime(data.get('reference_end_date'), '%Y-%m-%d').date()
        target_start = datetime.strptime(data.get('target_start_date'), '%Y-%m-%d').date()
        target_end = datetime.strptime(data.get('target_end_date'), '%Y-%m-%d').date()
        
        # Fetch workouts from reference week
        coach_ids = [c.id for c in Coach.query.all()]
        reference_workouts = Workout.query.filter(
            Workout.date >= reference_start,
            Workout.date <= reference_end,
            Workout.created_by.in_(coach_ids)
        ).order_by(Workout.date).all()
        
        if not reference_workouts:
            return jsonify({'error': 'No workouts found in reference week'}), 404
        
        created_workout_ids = []
        
        # Create a mapping of day of week to target date
        target_dates_by_weekday = {}
        current_date = target_start
        while current_date <= target_end:
            weekday = current_date.weekday()  # Monday=0, Sunday=6
            target_dates_by_weekday[weekday] = current_date
            current_date += timedelta(days=1)
        
        # Process each reference workout
        for ref_workout in reference_workouts:
            ref_weekday = ref_workout.date.weekday()
            
            # Find corresponding day in target week
            if ref_weekday not in target_dates_by_weekday:
                continue  # Skip if day doesn't exist in target week
            
            target_date = target_dates_by_weekday[ref_weekday]
            
            # Create new workout
            new_workout = Workout(
                date=target_date,
                workout_name=ref_workout.workout_name,
                created_by=current_user.id
            )
            db.session.add(new_workout)
            db.session.flush()
            
            order_counter = 0
            
            # Process standalone exercises
            standalone_exercises = [ex for ex in ref_workout.exercises if ex.group_id is None]
            standalone_exercises.sort(key=lambda x: x.order)
            
            for ref_exercise in standalone_exercises:
                is_main = is_main_lift(ref_exercise.exercise_name, ref_exercise.weight, ref_exercise.notes)
                
                if is_main:
                    # Main lift: apply new parameters
                    new_exercise = Exercise(
                        workout_id=new_workout.id,
                        group_id=None,
                        order=order_counter,
                        exercise_name=ref_exercise.exercise_name,
                        sets='5',
                        reps='2-3',
                        weight='88-95%' if not ref_exercise.weight or '%' not in str(ref_exercise.weight) else ref_exercise.weight,
                        tempo=ref_exercise.tempo,
                        rest=ref_exercise.rest,
                        notes=ref_exercise.notes,
                        has_1rm_calculator=ref_exercise.has_1rm_calculator,
                        has_weight_logging=ref_exercise.has_weight_logging
                    )
                else:
                    # Accessory: generate variation
                    new_name, new_sets, new_reps, new_weight, new_notes = generate_variation(
                        ref_exercise.exercise_name,
                        ref_exercise.sets,
                        ref_exercise.reps,
                        ref_exercise.weight,
                        ref_exercise.notes
                    )
                    new_exercise = Exercise(
                        workout_id=new_workout.id,
                        group_id=None,
                        order=order_counter,
                        exercise_name=new_name,
                        sets=new_sets,
                        reps=new_reps,
                        weight=new_weight,
                        tempo=ref_exercise.tempo,
                        rest=ref_exercise.rest,
                        notes=new_notes,
                        has_1rm_calculator=ref_exercise.has_1rm_calculator,
                        has_weight_logging=ref_exercise.has_weight_logging
                    )
                
                db.session.add(new_exercise)
                order_counter += 1
            
            # Process exercise groups
            exercise_groups = sorted(ref_workout.exercise_groups, key=lambda x: x.order)
            
            for ref_group in exercise_groups:
                # Create new group with same structure
                new_group = ExerciseGroup(
                    workout_id=new_workout.id,
                    order=order_counter,
                    group_name=ref_group.group_name,
                    rounds=ref_group.rounds,
                    rep_scheme=ref_group.rep_scheme,
                    notes=ref_group.notes
                )
                db.session.add(new_group)
                db.session.flush()
                order_counter += 1
                
                # Process exercises in group
                group_exercises = sorted(ref_group.exercises, key=lambda x: x.order)
                for idx, ref_exercise in enumerate(group_exercises):
                    # For group exercises, generate variations
                    new_name, new_sets, new_reps, new_weight, new_notes = generate_variation(
                        ref_exercise.exercise_name,
                        ref_exercise.sets,
                        ref_exercise.reps,
                        ref_exercise.weight,
                        ref_exercise.notes
                    )
                    
                    new_exercise = Exercise(
                        workout_id=new_workout.id,
                        group_id=new_group.id,
                        order=idx,
                        exercise_name=new_name,
                        sets=new_sets,
                        reps=new_reps,
                        weight=new_weight,
                        tempo=ref_exercise.tempo,
                        rest=ref_exercise.rest,
                        notes=new_notes,
                        has_1rm_calculator=ref_exercise.has_1rm_calculator,
                        has_weight_logging=ref_exercise.has_weight_logging
                    )
                    db.session.add(new_exercise)
            
            created_workout_ids.append(new_workout.id)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'created_workouts': len(created_workout_ids),
            'workout_ids': created_workout_ids
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to generate workouts: {str(e)}'}), 500

@app.route('/api/workouts/<int:workout_id>', methods=['PUT'])
@coach_required
def update_workout(workout_id):
    try:
        workout = Workout.query.get_or_404(workout_id)
        data = request.get_json()
        
        if not data or 'date' not in data or 'workout_name' not in data:
            return jsonify({'error': 'Missing required fields: date and workout_name'}), 400
        
        workout_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        # REMOVED: No longer checking for duplicate dates when updating
        
        workout.workout_name = data['workout_name']
        workout.date = workout_date
        workout.updated_at = datetime.utcnow()
        
        # Update creator if provided
        if 'created_by' in data:
            workout.created_by = data['created_by']
        
        # Delete existing exercises and groups
        Exercise.query.filter_by(workout_id=workout.id).delete()
        ExerciseGroup.query.filter_by(workout_id=workout.id).delete()
        
        order_counter = 0
        
        # Add standalone exercises
        for exercise_data in data.get('exercises', []):
            if not exercise_data.get('exercise_name'):
                continue
            exercise = Exercise(
                workout_id=workout.id,
                group_id=None,
                order=order_counter,
                exercise_name=exercise_data.get('exercise_name', ''),
                sets=exercise_data.get('sets', ''),
                reps=exercise_data.get('reps', ''),
                weight=exercise_data.get('weight', ''),
                tempo=exercise_data.get('tempo', ''),
                rest=exercise_data.get('rest', ''),
                notes=exercise_data.get('notes', ''),
                has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                has_weight_logging=exercise_data.get('has_weight_logging', False)
            )
            db.session.add(exercise)
            order_counter += 1
        
        # Add exercise groups
        for group_data in data.get('exercise_groups', []):
            group = ExerciseGroup(
                workout_id=workout.id,
                order=order_counter,
                group_name=group_data.get('group_name', ''),
                rounds=group_data.get('rounds', ''),
                rep_scheme=group_data.get('rep_scheme', ''),
                notes=group_data.get('notes', '')
            )
            db.session.add(group)
            db.session.flush()
            order_counter += 1
            
            # Add exercises to the group
            for idx, exercise_data in enumerate(group_data.get('exercises', [])):
                if not exercise_data.get('exercise_name'):
                    continue
                exercise = Exercise(
                    workout_id=workout.id,
                    group_id=group.id,
                    order=idx,
                    exercise_name=exercise_data.get('exercise_name', ''),
                    sets=exercise_data.get('sets', ''),
                    reps=exercise_data.get('reps', ''),
                    weight=exercise_data.get('weight', ''),
                    tempo=exercise_data.get('tempo', ''),
                    rest=exercise_data.get('rest', ''),
                    notes=exercise_data.get('notes', ''),
                    has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                    has_weight_logging=exercise_data.get('has_weight_logging', False)
                )
                db.session.add(exercise)
        
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update workout: {str(e)}'}), 500

@app.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
@coach_required
def delete_workout(workout_id):
    try:
        workout = Workout.query.get_or_404(workout_id)
        db.session.delete(workout)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete workout: {str(e)}'}), 500

@app.route('/api/coaches/register', methods=['POST'])
@admin_required
def register_coach():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'coach')  # Default to 'coach' for backward compatibility
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Check if username exists in either Coach or User table (case-insensitive)
        if Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first() or User.query.filter(func.lower(User.username) == func.lower(username)).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create Coach (for admin/coach roles) or User (for user role)
        if role == 'user':
            user = User(
                username=username,
                password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
                role='user'
            )
            db.session.add(user)
        else:
            coach = Coach(
                username=username,
                password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
                role=role
            )
            db.session.add(coach)
        
        db.session.commit()
        
        return jsonify({'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to register user: {str(e)}'}), 500

# User Management API Routes
@app.route('/api/users', methods=['GET'])
@coach_required
def get_users():
    """Get all users (both Coach and User models)"""
    coaches = Coach.query.all()
    users = User.query.all()
    
    result = []
    for coach in coaches:
        result.append({
            'id': coach.id,
            'username': coach.username,
            'first_name': coach.first_name,
            'last_name': coach.last_name,
            'initials': coach.get_initials(),
            'role': coach.role,
            'type': 'coach',
            'created_at': coach.created_at.isoformat() if coach.created_at else None
        })
    
    for user in users:
        result.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'initials': user.get_initials(),
            'role': user.role,
            'type': 'user',
            'created_at': user.created_at.isoformat() if user.created_at else None
        })
    
    return jsonify(result)

@app.route('/api/users', methods=['POST'])
@coach_required
def create_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Coaches can only create users, not admins or coaches
        if not (hasattr(current_user, 'is_admin') and current_user.is_admin()):
            if role != 'user':
                return jsonify({'error': 'Coaches can only create user accounts'}), 403
        
        if role not in ['user', 'coach', 'admin']:
            return jsonify({'error': 'Invalid role. Must be user, coach, or admin'}), 400
        
        # Check if username exists (case-insensitive)
        if Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first() or User.query.filter(func.lower(User.username) == func.lower(username)).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if role == 'user':
            user = User(
                username=username,
                password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
                role='user',
                first_name=first_name if first_name else None,
                last_name=last_name if last_name else None
            )
            db.session.add(user)
        else:
            coach = Coach(
                username=username,
                password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
                role=role,
                first_name=first_name if first_name else None,
                last_name=last_name if last_name else None
            )
            db.session.add(coach)
        
        db.session.commit()
        
        return jsonify({'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@coach_required
def update_user(user_id):
    try:
        data = request.get_json()
        user_type = data.get('type')  # 'coach' or 'user'
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        
        if user_type == 'coach':
            user = Coach.query.get_or_404(user_id)
        else:
            user = User.query.get_or_404(user_id)
        
        # Coaches can only edit users, not admins or coaches
        if not (hasattr(current_user, 'is_admin') and current_user.is_admin()):
            if user_type == 'coach' or (hasattr(user, 'role') and user.role in ['admin', 'coach']):
                return jsonify({'error': 'Coaches can only edit user accounts'}), 403
        
        if username:
            # Check if new username conflicts (case-insensitive)
            if user_type == 'coach':
                existing = Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first()
                if existing and existing.id != user_id:
                    return jsonify({'error': 'Username already exists'}), 400
                existing_user = User.query.filter(func.lower(User.username) == func.lower(username)).first()
                if existing_user:
                    return jsonify({'error': 'Username already exists'}), 400
            else:
                existing = User.query.filter(func.lower(User.username) == func.lower(username)).first()
                if existing and existing.id != user_id:
                    return jsonify({'error': 'Username already exists'}), 400
                existing_coach = Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first()
                if existing_coach:
                    return jsonify({'error': 'Username already exists'}), 400
            
            user.username = username
        
        if first_name is not None:
            user.first_name = first_name if first_name else None
        
        if last_name is not None:
            user.last_name = last_name if last_name else None
        
        if password:
            user.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
        if role and role in ['user', 'coach', 'admin']:
            # Coaches cannot change roles to admin or coach
            if not (hasattr(current_user, 'is_admin') and current_user.is_admin()):
                if role in ['admin', 'coach']:
                    return jsonify({'error': 'Coaches cannot assign admin or coach roles'}), 403
            
            # If changing role from user to coach/admin or vice versa, need to migrate
            if user_type == 'user' and role != 'user':
                # Migrate User to Coach
                new_coach = Coach(
                    username=user.username,
                    password_hash=user.password_hash,
                    role=role,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    created_at=user.created_at
                )
                db.session.delete(user)
                db.session.add(new_coach)
            elif user_type == 'coach' and role == 'user':
                # Migrate Coach to User
                new_user = User(
                    username=user.username,
                    password_hash=user.password_hash,
                    role='user',
                    first_name=user.first_name,
                    last_name=user.last_name,
                    created_at=user.created_at
                )
                db.session.delete(user)
                db.session.add(new_user)
            else:
                user.role = role
        
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@coach_required
def delete_user(user_id):
    try:
        data = request.get_json()
        user_type = data.get('type')  # 'coach' or 'user'
        
        if user_type == 'coach':
            user = Coach.query.get_or_404(user_id)
        else:
            user = User.query.get_or_404(user_id)
        
        # Prevent deleting yourself
        if user.id == current_user.id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Coaches can only delete users, not admins or coaches
        if not (hasattr(current_user, 'is_admin') and current_user.is_admin()):
            if user_type == 'coach' or (hasattr(user, 'role') and user.role in ['admin', 'coach']):
                return jsonify({'error': 'Coaches can only delete user accounts'}), 403
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500

@app.route('/api/user/profile', methods=['GET'])
@login_required
def get_user_profile():
    """Get current user's profile"""
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'first_name': current_user.first_name if hasattr(current_user, 'first_name') else None,
        'last_name': current_user.last_name if hasattr(current_user, 'last_name') else None,
        'initials': current_user.get_initials() if hasattr(current_user, 'get_initials') else (current_user.username[0].upper() if current_user.username else '?'),
        'role': current_user.role if hasattr(current_user, 'role') else 'user'
    })

@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_user_profile():
    """Update current user's profile"""
    try:
        data = request.get_json()
        username = data.get('username')
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        
        if username:
            # Check if new username conflicts (case-insensitive)
            if isinstance(current_user, Coach):
                existing = Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first()
                if existing and existing.id != current_user.id:
                    return jsonify({'error': 'Username already exists'}), 400
                existing_user = User.query.filter(func.lower(User.username) == func.lower(username)).first()
                if existing_user:
                    return jsonify({'error': 'Username already exists'}), 400
            else:
                existing = User.query.filter(func.lower(User.username) == func.lower(username)).first()
                if existing and existing.id != current_user.id:
                    return jsonify({'error': 'Username already exists'}), 400
                existing_coach = Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first()
                if existing_coach:
                    return jsonify({'error': 'Username already exists'}), 400
            
            current_user.username = username
        
        if first_name is not None:
            current_user.first_name = first_name if first_name else None
        
        if last_name is not None:
            current_user.last_name = last_name if last_name else None
        
        if new_password:
            if not current_password:
                return jsonify({'error': 'Current password is required to change password'}), 400
            
            if not check_password_hash(current_user.password_hash, current_password):
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            current_user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
        
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@app.route('/signup', methods=['GET'])
def signup_page():
    """Sign up page"""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return render_template('signup.html')

@app.route('/eula', methods=['GET'])
def eula_page():
    """End User License Agreement page"""
    return render_template('eula.html')

@app.route('/api/signup', methods=['POST'])
def signup():
    """Public sign-up endpoint"""
    try:
        data = request.get_json()
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password')
        
        # Validation
        if not first_name or not last_name:
            return jsonify({'error': 'First name and last name are required'}), 400
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not password or len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Email validation
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Generate username from firstname.lastname
        base_username = f"{first_name.lower()}.{last_name.lower()}"
        username = base_username
        
        # Handle duplicate usernames by appending numbers (case-insensitive check)
        counter = 1
        while User.query.filter(func.lower(User.username) == func.lower(username)).first() or Coach.query.filter(func.lower(Coach.username) == func.lower(username)).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create user
        user = User(
            username=username,
            password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='user'
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Auto-login the user after signup
        login_user(user, remember=True)
        
        return jsonify({
            'success': True, 
            'username': username,
            'redirect': url_for('user_profile')
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create account: {str(e)}'}), 500

# Multiple workouts dropdown feature
@app.route('/api/workouts/date/<date>', methods=['GET'])
def get_workouts_by_date(date):
    """Get all workouts for a specific date - filtered by user access"""
    try:
        workout_date = datetime.strptime(date, '%Y-%m-%d').date()
        query = Workout.query.filter_by(date=workout_date)
        
        # Filter based on user access
        # Only coach/admin workouts are public
        # User workouts are only visible to the user who created them
        coach_ids = [c.id for c in Coach.query.all()]
        
        if current_user.is_authenticated:
            # Get current user ID if it's a User (not Coach)
            is_user = isinstance(current_user, User)
            if is_user:
                # Show coach workouts + ONLY this user's own workouts
                query = query.filter(
                    db.or_(
                        Workout.created_by.in_(coach_ids),
                        Workout.created_by == current_user.id
                    )
                )
            else:
                # Coach/admin sees all workouts (coach workouts + all user workouts)
                pass
        else:
            # Not logged in - show only coach workouts (no user workouts)
            if coach_ids:
                query = query.filter(Workout.created_by.in_(coach_ids))
            else:
                query = query.filter(False)  # No coaches exist, return empty
        
        workouts = query.order_by(Workout.created_at).all()
        
        result = []
        for workout in workouts:
            # Get creator information - check both Coach and User tables
            creator = None
            creator_name = None
            creator_initials = None
            is_user_workout = False
            
            # Try Coach first
            creator = Coach.query.get(workout.created_by)
            if not creator:
                # If not found in Coach, try User table
                creator = User.query.get(workout.created_by)
                if creator:
                    is_user_workout = True
            
            if creator:
                if hasattr(creator, 'first_name') and creator.first_name and hasattr(creator, 'last_name') and creator.last_name:
                    creator_name = f"{creator.first_name} {creator.last_name}"
                else:
                    creator_name = creator.username
                creator_initials = creator.get_initials() if hasattr(creator, 'get_initials') else (creator.username[0].upper() if creator.username else '?')
            
            standalone_exercises = [ex for ex in workout.exercises if ex.group_id is None]
            groups = []
            for group in sorted(workout.exercise_groups, key=lambda x: x.order):
                groups.append({
                    'id': group.id,
                    'order': group.order,
                    'group_name': group.group_name,
                    'rounds': group.rounds,
                    'rep_scheme': group.rep_scheme,
                    'notes': group.notes,
                    'exercises': [{
                        'id': ex.id,
                        'order': ex.order,
                        'exercise_name': ex.exercise_name,
                        'sets': ex.sets,
                        'reps': ex.reps,
                        'weight': ex.weight,
                        'tempo': ex.tempo,
                        'rest': ex.rest,
                        'notes': ex.notes,
                        'has_1rm_calculator': ex.has_1rm_calculator,
                    'has_weight_logging': ex.has_weight_logging
                    } for ex in sorted(group.exercises, key=lambda x: x.order)]
                })
            
            result.append({
                'id': workout.id,
                'date': workout.date.isoformat(),
                'workout_name': workout.workout_name,
                'created_by': workout.created_by,
                'creator_name': creator_name,
                'creator_initials': creator_initials,
                'is_user_workout': is_user_workout,
                'exercises': [{
                    'id': ex.id,
                    'order': ex.order,
                    'exercise_name': ex.exercise_name,
                    'sets': ex.sets,
                    'reps': ex.reps,
                    'weight': ex.weight,
                    'tempo': ex.tempo,
                    'rest': ex.rest,
                    'notes': ex.notes,
                    'has_1rm_calculator': ex.has_1rm_calculator,
                    'has_weight_logging': ex.has_weight_logging
                } for ex in sorted(standalone_exercises, key=lambda x: x.order)],
                'exercise_groups': groups
            })
        
        return jsonify(result)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to get workouts: {str(e)}'}), 500

# Weight Logging API Routes
@app.route('/api/exercises/<int:exercise_id>/log-weight', methods=['POST'])
@login_required
def log_weight(exercise_id):
    """Log weights for an exercise"""
    try:
        exercise = Exercise.query.get_or_404(exercise_id)
        data = request.get_json()
        
        workout_id = data.get('workout_id')
        workout_date_str = data.get('date')
        sets_data = data.get('sets', [])  # Array of {weight, reps} objects
        
        if not workout_id or not workout_date_str or not sets_data:
            return jsonify({'error': 'Missing required fields: workout_id, date, or sets'}), 400
        
        workout_date = datetime.strptime(workout_date_str, '%Y-%m-%d').date()
        
        # Find highest weight from all sets
        highest_weight = 0
        for set_data in sets_data:
            weight = float(set_data.get('weight', 0))
            if weight > highest_weight:
                highest_weight = weight
        
        if highest_weight == 0:
            return jsonify({'error': 'At least one set must have a weight value'}), 400
        
        # Determine if current_user is a User or Coach
        is_user = isinstance(current_user, User)
        is_coach = isinstance(current_user, Coach)
        
        if not (is_user or is_coach):
            return jsonify({'error': 'Invalid user type'}), 403
        
        # Build filter query based on user type
        if is_user:
            filter_query = LoggedWeight.query.filter_by(
                user_id=current_user.id,
                exercise_id=exercise_id,
                workout_id=workout_id
            )
        else:
            filter_query = LoggedWeight.query.filter_by(
                coach_id=current_user.id,
                exercise_id=exercise_id,
                workout_id=workout_id
            )
        
        # Check if entry already exists for this user/exercise/workout_date
        existing_log = filter_query.filter(
            LoggedWeight.date == workout_date
        ).first()
        
        if existing_log:
            # Update existing entry
            existing_log.weight = highest_weight
            # Store reps from the set with highest weight (or first set)
            highest_set = max(sets_data, key=lambda s: float(s.get('weight', 0)))
            existing_log.reps = int(highest_set.get('reps', 0)) if highest_set.get('reps') else None
            existing_log.sets = len(sets_data)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Weight log updated'})
        else:
            # Create new entry
            highest_set = max(sets_data, key=lambda s: float(s.get('weight', 0)))
            logged_weight = LoggedWeight(
                user_id=current_user.id if is_user else None,
                coach_id=current_user.id if is_coach else None,
                exercise_id=exercise_id,
                workout_id=workout_id,
                weight=highest_weight,
                reps=int(highest_set.get('reps', 0)) if highest_set.get('reps') else None,
                sets=len(sets_data),
                date=workout_date
            )
            db.session.add(logged_weight)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Weight logged successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to log weight: {str(e)}'}), 500

@app.route('/api/exercises/<int:exercise_id>/leaderboard', methods=['GET'])
def get_leaderboard(exercise_id):
    """Get leaderboard for a specific exercise and workout date"""
    try:
        exercise = Exercise.query.get_or_404(exercise_id)
        workout_id = request.args.get('workout_id', type=int)
        date_str = request.args.get('date')
        
        if not workout_id or not date_str:
            return jsonify({'error': 'Missing required parameters: workout_id and date'}), 400
        
        workout_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Get all logged weights for this exercise/workout/date
        logged_weights = LoggedWeight.query.filter_by(
            exercise_id=exercise_id,
            workout_id=workout_id
        ).filter(
            LoggedWeight.date == workout_date
        ).order_by(LoggedWeight.weight.desc()).all()
        
        leaderboard = []
        for log in logged_weights:
            # Check if it's a user or coach
            if log.user_id:
                user = User.query.get(log.user_id)
                if user:
                    leaderboard.append({
                        'user_id': user.id,
                        'username': user.username,
                        'name': f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username,
                        'initials': user.get_initials() if hasattr(user, 'get_initials') else (user.username[0].upper() if user.username else '?'),
                        'weight': log.weight,
                        'reps': log.reps,
                        'sets': log.sets
                    })
            elif log.coach_id:
                coach = Coach.query.get(log.coach_id)
                if coach:
                    leaderboard.append({
                        'user_id': coach.id,
                        'username': coach.username,
                        'name': f"{coach.first_name} {coach.last_name}".strip() if coach.first_name or coach.last_name else coach.username,
                        'initials': coach.get_initials() if hasattr(coach, 'get_initials') else (coach.username[0].upper() if coach.username else '?'),
                        'weight': log.weight,
                        'reps': log.reps,
                        'sets': log.sets
                    })
        
        return jsonify({
            'exercise_name': exercise.exercise_name,
            'exercise_id': exercise_id,
            'workout_id': workout_id,
            'date': workout_date.isoformat(),
            'leaderboard': leaderboard
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get leaderboard: {str(e)}'}), 500

@app.route('/api/user/logged-weights', methods=['GET'])
@login_required
def get_user_logged_weights():
    """Get user's or coach's logged weights for profile display"""
    try:
        # Determine if current_user is a User or Coach
        is_user = isinstance(current_user, User)
        is_coach = isinstance(current_user, Coach)
        
        if not (is_user or is_coach):
            return jsonify({'error': 'Invalid user type'}), 403
        
        # Get all logged weights for this user/coach, grouped by exercise
        if is_user:
            logged_weights = LoggedWeight.query.filter_by(user_id=current_user.id).all()
        else:
            logged_weights = LoggedWeight.query.filter_by(coach_id=current_user.id).all()
        
        # Group by exercise and date, keeping all logs
        exercise_logs = {}
        for log in logged_weights:
            exercise = Exercise.query.get(log.exercise_id)
            if exercise:
                exercise_name = exercise.exercise_name
                exercise_id = exercise.id
                
                if exercise_name not in exercise_logs:
                    exercise_logs[exercise_name] = {
                        'exercise_name': exercise_name,
                        'exercise_id': exercise_id,
                        'highest_weight': log.weight,
                        'highest_reps': log.reps,
                        'highest_date': log.date.isoformat(),
                        'workouts': {}
                    }
                
                # Track highest weight
                if log.weight > exercise_logs[exercise_name]['highest_weight']:
                    exercise_logs[exercise_name]['highest_weight'] = log.weight
                    exercise_logs[exercise_name]['highest_reps'] = log.reps
                    exercise_logs[exercise_name]['highest_date'] = log.date.isoformat()
                
                # Group by workout date
                date_str = log.date.isoformat()
                workout_id = log.workout_id
                workout_key = f"{date_str}_{workout_id}"
                
                if workout_key not in exercise_logs[exercise_name]['workouts']:
                    exercise_logs[exercise_name]['workouts'][workout_key] = {
                        'date': date_str,
                        'workout_id': workout_id,
                        'sets': []
                    }
                
                # Add set data
                exercise_logs[exercise_name]['workouts'][workout_key]['sets'].append({
                    'weight': log.weight,
                    'reps': log.reps,
                    'sets': log.sets
                })
        
        # Convert to list format and sort by highest weight descending
        result = []
        for exercise_name, data in exercise_logs.items():
            # Convert workouts dict to list
            workouts_list = []
            for workout_key, workout_data in data['workouts'].items():
                workouts_list.append(workout_data)
            # Sort workouts by date descending
            workouts_list.sort(key=lambda x: x['date'], reverse=True)
            
            result.append({
                'exercise_name': data['exercise_name'],
                'exercise_id': data['exercise_id'],
                'highest_weight': data['highest_weight'],
                'highest_reps': data['highest_reps'],
                'highest_date': data['highest_date'],
                'workouts': workouts_list
            })
        
        result.sort(key=lambda x: x['highest_weight'], reverse=True)
        
        return jsonify({'logged_weights': result})
    except Exception as e:
        return jsonify({'error': f'Failed to get logged weights: {str(e)}'}), 500

# Check-In Endpoints
@app.route('/api/checkin', methods=['POST'])
@login_required
def create_checkin():
    """Create a check-in for the current day"""
    try:
        # Determine if current_user is a User or Coach
        is_user = isinstance(current_user, User)
        is_coach = isinstance(current_user, Coach)
        
        if not (is_user or is_coach):
            return jsonify({'error': 'Invalid user type'}), 403
        
        data = request.get_json() or {}
        # Use local timezone-aware datetime for check-ins
        from datetime import timezone
        now = datetime.now(timezone.utc)
        today = now.date()
        notes = data.get('notes', '').strip() if data.get('notes') else None
        
        # Check if user/coach already checked in today
        if is_user:
            existing_checkin = UserCheckIn.query.filter_by(user_id=current_user.id, date=today).first()
        else:
            existing_checkin = UserCheckIn.query.filter_by(coach_id=current_user.id, date=today).first()
        
        if existing_checkin:
            return jsonify({'error': 'You have already checked in today'}), 400
        
        # Create new check-in with timezone-aware datetime
        check_in_time = now
        checkin = UserCheckIn(
            user_id=current_user.id if is_user else None,
            coach_id=current_user.id if is_coach else None,
            date=today,
            check_in_time=check_in_time,
            notes=notes
        )
        
        db.session.add(checkin)
        db.session.commit()
        
        return jsonify({
            'message': 'Check-in successful',
            'checkin': {
                'id': checkin.id,
                'date': checkin.date.isoformat(),
                'check_in_time': checkin.check_in_time.isoformat(),
                'notes': checkin.notes
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create check-in: {str(e)}'}), 500

@app.route('/api/checkin', methods=['GET'])
@login_required
def get_checkin_status():
    """Get current user's check-in status for today"""
    try:
        # Determine if current_user is a User or Coach
        is_user = isinstance(current_user, User)
        is_coach = isinstance(current_user, Coach)
        
        if not (is_user or is_coach):
            return jsonify({'error': 'Invalid user type'}), 403
        
        # Use local timezone-aware datetime
        from datetime import timezone
        today = datetime.now(timezone.utc).date()
        
        if is_user:
            checkin = UserCheckIn.query.filter_by(user_id=current_user.id, date=today).first()
        else:
            checkin = UserCheckIn.query.filter_by(coach_id=current_user.id, date=today).first()
        
        if checkin:
            return jsonify({
                'checked_in': True,
                'checkin': {
                    'id': checkin.id,
                    'date': checkin.date.isoformat(),
                    'check_in_time': checkin.check_in_time.isoformat(),
                    'notes': checkin.notes
                }
            })
        else:
            return jsonify({'checked_in': False})
    except Exception as e:
        return jsonify({'error': f'Failed to get check-in status: {str(e)}'}), 500

@app.route('/api/checkin/history', methods=['GET'])
@login_required
def get_checkin_history():
    """Get current user's check-in history"""
    try:
        # Determine if current_user is a User or Coach
        is_user = isinstance(current_user, User)
        is_coach = isinstance(current_user, Coach)
        
        if not (is_user or is_coach):
            return jsonify({'error': 'Invalid user type'}), 403
        
        # Get date range from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = UserCheckIn.query
        if is_user:
            query = query.filter_by(user_id=current_user.id)
        else:
            query = query.filter_by(coach_id=current_user.id)
        
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(UserCheckIn.date >= start)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(UserCheckIn.date <= end)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        
        checkins = query.order_by(UserCheckIn.date.desc()).all()
        
        result = []
        for checkin in checkins:
            result.append({
                'id': checkin.id,
                'date': checkin.date.isoformat(),
                'check_in_time': checkin.check_in_time.isoformat(),
                'notes': checkin.notes
            })
        
        # Calculate streak
        streak = 0
        if result:
            current_date = datetime.utcnow().date()
            checkin_dates = {datetime.strptime(c['date'], '%Y-%m-%d').date() for c in result}
            
            # Check consecutive days starting from today
            check_date = current_date
            while check_date in checkin_dates:
                streak += 1
                check_date -= timedelta(days=1)
        
        return jsonify({
            'checkins': result,
            'total': len(result),
            'current_streak': streak
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get check-in history: {str(e)}'}), 500

@app.route('/api/checkin/all', methods=['GET'])
@coach_required
def get_all_checkins():
    """Get all users' check-ins (coach/admin only)"""
    try:
        # Get filters from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        user_id = request.args.get('user_id', type=int)
        
        query = UserCheckIn.query
        
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(UserCheckIn.date >= start)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(UserCheckIn.date <= end)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        
        if user_id:
            query = query.filter(UserCheckIn.user_id == user_id)
        
        checkins = query.order_by(UserCheckIn.date.desc(), UserCheckIn.check_in_time.desc()).all()
        
        result = []
        for checkin in checkins:
            # Get user/coach info
            user_name = None
            user_initials = None
            user_type = None
            
            if checkin.user_id:
                user = User.query.get(checkin.user_id)
                if user:
                    if user.first_name and user.last_name:
                        user_name = f"{user.first_name} {user.last_name}"
                    else:
                        user_name = user.username
                    user_initials = user.get_initials()
                    user_type = 'user'
            elif checkin.coach_id:
                coach = Coach.query.get(checkin.coach_id)
                if coach:
                    if coach.first_name and coach.last_name:
                        user_name = f"{coach.first_name} {coach.last_name}"
                    else:
                        user_name = coach.username
                    user_initials = coach.get_initials()
                    user_type = 'coach'
            
            result.append({
                'id': checkin.id,
                'user_id': checkin.user_id,
                'coach_id': checkin.coach_id,
                'user_name': user_name,
                'user_initials': user_initials,
                'user_type': user_type,
                'date': checkin.date.isoformat(),
                'check_in_time': checkin.check_in_time.isoformat(),
                'notes': checkin.notes
            })
        
        return jsonify({
            'checkins': result,
            'total': len(result)
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get all check-ins: {str(e)}'}), 500

@app.route('/api/checkin/stats', methods=['GET'])
@coach_required
def get_checkin_stats():
    """Get check-in statistics (coach/admin only)"""
    try:
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Today's check-ins
        today_checkins = UserCheckIn.query.filter_by(date=today).count()
        
        # This week's check-ins
        week_checkins = UserCheckIn.query.filter(UserCheckIn.date >= week_ago).count()
        
        # This month's check-ins
        month_checkins = UserCheckIn.query.filter(UserCheckIn.date >= month_ago).count()
        
        # Unique users who checked in today
        today_users = db.session.query(UserCheckIn.user_id).filter_by(date=today).distinct().count()
        today_coaches = db.session.query(UserCheckIn.coach_id).filter(UserCheckIn.date == today, UserCheckIn.coach_id.isnot(None)).distinct().count()
        today_unique = today_users + today_coaches
        
        # Unique users who checked in this week
        week_users = db.session.query(UserCheckIn.user_id).filter(UserCheckIn.date >= week_ago).distinct().count()
        week_coaches = db.session.query(UserCheckIn.coach_id).filter(UserCheckIn.date >= week_ago, UserCheckIn.coach_id.isnot(None)).distinct().count()
        week_unique = week_users + week_coaches
        
        # Top users by check-in count (last 30 days)
        top_users_query = db.session.query(
            UserCheckIn.user_id,
            db.func.count(UserCheckIn.id).label('count')
        ).filter(
            UserCheckIn.date >= month_ago,
            UserCheckIn.user_id.isnot(None)
        ).group_by(UserCheckIn.user_id).order_by(db.func.count(UserCheckIn.id).desc()).limit(10).all()
        
        top_users = []
        for user_id, count in top_users_query:
            user = User.query.get(user_id)
            if user:
                top_users.append({
                    'user_id': user_id,
                    'name': f"{user.first_name} {user.last_name}" if (user.first_name and user.last_name) else user.username,
                    'initials': user.get_initials(),
                    'check_in_count': count
                })
        
        # Check-in streak leaders
        all_checkins = UserCheckIn.query.filter(UserCheckIn.date >= month_ago).order_by(UserCheckIn.user_id, UserCheckIn.date).all()
        
        # Group by user and calculate streaks
        user_streaks = {}
        for checkin in all_checkins:
            user_key = f"user_{checkin.user_id}" if checkin.user_id else f"coach_{checkin.coach_id}"
            if user_key not in user_streaks:
                user_streaks[user_key] = []
            user_streaks[user_key].append(checkin.date)
        
        streak_leaders = []
        for user_key, dates in user_streaks.items():
            if not dates:
                continue
            
            # Calculate current streak
            dates_set = set(dates)
            current_date = today
            streak = 0
            while current_date in dates_set:
                streak += 1
                current_date -= timedelta(days=1)
            
            if streak > 0:
                user_id = None
                coach_id = None
                if user_key.startswith('user_'):
                    user_id = int(user_key.split('_')[1])
                    user = User.query.get(user_id)
                    if user:
                        streak_leaders.append({
                            'user_id': user_id,
                            'coach_id': None,
                            'name': f"{user.first_name} {user.last_name}" if (user.first_name and user.last_name) else user.username,
                            'initials': user.get_initials(),
                            'streak': streak
                        })
                else:
                    coach_id = int(user_key.split('_')[1])
                    coach = Coach.query.get(coach_id)
                    if coach:
                        streak_leaders.append({
                            'user_id': None,
                            'coach_id': coach_id,
                            'name': f"{coach.first_name} {coach.last_name}" if (coach.first_name and coach.last_name) else coach.username,
                            'initials': coach.get_initials(),
                            'streak': streak
                        })
        
        streak_leaders.sort(key=lambda x: x['streak'], reverse=True)
        streak_leaders = streak_leaders[:10]  # Top 10
        
        return jsonify({
            'today': {
                'total_checkins': today_checkins,
                'unique_users': today_unique
            },
            'this_week': {
                'total_checkins': week_checkins,
                'unique_users': week_unique
            },
            'this_month': {
                'total_checkins': month_checkins
            },
            'top_users': top_users,
            'streak_leaders': streak_leaders
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get check-in stats: {str(e)}'}), 500

# User Workout Endpoints
@app.route('/api/user/workouts', methods=['GET'])
@login_required
def get_user_workouts():
    """Get all workouts created by current user"""
    try:
        # Ensure current_user is a User (not Coach)
        if not isinstance(current_user, User):
            return jsonify({'error': 'Only regular users can access this endpoint'}), 403
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Filter workouts created by this user only
        # Need to check if current_user is a User instance (not Coach)
        # and ensure we're only getting workouts where created_by matches user's ID
        query = Workout.query.filter(Workout.created_by == current_user.id)
        
        # Additional check: ensure we're not getting coach workouts
        # Coaches have IDs in the Coach table, Users have IDs in the User table
        # Since created_by stores the ID, we need to verify the creator is a User
        # We'll filter out any workouts where the creator is a Coach
        coach_ids = [c.id for c in Coach.query.all()]
        if coach_ids:
            query = query.filter(~Workout.created_by.in_(coach_ids))
        
        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(Workout.date >= start)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format. Use YYYY-MM-DD'}), 400
        
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(Workout.date <= end)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format. Use YYYY-MM-DD'}), 400
        
        workouts = query.order_by(Workout.date.desc(), Workout.created_at.desc()).all()
        
        result = []
        for workout in workouts:
            standalone_exercises = [ex for ex in workout.exercises if ex.group_id is None]
            groups = []
            for group in sorted(workout.exercise_groups, key=lambda x: x.order):
                groups.append({
                    'id': group.id,
                    'order': group.order,
                    'group_name': group.group_name,
                    'rounds': group.rounds,
                    'rep_scheme': group.rep_scheme,
                    'notes': group.notes,
                    'exercises': [{
                        'id': ex.id,
                        'order': ex.order,
                        'exercise_name': ex.exercise_name,
                        'sets': ex.sets,
                        'reps': ex.reps,
                        'weight': ex.weight,
                        'tempo': ex.tempo,
                        'rest': ex.rest,
                        'notes': ex.notes,
                        'has_1rm_calculator': ex.has_1rm_calculator,
                        'has_weight_logging': ex.has_weight_logging
                    } for ex in sorted(group.exercises, key=lambda x: x.order)]
                })
            
            result.append({
                'id': workout.id,
                'date': workout.date.isoformat(),
                'workout_name': workout.workout_name,
                'created_by': workout.created_by,
                'exercises': [{
                    'id': ex.id,
                    'order': ex.order,
                    'exercise_name': ex.exercise_name,
                    'sets': ex.sets,
                    'reps': ex.reps,
                    'weight': ex.weight,
                    'tempo': ex.tempo,
                    'rest': ex.rest,
                    'notes': ex.notes,
                    'has_1rm_calculator': ex.has_1rm_calculator,
                    'has_weight_logging': ex.has_weight_logging
                } for ex in sorted(standalone_exercises, key=lambda x: x.order)],
                'exercise_groups': groups
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Failed to get user workouts: {str(e)}'}), 500

@app.route('/api/user/workouts', methods=['POST'])
@login_required
def create_user_workout():
    """Create a workout for the current user"""
    try:
        # Ensure current_user is a User (not Coach)
        if not isinstance(current_user, User):
            return jsonify({'error': 'Only regular users can create workouts'}), 403
        
        data = request.get_json()
        
        if not data or 'date' not in data or 'workout_name' not in data:
            return jsonify({'error': 'Missing required fields: date and workout_name'}), 400
        
        workout_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        workout = Workout(
            date=workout_date,
            workout_name=data['workout_name'],
            created_by=current_user.id
        )
        
        db.session.add(workout)
        db.session.flush()
        
        order_counter = 0
        
        # Add standalone exercises
        for exercise_data in data.get('exercises', []):
            if not exercise_data.get('exercise_name'):
                continue
            exercise = Exercise(
                workout_id=workout.id,
                group_id=None,
                order=order_counter,
                exercise_name=exercise_data.get('exercise_name', ''),
                sets=exercise_data.get('sets', ''),
                reps=exercise_data.get('reps', ''),
                weight=exercise_data.get('weight', ''),
                tempo=exercise_data.get('tempo', ''),
                rest=exercise_data.get('rest', ''),
                notes=exercise_data.get('notes', ''),
                has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                has_weight_logging=exercise_data.get('has_weight_logging', False)
            )
            db.session.add(exercise)
            order_counter += 1
        
        # Add exercise groups
        for group_data in data.get('exercise_groups', []):
            group = ExerciseGroup(
                workout_id=workout.id,
                order=group_data.get('order', 0),
                group_name=group_data.get('group_name', ''),
                rounds=group_data.get('rounds', ''),
                rep_scheme=group_data.get('rep_scheme', ''),
                notes=group_data.get('notes', '')
            )
            db.session.add(group)
            db.session.flush()
            
            # Add exercises to group
            for exercise_data in group_data.get('exercises', []):
                if not exercise_data.get('exercise_name'):
                    continue
                exercise = Exercise(
                    workout_id=workout.id,
                    group_id=group.id,
                    order=exercise_data.get('order', 0),
                    exercise_name=exercise_data.get('exercise_name', ''),
                    sets=exercise_data.get('sets', ''),
                    reps=exercise_data.get('reps', ''),
                    weight=exercise_data.get('weight', ''),
                    tempo=exercise_data.get('tempo', ''),
                    rest=exercise_data.get('rest', ''),
                    notes=exercise_data.get('notes', ''),
                    has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                    has_weight_logging=exercise_data.get('has_weight_logging', False)
                )
                db.session.add(exercise)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Workout created successfully',
            'workout_id': workout.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create workout: {str(e)}'}), 500

@app.route('/api/user/workouts/<int:workout_id>', methods=['PUT'])
@login_required
def update_user_workout(workout_id):
    """Update a workout owned by the current user"""
    try:
        # Ensure current_user is a User (not Coach)
        if not isinstance(current_user, User):
            return jsonify({'error': 'Only regular users can update workouts'}), 403
        
        workout = Workout.query.get_or_404(workout_id)
        
        # Verify ownership
        if workout.created_by != current_user.id:
            return jsonify({'error': 'You can only edit your own workouts'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update workout basic info
        if 'workout_name' in data:
            workout.workout_name = data['workout_name']
        if 'date' in data:
            workout.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        workout.updated_at = datetime.utcnow()
        
        # Delete existing exercises and groups
        Exercise.query.filter_by(workout_id=workout.id).delete()
        ExerciseGroup.query.filter_by(workout_id=workout.id).delete()
        
        order_counter = 0
        
        # Add standalone exercises
        for exercise_data in data.get('exercises', []):
            if not exercise_data.get('exercise_name'):
                continue
            exercise = Exercise(
                workout_id=workout.id,
                group_id=None,
                order=order_counter,
                exercise_name=exercise_data.get('exercise_name', ''),
                sets=exercise_data.get('sets', ''),
                reps=exercise_data.get('reps', ''),
                weight=exercise_data.get('weight', ''),
                tempo=exercise_data.get('tempo', ''),
                rest=exercise_data.get('rest', ''),
                notes=exercise_data.get('notes', ''),
                has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                has_weight_logging=exercise_data.get('has_weight_logging', False)
            )
            db.session.add(exercise)
            order_counter += 1
        
        # Add exercise groups
        for group_data in data.get('exercise_groups', []):
            group = ExerciseGroup(
                workout_id=workout.id,
                order=group_data.get('order', 0),
                group_name=group_data.get('group_name', ''),
                rounds=group_data.get('rounds', ''),
                rep_scheme=group_data.get('rep_scheme', ''),
                notes=group_data.get('notes', '')
            )
            db.session.add(group)
            db.session.flush()
            
            # Add exercises to group
            for exercise_data in group_data.get('exercises', []):
                if not exercise_data.get('exercise_name'):
                    continue
                exercise = Exercise(
                    workout_id=workout.id,
                    group_id=group.id,
                    order=exercise_data.get('order', 0),
                    exercise_name=exercise_data.get('exercise_name', ''),
                    sets=exercise_data.get('sets', ''),
                    reps=exercise_data.get('reps', ''),
                    weight=exercise_data.get('weight', ''),
                    tempo=exercise_data.get('tempo', ''),
                    rest=exercise_data.get('rest', ''),
                    notes=exercise_data.get('notes', ''),
                    has_1rm_calculator=exercise_data.get('has_1rm_calculator', False),
                    has_weight_logging=exercise_data.get('has_weight_logging', False)
                )
                db.session.add(exercise)
        
        db.session.commit()
        
        return jsonify({'message': 'Workout updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update workout: {str(e)}'}), 500

@app.route('/api/user/workouts/<int:workout_id>', methods=['DELETE'])
@login_required
def delete_user_workout(workout_id):
    """Delete a workout owned by the current user"""
    try:
        # Ensure current_user is a User (not Coach)
        if not isinstance(current_user, User):
            return jsonify({'error': 'Only regular users can delete workouts'}), 403
        
        workout = Workout.query.get_or_404(workout_id)
        
        # Verify ownership
        if workout.created_by != current_user.id:
            return jsonify({'error': 'You can only delete your own workouts'}), 403
        
        db.session.delete(workout)
        db.session.commit()
        
        return jsonify({'message': 'Workout deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete workout: {str(e)}'}), 500

if __name__ == '__main__':
    # Only run dev server if not using gunicorn
    init_db()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=port)
else:
    # Initialize database when imported by gunicorn
    init_db()
