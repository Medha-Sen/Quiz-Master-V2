from flask import Flask
from flask_mail import Mail, Message
import os

app = Flask(__name__)
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = "medha.iitm@gmail.com"
app.config["MAIL_PASSWORD"] = "cqos cgez xdxl yfoh"

mail = Mail(app)

with app.app_context():
    msg = Message("Test Email", sender=app.config["MAIL_USERNAME"], recipients=["medhasen1001@gmail.com"])
    msg.body = "This is a test email from Flask."
    mail.send(msg)
    print("Email sent successfully!")
