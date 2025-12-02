import os
from app import app, db, MurphEntry, Coach, User
from datetime import date

def verify_public_access():
    # Ensure instance path exists
    if not os.path.exists('instance'):
        os.makedirs('instance')

    # Use the REAL database to test the actual data/users
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/workouts.db' 
    # Actually, let's just use the app context which defaults to the real DB if not testing
    
    with app.app_context():
        print("Verifying public access logic...")
        
        # Check who would be selected
        target_coach = Coach.query.filter_by(username='nic.earley').first()
        if not target_coach:
            target_coach = Coach.query.filter_by(role='admin').first()
            
        print(f"Selected public user: {target_coach.username if target_coach else 'None'} (ID: {target_coach.id if target_coach else 'None'})")
        
        if target_coach and target_coach.username == 'nic.earley':
            print("SUCCESS: Correctly selected nic.earley")
        else:
            print("WARNING: Did not select nic.earley (might not exist in this env?)")

        # Check entries for this user
        if target_coach:
            entries = MurphEntry.query.filter_by(coach_id=target_coach.id).all()
            print(f"Found {len(entries)} entries for {target_coach.username}")

if __name__ == "__main__":
    verify_public_access()
