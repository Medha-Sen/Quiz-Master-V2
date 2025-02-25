from flask import Flask
from config import LocalDevelopmentConfig
from models import db, User, Role
from routes import routes_bp  
from datetime import datetime
from flask_security import Security, SQLAlchemyUserDatastore, hash_password

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    
    db.init_app(app)

    # Setup Flask-Security (Token-based authentication)
    user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, user_datastore)

    app.register_blueprint(routes_bp)  # Register Routes

    with app.app_context():
        db.create_all()
        create_roles(user_datastore)  # ✅ Ensure roles exist
        create_admin_account(user_datastore)  # ✅ Ensure Admin Exists
        create_general_user(user_datastore)  # ✅ Create a general user (optional)

    return app

def create_roles(user_datastore):
    """Ensure the 'Admin' and 'User' roles exist."""
    if not user_datastore.find_role("Admin"):
        user_datastore.create_role(name="Admin", description="Superuser with all permissions.")
    if not user_datastore.find_role("User"):
        user_datastore.create_role(name="User", description="General user with limited access.")
    db.session.commit()

def create_admin_account(user_datastore):
    """Create the Admin user if it does not exist and assign the Admin role."""
    if not user_datastore.find_user(email="admin@example.com"):
        admin_user = user_datastore.create_user(
            email="admin@example.com",
            password=hash_password("adminpassword"),  # ✅ Hash password for security
            full_name="Admin User",
            qualification="Supervisor",
            dob=datetime.strptime("2000-01-01", "%Y-%m-%d").date(),
            roles=["Admin"],  # ✅ Assign Admin role
            active=True
        )
        admin_role = user_datastore.find_role("Admin")
        if admin_role:
            user_datastore.add_role_to_user(admin_user, admin_role)  # ✅ Assign Admin role
        db.session.commit()

def create_general_user(user_datastore):
    """Create a General User account for testing."""
    if not user_datastore.find_user(email="user@example.com"):
        general_user = user_datastore.create_user(
            email="user@example.com",
            password=hash_password("userpassword"),  # ✅ Hash password for security
            full_name="General User",
            qualification="Standard",
            dob=datetime.strptime("2002-05-10", "%Y-%m-%d").date(),
            roles=["User"],  # ✅ Assign User role
            active=True
        )
        user_role = user_datastore.find_role("User")
        if user_role:
            user_datastore.add_role_to_user(general_user, user_role)  # ✅ Assign User role
        db.session.commit()

# Initialize the app
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
