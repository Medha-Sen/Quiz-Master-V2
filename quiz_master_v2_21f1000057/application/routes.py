from flask import Blueprint, request, jsonify, current_app, render_template
from flask_security import auth_required, current_user, roles_required
from models import db, User, Role
from flask_security.utils import hash_password, verify_password
from datetime import datetime
from flask import request, jsonify
from models import db, Scores
import pandas as pd
from resources import redis_client, limiter, cache_response, get_cached_response
routes_bp = Blueprint("routes", __name__)

@routes_bp.route("/", methods=["GET"])
def home():
    return render_template("index.html")

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
@limiter.limit("10 per minute")
def login():
    """User/Admin Login Endpoint"""
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = current_app.security.datastore.find_user(email=email)

    if user and verify_password(password, user.password):
        token = user.get_auth_token()
        role = user.roles[0].name if user.roles else "User"  # Default to "User" if no role found

        return jsonify({
            "message": "Login successful",
            "user": { 
                "id": user.id,  # ✅ Include user ID
                "email": user.email
            },
            "role": role,  
            "token": token, 
            "redirect": "/admin" if role == "Admin" else "/user"
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401


@routes_bp.route("/api/admin")
@auth_required("token") #Authentication
@roles_required("Admin") #RBAC
def admin_dashboard():
    # Check Redis for cached response
    cached_data = get_cached_response("admin_dashboard")
    if cached_data:
        return jsonify(cached_data), 200

    response_data = {"message": "Admin logged in successfully!"}
    
    # Store in cache for 10 minutes
    cache_response("admin_dashboard", response_data, timeout=600)
    
    return jsonify(response_data)

@routes_bp.route("/api/user")
@auth_required("token") #Authentication
@roles_required(["User","Admin"]) #RBAC
@limiter.limit("30 per hour")
def user_dashboard():
    user= current_user    
    return jsonify({
        "full_name": user.full_name,
        "email": user.email,
        "qualification": user.qualification,
        "dob": user.dob.isoformat(),
        "password": user.password
    })
@routes_bp.route("/api/get-profile", methods=["GET"])
@limiter.limit("30 per minute")
def get_profile():
    """Get User Profile based on email"""
    email = request.args.get("email")  # Get email from query parameters

    if not email:
        return jsonify({"error": "Email is required"}), 400
    cache_key = f"profile:{email}"  # Unique cache key for user profile
    cached_profile = get_cached_response(cache_key)

    if cached_profile:
        return jsonify(cached_profile), 200  # Serve cached response
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_data={
        "full_name": user.full_name,
        "email": user.email,
        "qualification": user.qualification,
        "dob": user.dob.isoformat() if user.dob else None
    }
    cache_response(cache_key, user_data, timeout=300)  # Cache for 5 minutes
    return jsonify(user_data), 200


@routes_bp.route("/api/update-profile", methods=["PUT"])
@limiter.limit("10 per hour")  
def update_profile():
    """Update User Profile including email change"""
    data = request.json
    current_email = data.get("current_email")  # Get current email
    new_email = data.get("email")  # New email input

    if not current_email:
        return jsonify({"error": "Current email is required"}), 400

    user = User.query.filter_by(email=current_email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # If the email is changed, check if the new email is already taken
    if new_email and new_email != current_email:
        existing_user = User.query.filter_by(email=new_email).first()
        if existing_user:
            return jsonify({"error": "Email already in use"}), 400
        user.email = new_email  # Update email

    # Update other fields
    if "full_name" in data:
        user.full_name = data["full_name"]
    if "qualification" in data:
        user.qualification = data["qualification"]
    if "dob" in data:
        user.dob = datetime.strptime(data["dob"], "%Y-%m-%d").date()

    db.session.commit()  # Save changes
    redis_client.delete(f"profile:{current_email}")
    return jsonify({"message": "Profile updated successfully!", "updated_email": user.email}), 200

