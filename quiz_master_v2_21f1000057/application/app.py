from flask import Flask, send_file
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
import pandas as pd
import os
import time
def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    
    db.init_app(app)
    api.init_app(app)  
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

# Initialize the app
app = create_app()

def generate_subject_avg_chart(scores):
    df = pd.DataFrame(scores)

    # Compute average and highest scores per subject
    avg_scores = df.groupby("subject_name")["total_scored"].mean()
    highest_scores = df.groupby("subject_name")["total_scored"].max()

    # Prepare the data for Chart.js
    chart_data = {
        "labels": avg_scores.index.tolist(),
        "datasets": [
            {
                "label": "Average Score",
                "data": avg_scores.tolist(),
                "backgroundColor": "rgba(65, 105, 225, 0.6)",  # Royal Blue
                "borderColor": "rgba(65, 105, 225, 1)",
                "borderWidth": 1
            },
            {
                "label": "Highest Score",
                "data": highest_scores.tolist(),
                "backgroundColor": "rgba(255, 140, 0, 0.6)",  # Dark Orange
                "borderColor": "rgba(255, 140, 0, 1)",
                "borderWidth": 1
            }
        ]
    }

    return chart_data
def generate_performance_trend_chart(scores):
    df = pd.DataFrame(scores)

    # Count the number of quiz attempts per subject
    subject_counts = df["subject_name"].value_counts()

    # Prepare the data for Chart.js
    chart_data = {
        "labels": subject_counts.index.tolist(),
        "datasets": [
            {
                "data": subject_counts.tolist(),
                "backgroundColor": sns.color_palette("husl", len(subject_counts)).as_hex(),  # Use Seaborn colors
                "hoverOffset": 4
            }
        ]
    }

    return chart_data
def get_all_scores():
    try:
        scores = (
            db.session.query(Scores)
            .join(Quiz, Scores.quiz_id == Quiz.id)
            .join(Chapter, Quiz.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
            .join(User, Scores.user_id == User.id)
            .options(
                joinedload(Scores.quiz).joinedload(Quiz.chapter).joinedload(Chapter.subject)
            )
            .order_by(desc(Scores.time_stamp_of_attempt))
            .all()
        )

        if not scores:
            return []

        return [
            {
                "quiz_id": score.quiz_id,
                "user_id": score.user_id,
                "subject_name": score.quiz.chapter.subject.name,
                "noq": score.quiz.num_questions(),
                "username": score.user.full_name,
                "chapter_name": score.quiz.chapter.name,
                "total_scored": score.total_scored,
                "timestamp": score.time_stamp_of_attempt.strftime("%Y-%m-%d %H:%M:%S")
            }
            for score in scores
        ]

    except Exception as e:
        print(f"Error fetching scores: {str(e)}")
        return []

def construct_leaderboard(scores):
    df = pd.DataFrame(scores)

    if df.empty:
        return []

    df["normalized_score"] = (df["total_scored"] / df["noq"]) * 100  

    # ✅ Group by user_id AND username
    leaderboard = df.groupby(["user_id", "username"]).agg(
        avg_score=("normalized_score", "mean"),
        std_dev=("normalized_score", "std"),
        num_attempts=("quiz_id", "count"),
        total_score=("total_scored", "sum")
    ).fillna(0)

    k = 2  # Penalty weight for inconsistency
    leaderboard["final_score"] = (
        leaderboard["total_score"] / leaderboard["num_attempts"]
    ) + (k * leaderboard["std_dev"])

    leaderboard = leaderboard.reset_index()  # ✅ Ensure user_id and username are not lost

    # ✅ Sort by final_score in descending order (highest score first)
    leaderboard = leaderboard.sort_values(by="final_score", ascending=False).reset_index(drop=True)

    print("Constructed Leaderboard:", leaderboard.to_dict(orient="records"))  # Debugging Output

    return leaderboard.to_dict(orient="records")
@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    scores = get_all_scores()  # Get scores from your database

    if not scores:
        return jsonify({"error": "No scores found"}), 404

    leaderboard = construct_leaderboard(scores)

    return jsonify({
        "leaderboard": leaderboard,
    })
def get_scores_by_user(user_id):
    try:
        scores = (
            db.session.query(Scores)
            .join(Quiz, Scores.quiz_id == Quiz.id)
            .join(Chapter, Quiz.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
            .join(User, Scores.user_id == User.id)
            .options(
                joinedload(Scores.quiz).joinedload(Quiz.chapter).joinedload(Chapter.subject)
            )
            .filter(Scores.user_id == user_id)  # Filter for a specific user
            .order_by(desc(Scores.time_stamp_of_attempt))
            .all()
        )

        if not scores:
            return []

        return [
            {
                "quiz_id": score.quiz_id,
                "user_id": score.user_id,
                "subject_name": score.quiz.chapter.subject.name,
                "noq": score.quiz.num_questions(),
                "username": score.user.full_name,
                "chapter_name": score.quiz.chapter.name,
                "total_scored": score.total_scored,
                "timestamp": score.time_stamp_of_attempt.strftime("%Y-%m-%d %H:%M:%S")
            }
            for score in scores
        ]

    except Exception as e:
        print(f"Error fetching scores: {str(e)}")
        return []

@app.route("/api/scores/charts/<int:user_id>", methods=["GET"])
def get_scores_charts(user_id):
    scores = get_scores_by_user(user_id)  # Get the scores from your database

    # Generate the charts
    subject_chart = generate_subject_avg_chart(scores)
    trend_chart = generate_performance_trend_chart(scores)

    return jsonify({
        "subject_chart": subject_chart,
        "trend_chart": trend_chart
    })
from flask import request, redirect, url_for, session, send_file
import csv
import io
def get_quiz_history(user_id): 
    try:
        scores = (
            db.session.query(Scores)
            .join(Quiz, Scores.quiz_id == Quiz.id)
            .join(Chapter, Quiz.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
            .join(User, Scores.user_id == User.id)
            .options(
                joinedload(Scores.quiz).joinedload(Quiz.chapter).joinedload(Chapter.subject)
            )
            .filter(Scores.user_id == user_id)  # Filter for a specific user
            .order_by(Scores.time_stamp_of_attempt.desc())
            .all()
        )
        return scores
    except Exception as e:
        print(f"Error fetching quiz history: {e}")
        return []
@app.route('/download_quiz_history/<int:user_id>')
def download_quiz_history(user_id):
    scores = get_quiz_history(user_id)

    if not scores:
        return "No quiz history found for this user.", 404

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Quiz ID', 'Subject', 'Chapter', 'Date Attempted', 'Score'])

    for score in scores:
        writer.writerow([
            score.quiz_id,
            score.quiz.chapter.subject.name,
            score.quiz.chapter.name,
            score.time_stamp_of_attempt.strftime('%Y-%m-%d %H:%M:%S'),
            score.total_scored
        ])

    output.seek(0)
    return send_file(io.BytesIO(output.getvalue().encode()), 
                     mimetype='text/csv', 
                     as_attachment=True, 
                     download_name=f'quiz_attempt_history_{user_id}.csv')

# Function to construct leaderboard
if __name__ == "__main__":
    app.run(debug=True)
