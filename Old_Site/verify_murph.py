import os
from app import app, db, MurphEntry, Coach, User, init_db
from datetime import date

def verify_murph():
    # Ensure instance path exists
    if not os.path.exists('instance'):
        os.makedirs('instance')

    # Use a test database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/test_murph.db'
    app.config['TESTING'] = True
    
    with app.app_context():
        print("Initializing database...")
        db.create_all()
        
        # Create a test coach
        coach = Coach.query.filter_by(username='test_coach').first()
        if not coach:
            coach = Coach(username='test_coach', password_hash='hash', role='admin')
            db.session.add(coach)
            db.session.commit()
            print(f"Created test coach with ID: {coach.id}")
        else:
            print(f"Found test coach with ID: {coach.id}")
            
        # Create a Murph entry
        today = date.today()
        entry = MurphEntry.query.filter_by(date=today, coach_id=coach.id).first()
        if entry:
            db.session.delete(entry)
            db.session.commit()
            
        print("Creating Murph entry...")
        new_entry = MurphEntry(
            coach_id=coach.id,
            date=today,
            duration="45:00",
            rep_scheme="Cindy",
            notes="Test entry"
        )
        db.session.add(new_entry)
        db.session.commit()
        print("Murph entry created.")
        
        # Verify entry
        saved_entry = MurphEntry.query.filter_by(date=today, coach_id=coach.id).first()
        if saved_entry:
            print(f"Verified entry: Date={saved_entry.date}, Time={saved_entry.duration}, Notes={saved_entry.notes}")
        else:
            print("FAILED to verify entry.")
            
        # Clean up
        db.session.delete(new_entry)
        db.session.delete(coach)
        db.session.commit()
        print("Cleanup complete.")

if __name__ == "__main__":
    verify_murph()
