from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from config import LocalDevelopmentConfig
import uuid
from datetime import datetime

# App Initialization
app = Flask(__name__)
app.config.from_object(LocalDevelopmentConfig)
db = SQLAlchemy(app)

# Association Table for Many-to-Many Relationship (Users & Roles)
roles_users = db.Table(
    'roles_users',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'))
)

# Role Model (Admin/User)
class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

# User Model (Admin & Users are differentiated by roles)
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  # Flask-Security will handle hashing
    full_name = db.Column(db.String(100), nullable=False)
    qualification = db.Column(db.String(100))
    dob = db.Column(db.Date)
    active = db.Column(db.Boolean, default=True)  # Required by Flask-Security
    fs_uniquifier = db.Column(db.String(64), unique=True, default=lambda: str(uuid.uuid4()))
    
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
    scores = db.relationship('Scores', backref='user', lazy=True)

# Subject Model
class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    chapters = db.relationship('Chapter', backref='subject', lazy=True)

# Chapter Model
class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    quizzes = db.relationship('Quiz', backref='chapter', lazy=True)

# Quiz Model
class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)
    date_of_quiz = db.Column(db.Date)
    time_duration = db.Column(db.String(10))
    remarks = db.Column(db.Text)
    
    questions = db.relationship('Questions', backref='quiz', lazy=True)
    scores = db.relationship('Scores', backref='quiz', lazy=True)

    def get_subject_name(self):
        return self.chapter.subject.name

    def get_chapter_name(self):
        return self.chapter.name

    def num_questions(self):
        return len(self.questions)

    def __repr__(self):
        return f"<Quiz(id='{self.id}', date_of_quiz='{self.date_of_quiz}')>"

# Questions Model
class Questions(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_title = db.Column(db.String(100), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(300), nullable=False)
    option2 = db.Column(db.String(300), nullable=False)
    option3 = db.Column(db.String(300), nullable=False)
    option4 = db.Column(db.String(300), nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)

# Scores Model
class Scores(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    time_stamp_of_attempt = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    total_scored = db.Column(db.Integer, nullable=False)
    
# Database Creation
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database Created Successfully")
