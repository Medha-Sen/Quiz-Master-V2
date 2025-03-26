import os

class Config:    
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

    # Redis Configuration
    #CELERY_BROKER_URL = "redis://localhost:6379/0"
    #CELERY_RESULT_BACKEND = "redis://localhost:6379/0"

class LocalDevelopmentConfig(Config):
    #configuration
    BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:5000")
    SQLALCHEMY_DATABASE_URI = "sqlite:///quiz_master_v2.db"
    DEBUG=True

    #config for security
    SECRET_KEY = "your_local_secret_key"
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_PASSWORD_SALT = "a_random_salt_string"  
    WTF_CSRF_ENABLED = False
    # Token Authentication
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    ##Celery
    CELERY_BROKER_URL = "redis://localhost:6379/0"  # Redis as a message queue
    RESULT_BACKEND = "redis://localhost:6379/0"  # Store results in Redis
    CELERY_TASK_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]

    MAIL_SERVER = "smtp.gmail.com"  # SMTP server for email notifications
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = "medha.iitm@gmail.com"  # Replace with your email
    MAIL_PASSWORD = "cqos cgez xdxl yfoh"