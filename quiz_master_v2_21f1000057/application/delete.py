from models import db, User
from app import create_app  

app = create_app()

def delete_user(user_id):
    """Deletes a user by ID from the database."""
    with app.app_context():
        user = User.query.get(user_id)
        if user:
            db.session.delete(user)
            db.session.commit()
            db.session.flush()  # ✅ Ensure changes are flushed to the database
            print(f"✅ User with ID {user_id} deleted successfully.")
        else:
            print(f"❌ User with ID {user_id} not found.")

delete_user(6)
