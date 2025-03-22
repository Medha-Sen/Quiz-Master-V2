from celery import Celery, shared_task
from flask_mail import Message
from flask_apscheduler.scheduler import APScheduler
from models import db, User, Scores
from datetime import datetime
from app import create_app, make_celery
from sqlalchemy import desc
import os
import pandas as pd

# Initialize Flask app and Celery
app = create_app()
celery = make_celery(app)
mail = app.extensions.get("mail")

# Initialize APScheduler
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

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
# Schedule Daily Reminders (9 AM)
@scheduler.task("cron", id="daily_reminder", hour=9, minute=0)
def schedule_daily_reminder():
    send_quiz_reminder.delay()

# Schedule Monthly Reports (1st of Every Month at 10 AM)
@scheduler.task("cron", id="monthly_report", day=1, hour=10, minute=0)
def schedule_monthly_report():
    send_monthly_performance_report.delay()