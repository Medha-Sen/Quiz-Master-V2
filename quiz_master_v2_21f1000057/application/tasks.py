from celery import Celery, shared_task
from flask_mail import Message
from flask_apscheduler.scheduler import APScheduler
from models import db, User, Scores
from datetime import datetime
from app import create_app
from sqlalchemy import desc
from flask_mail import Mail
from tabulate import tabulate
import os
import pandas as pd
from pytz import timezone
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
# Initialize Flask app and Celery
app = create_app()
celery = make_celery(app)
mail = Mail(app)
# Initialize APScheduler
scheduler = APScheduler()
scheduler.configure(timezone=timezone("Asia/Kolkata"))
if not scheduler.running:
    scheduler.init_app(app)
    scheduler.start()

@shared_task
def send_quiz_reminder():
    """Send daily quiz reminders to users via email (excluding admin)."""
    with app.app_context():
        users = User.query.filter(User.active == 1, User.email != "admin@example.com").all()
        print(f"✅ Found {len(users)} active users (excluding admin)")
        for user in users:
            msg = Message(
                "Daily Quiz Reminder",
                sender=app.config["MAIL_USERNAME"],
                recipients=[user.email],  # ✅ Only send to the user, not hardcoded emails
                body=f"Hello {user.full_name},\n\nDon't forget to attempt today's quiz!\n\nHappy Learning!"
            )
            mail.send(msg)
        return f"Daily Quiz Reminders sent to {len(users)} users."
@shared_task
def send_monthly_performance_report():
    """Send monthly performance reports to users as an email attachment."""
    with app.app_context():
        users = User.query.filter(User.active == 1, User.email != "admin@example.com").all()  # Ensure active users

        if not users:
            return "No active users found."

        for user in users:
            # Generate the user summary CSV
            export_result = export_user_summary(user.id)

            if "error" in export_result:
                file_path = None
                performance_message = f"Error generating performance report: {export_result['error']}"
            elif "file_path" in export_result:
                file_path = export_result["file_path"]
                performance_message = "Your monthly performance report is attached."

            msg = Message(
                "Your Monthly Performance Report",
                sender=app.config["MAIL_USERNAME"],
                recipients=[user.email],
                body=f"""
Hello {user.full_name},

{performance_message}

Keep improving!
                """
            )

            # Attach the CSV file if available
            if file_path and os.path.exists(file_path):
                with open(file_path, "rb") as fp:
                    msg.attach(
                        filename=os.path.basename(file_path),
                        content_type="text/csv",
                        data=fp.read()
                    )

            mail.send(msg)  # Send the email

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
# Schedule Daily Reminders (9 AM)
@scheduler.task("cron", id="daily_reminder", hour=9, minute=0)
def schedule_daily_reminder():
    send_quiz_reminder.delay()

# Schedule Monthly Reports (1st of Every Month at 10 AM)
@scheduler.task("cron", id="monthly_report", day=1, hour=10, minute=0)
def schedule_monthly_report():
    send_monthly_performance_report.delay()