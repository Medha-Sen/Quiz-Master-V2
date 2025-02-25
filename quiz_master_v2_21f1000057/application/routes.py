from flask import Blueprint, request, jsonify, current_app
from flask_security import auth_required, current_user, roles_required
from models import db, User, Role
from flask_security.utils import hash_password, verify_password

routes_bp = Blueprint("routes", __name__)

@routes_bp.route("/api/")
def home():
    return jsonify({"message": "Welcome to Quiz Master V2!"})

@routes_bp.route("/api/register", methods=["POST"])
def register():
    data = request.json
    if not current_app.security.datastore.find_user(email=data["email"]):
        current_app.security.datastore.create_user(
            email=data["email"],
            password=hash_password(data["password"]),
            full_name=data["full_name"],
            roles=["User"],
        )
        db.session.commit()    
        return jsonify({"message": "User registered successfully"}), 201
    return jsonify({"message": "User already exists"}), 400

@routes_bp.route("/api/login", methods=["POST"])
def login():
    """User/Admin Login Endpoint"""
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = current_app.security.datastore.find_user(email=email)

    if user and verify_password(password, user.password):
        return jsonify({"message": "Login successful", "user": email}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@routes_bp.route("/api/admin")
@auth_required("token") #Authentication
@roles_required("Admin") #RBAC
def admin_dashboard():
    return jsonify({"message": "Admin logged in successfully!"})

@routes_bp.route("/api/user")
@auth_required("token") #Authentication
@roles_required(["User","Admin"]) #RBAC
def user_dashboard():
    user= current_user    
    return jsonify({
        "full_name": user.full_name,
        "email": user.email,
        "password": user.password

    })
