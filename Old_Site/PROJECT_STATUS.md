# Project Status Summary - Fitness Programming App

## Current State Overview

### Core Architecture
- **Backend**: Flask (Python) with SQLAlchemy ORM
- **Database**: SQLite with automatic migrations
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Flask-Login with role-based access control
- **Deployment**: Docker-ready with Docker Compose support

---

## Database Models

### 1. **Coach Model** (Admin/Coach accounts)
- `id`, `username`, `password_hash`
- `first_name`, `last_name` (recently added)
- `role` (admin, coach, user) - recently added
- `created_at`
- Methods: `is_admin()`, `is_coach()`, `is_user()`, `get_initials()`

### 2. **User Model** (Regular user accounts)
- `id`, `username`, `password_hash`
- `first_name`, `last_name`
- `role` (default: 'user')
- `created_at`
- Relationship: `logged_weights` (to LoggedWeight)
- Methods: `is_admin()`, `is_coach()`, `is_user()`, `get_initials()`

### 3. **Workout Model**
- `id`, `date`, `workout_name`
- `created_by` (references Coach or User)
- `created_at`, `updated_at`
- Relationships: `exercises`, `exercise_groups`, `creator`, `logged_weights`

### 4. **ExerciseGroup Model** (Supersets/WODs)
- `id`, `workout_id`, `order`
- `group_name`, `rounds`, `rep_scheme`, `notes`
- Relationship: `exercises`

### 5. **Exercise Model**
- `id`, `workout_id`, `group_id` (nullable), `order`
- `exercise_name`, `sets`, `reps`, `weight`, `tempo`, `rest`, `notes`
- `has_1rm_calculator` (boolean) - enables calculator button
- Relationship: `logged_weights`

### 6. **LoggedWeight Model** (Partially Implemented)
- `id`, `user_id`, `exercise_id`, `workout_id`
- `weight`, `reps`, `sets`, `date`, `created_at`
- Relationships: `user`, `exercise`, `workout`
- **Status**: Model exists but API endpoints are missing

---

## Implemented Features

### ✅ Public View (`/`)
- Swipeable weekly calendar (Swiper.js)
- Workout display with exercise groups
- Theme selector (Light, Dark, Blue, Pink)
- 1RM Calculator (per exercise, if enabled)
- Gym Timer (Simple & Interval modes)
- Multiple workouts per day support
- Creator information display (name/initials)

### ✅ Admin Dashboard (`/admin`)
- Workout CRUD operations
- Exercise group/superset support
- Exercise editor with all fields
- 1RM calculator toggle per exercise
- Creator assignment for workouts
- Theme selector
- User Management link

### ✅ User Management (`/admin/users`)
- Create/edit/delete users
- Role-based access (admin, coach, user)
- Profile icons with initials
- First/Last name support
- Coaches can only manage users (not admins/coaches)
- Admins can manage all roles

### ✅ User Profile (`/user/profile`)
- Edit own profile
- Change username, first/last name
- Change password (requires current password)
- Theme selector

### ✅ Authentication & Authorization
- Role-based login redirects
- Persistent sessions (30 days)
- `admin_required` decorator
- `coach_required` decorator
- Login supports both Coach and User models

---

## API Endpoints

### Workouts
- `GET /api/workouts` - List workouts (with date range)
- `GET /api/workouts/<id>` - Get single workout
- `GET /api/workouts/date/<date>` - Get workouts for specific date
- `POST /api/workouts` - Create workout (coach required)
- `PUT /api/workouts/<id>` - Update workout (coach required)
- `DELETE /api/workouts/<id>` - Delete workout (coach required)

### Users
- `GET /api/users` - List all users (coach required)
- `POST /api/users` - Create user (coach required)
- `PUT /api/users/<id>` - Update user (coach required)
- `DELETE /api/users/<id>` - Delete user (coach required)

### User Profile
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update current user profile

### Coaches (Legacy)
- `POST /api/coaches/register` - Register coach (admin required)

### Missing APIs
- ❌ **LoggedWeight endpoints** - No CRUD APIs for weight logging
- ❌ **Leaderboard endpoints** - No API for displaying leaderboards

---

## Frontend Files

### JavaScript Files
1. **main.js** - Public calendar & workout display
2. **admin_dashboard.js** - Workout editor & management
3. **admin_login.js** - Login handling
4. **theme.js** - Theme switching & persistence
5. **1rm-calculator.js** - 1RM percentage calculator
6. **gym-timer.js** - Timer functionality
7. **user_management.js** - User CRUD interface
8. **user_profile.js** - Profile editing

### Templates
1. **index.html** - Public workout view
2. **admin_dashboard.html** - Coach/admin dashboard
3. **admin_login.html** - Login page
4. **user_management.html** - User management interface
5. **user_profile.html** - User profile page

---

## Recent Changes (Not in My Previous Work)

### User Management System
- Separate `User` model from `Coach` model
- Role-based access control (admin, coach, user)
- First/Last name fields added to both models
- Profile icons with initials
- User management UI for coaches/admins
- User profile page for self-editing

### Workout Creator Tracking
- Workouts track `created_by` (can be Coach or User)
- Creator name/initials displayed in workout lists
- Creator dropdown in workout editor
- API endpoints return creator information

### Database Migrations
- Automatic migration for `has_1rm_calculator` column
- Automatic migration for `role` column
- Automatic migration for `first_name`/`last_name` columns
- Automatic creation of `user` and `logged_weight` tables

### UI Improvements
- Header text changed to "DW" (from "DW HYBRID CREW")
- Theme selector on all pages
- Consistent styling across admin pages

---

## Partially Implemented Features

### Weight Logging
- ✅ Database model (`LoggedWeight`) exists
- ✅ Database table created automatically
- ❌ No API endpoints for CRUD operations
- ❌ No UI for logging weights
- ❌ No display of logged weights

### Leaderboard
- ❌ No database queries for leaderboard data
- ❌ No API endpoints
- ❌ No UI/template

---

## Configuration

### Environment Variables
- `SECRET_KEY` - Flask secret key
- `DATABASE_URL` - Database connection string
- `PORT` - Server port (default: 5000)
- `FLASK_DEBUG` - Debug mode (True/False)

### Session Configuration
- Remember cookie duration: 30 days
- Session cookie lifetime: 30 days
- Secure cookies: Disabled (enable in production with HTTPS)

---

## Deployment Status

### Docker Support
- ✅ Dockerfile exists
- ✅ docker-compose.yml exists
- ✅ Volume mounting for database persistence
- ✅ Gunicorn for production
- ✅ Health checks configured

### Deployment Documentation
- ✅ DEPLOYMENT.md - Unraid + Cloudflare Tunnel guide
- ✅ DEPLOYMENT_WORKFLOW.md - Update workflow & backup procedures

---

## Known Issues / Areas for Improvement

1. **Weight Logging**: Model exists but no functionality implemented
2. **Leaderboard**: Not implemented at all
3. **Multiple Workouts Per Day**: Supported but UI could be improved (dropdown?)
4. **Exercise History**: No tracking of exercise progression over time
5. **Workout Templates**: No template/copy functionality
6. **Mobile Responsiveness**: May need testing/improvements on various devices

---

## Next Steps (Based on TODO List)

1. ✅ Theme selector - COMPLETE
2. ✅ UI cleanup - COMPLETE
3. ✅ 1RM calculator - COMPLETE
4. ✅ Gym timer - COMPLETE
5. ⏳ Weight logging - PARTIAL (model exists, needs API & UI)
6. ⏳ Leaderboard - NOT STARTED

---

## Technical Debt / Notes

- User loader checks both Coach and User tables (backward compatibility)
- Some code duplication between Coach and User models
- Database migrations are manual ALTER TABLE statements (could use Alembic)
- No automated tests
- No API documentation
- Error handling could be more consistent

---

## File Structure
```
FitnessProgramming/
├── app.py                    # Main Flask application
├── run.py                    # Entry point
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker image definition
├── docker-compose.yml       # Docker Compose config
├── README.md                # Project documentation
├── DEPLOYMENT.md            # Deployment guide
├── DEPLOYMENT_WORKFLOW.md   # Update workflow
├── instance/
│   └── workouts.db          # SQLite database
├── templates/
│   ├── index.html           # Public view
│   ├── admin_dashboard.html # Admin dashboard
│   ├── admin_login.html     # Login page
│   ├── user_management.html # User management
│   └── user_profile.html    # User profile
└── static/
    ├── css/
    │   └── style.css        # All styles
    └── js/
        ├── main.js          # Public view logic
        ├── admin_dashboard.js
        ├── admin_login.js
        ├── theme.js
        ├── 1rm-calculator.js
        ├── gym-timer.js
        ├── user_management.js
        └── user_profile.js
```

---

## Summary

The application is a **feature-rich workout programming system** with:
- ✅ Complete workout management
- ✅ User/coach/admin role system
- ✅ Theme customization
- ✅ 1RM calculator
- ✅ Gym timer
- ⏳ Partial weight logging (needs API & UI)
- ❌ Missing leaderboard feature

The codebase is well-structured and ready for the next phase of development.

