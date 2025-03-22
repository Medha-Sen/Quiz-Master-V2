from celery import Celery, shared_task
from flask_apscheduler.scheduler import APScheduler
from sqlalchemy import desc
import os
import pandas as pd
from flask import Flask
from sqlalchemy import desc
from sqlalchemy.orm import joinedload
from config import LocalDevelopmentConfig
from models import db, User, Role, Quiz,Scores, Questions, Chapter, Subject
from routes import routes_bp  
from datetime import datetime
from flask_security import Security, SQLAlchemyUserDatastore, hash_password
from resources import api
from flask_mail import Mail, Message
from flask import Flask, jsonify, send_from_directory
import matplotlib.pyplot as plt
import seaborn as sns
import time
from flask_apscheduler.scheduler import APScheduler
from config import LocalDevelopmentConfig
from flask_mail import Mail
mail = Mail()
def make_celery(app):
    """Initialize and configure Celery with Flask app context."""
    celery = Celery(app.import_name, broker=app.config['CELERY_BROKER_URL'])
    celery.conf.update(app.config)
    celery.conf.update({
        "worker_prefetch_multiplier": 1,   # Prevents task congestion
        "task_serializer": "json",         # Use JSON for efficiency
        "result_serializer": "json",
        "accept_content": ["json"],
        "worker_concurrency": 4,           # Adjust based on CPU cores (e.g., 4 cores → concurrency 4)
        "task_routes": {                   # Define task-specific routing
            "tasks.send_email": {"queue": "email"},
            "tasks.process_data": {"queue": "data"},
        }
    })
    class ContextTask(celery.Task):
        """Ensure tasks run within Flask app context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return super().__call__(*args, **kwargs)

    celery.Task = ContextTask  # ✅ Set custom base task class
    return celery

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
            roles=["Admin","User"],  # ✅ Assign Admin role
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
def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    
    db.init_app(app)
    api.init_app(app)  
    mail.init_app(app)
    # Setup Flask-Security (Token-based authentication)
    user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, user_datastore)

    app.register_blueprint(routes_bp)  # Register Routes
    #Initialize Celery
    app.celery = make_celery(app)  
    with app.app_context():
        db.create_all()
        create_roles(user_datastore)  # ✅ Ensure roles exist
        create_admin_account(user_datastore)  # ✅ Ensure Admin Exists
        create_general_user(user_datastore)  # ✅ Create a general user (optional)

    return app
app = create_app()

# API Route to fetch leaderboard data

@shared_task
def send_quiz_reminder():
    """Send daily quiz reminders to users via email."""
    with app.app_context():  # ✅ Use `create_app()` inside task
        users = User.query.filter_by(active=True).all()
        for user in users:
            msg = Message(
                "Daily Quiz Reminder",
                sender=app.config["MAIL_USERNAME"],
                recipients=["medhasen1001@gmail.com", "medha1001@yahoo.com"],
                body=f"Hello {user.full_name},\n\nDon't forget to attempt today's quiz!\n\nHappy Learning!"
            )
            mail.send(msg)
        return f"Daily Quiz Reminders sent to {len(users)} users."
@shared_task
def send_monthly_performance_report():
    """Send monthly performance reports to users."""
    with app.app_context():  # ✅ Use a single app instance
        users = User.query.filter_by(active=True).all()
        
        if not users:
            return "No active users found."

        for user in users:
            # Generate the user summary data
            export_result = export_user_summary(user.id)
            
            if "error" in export_result:
                performance_data = f"Error generating performance report: {export_result['error']}"
            elif "file_path" in export_result:
                df = pd.read_csv(export_result["file_path"])  # Load the CSV
                performance_data = df.to_string(index=False)  # Convert to string format for email
            else:
                performance_data = "No quiz attempts available."

            msg = Message(
                "Your Monthly Performance Report",
                sender=app.config["MAIL_USERNAME"],  # ✅ Get sender from config
                recipients=[user.email],  # ✅ Ensure recipient is a valid list
                body=f"""
                Hello {user.full_name},

                Here is your monthly performance report:

                {performance_data}

                Keep improving!
                """
            )
            mail.send(msg)  # ✅ Send the email

        return f"Monthly Reports sent to {len(users)} users."
@shared_task
def export_user_summary(user_id):
    """Exports a user's quiz summary data to CSV asynchronously."""
    try:
        scores = Scores.query.filter(Scores.user_id == user_id).order_by(desc(Scores.time_stamp_of_attempt)).all()
        
        if not scores:
            return {"message": "No scores available for export."}

        quiz_summary = []
        processed_quizzes = {}

        for score in scores:
            quiz_id = score.quiz_id

            if quiz_id not in processed_quizzes:
                quiz_attempts = Scores.query.filter(Scores.user_id == user_id, Scores.quiz_id == quiz_id).all()
                highest_score = max(s.total_scored for s in quiz_attempts)
                average_score = round(sum(s.total_scored for s in quiz_attempts) / len(quiz_attempts), 2)

                quiz_summary.append({
                    "Quiz ID": quiz_id,
                    "User ID": score.user_id,
                    "Full Name": score.user.full_name,
                    "Subject": score.quiz.chapter.subject.name,
                    "Chapter": score.quiz.chapter.name,
                    "Total Attempts": len(quiz_attempts),
                    "Highest Score": highest_score,
                    "Average Score": average_score
                })

                processed_quizzes[quiz_id] = True  

        df = pd.DataFrame(quiz_summary)
        
        os.makedirs("exports", exist_ok=True)
        export_path = f"exports/user_{user_id}_summary.csv"
        df.to_csv(export_path, index=False)

        return {"message": "Export successful", "file_path": export_path}
    
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    app.run(debug=True)
