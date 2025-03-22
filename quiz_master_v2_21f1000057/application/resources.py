from flask_restful import Resource, Api, reqparse
from sqlalchemy import func, desc
from models import db, Subject, Chapter, Quiz, Questions, Scores, User
from flask_security import auth_required, roles_required
from flask import request, jsonify, send_file
from datetime import datetime
from flask import make_response
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
import redis
import json
api = Api()
# Initialize Redis Cache
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
cache = Cache(config={"CACHE_TYPE": "RedisCache", "CACHE_REDIS_URL": "redis://localhost:6379/0"})

# Initialize Rate Limiter
limiter = Limiter(get_remote_address, default_limits=["200 per day", "50 per hour"])

def cache_response(key, data, timeout=300):
    """Helper function to cache API responses"""
    redis_client.setex(key, timeout, json.dumps(data))

def get_cached_response(key):
    """Retrieve cached response if available"""
    cached_data = redis_client.get(key)
    return json.loads(cached_data) if cached_data else None
# CRUD for Subjects
class SubjectResource(Resource):
    @limiter.limit("10 per minute")  # Limit requests
    def get(self, subject_id=None):
        """Retrieve all subjects or a specific subject with chapters."""
        cache_key = f"subject_{subject_id}" if subject_id else "subjects_list"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)

        if subject_id:
            subject = Subject.query.get(subject_id)
            if subject:
                response={
                    "id": subject.id,
                    "name": subject.name,
                    "description": subject.description,
                    "chapters": [
                        {"id": ch.id, "name": ch.name, "description": ch.description}
                        for ch in subject.chapters
                    ]
                }
            return jsonify({"error": "Subject not found"}), 404
        else:
            subjects = Subject.query.all()
            response=[
                {
                    "id": s.id,
                    "name": s.name,
                    "description": s.description,
                    "chapters": [
                        {"id": ch.id, "name": ch.name, "description": ch.description}
                        for ch in s.chapters
                    ]
                }
                for s in subjects
            ]
        cache_response(cache_key, response)
        return jsonify(response)
    def post(self):
        """Create a new subject."""
        data = request.json
        new_subject = Subject(name=data["name"], description=data.get("description", ""))
        db.session.add(new_subject)
        db.session.commit()
        redis_client.delete("subjects_list")
        return {
            "message": "Subject created successfully",
            "subject": {
                "id": new_subject.id,
                "name": new_subject.name,
                "description": new_subject.description
            }
        }, 201
    @limiter.limit("5 per minute")
    def put(self, subject_id):
        """Edit an existing subject."""
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404

        data = request.json
        subject.name = data.get("name", subject.name)
        subject.description = data.get("description", subject.description)
        db.session.commit()
        redis_client.delete(f"subject_{subject_id}")
        redis_client.delete("subjects_list")
        return jsonify({"message": "Subject updated successfully"})
    @limiter.limit("5 per minute")
    def delete(self, subject_id):
        """Delete a subject along with all its chapters."""
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404

        # Delete all associated chapters before deleting the subject
        chapters = Chapter.query.filter_by(subject_id=subject_id).all()
        for chapter in chapters:
            db.session.delete(chapter)
        
        db.session.delete(subject)
        db.session.commit()

        # Clear relevant cache entries
        redis_client.delete(f"subject_{subject_id}")
        redis_client.delete("subjects_list")
        redis_client.delete("chapters_list")
        redis_client.delete(f"chapters_list_subject_{subject_id}")

        return jsonify({"message": "Subject and all its chapters deleted successfully"})


# Register Resources
api.add_resource(SubjectResource, "/api/subjects", "/api/subjects/<int:subject_id>")
# CRUD for Chapters
class ChapterResource(Resource):
    @limiter.limit("10 per minute")
    def get(self, chapter_id=None):
        """Retrieve all chapters or a specific chapter, or filter by subject_id."""
        
        subject_id = request.args.get("subject_id")  # Get subject_id from query params
        
        if chapter_id:
            cache_key = f"chapter_{chapter_id}"
        elif subject_id:
            cache_key = f"chapters_list_subject_{subject_id}"
        else:
            cache_key = "chapters_list"

        cached_data = get_cached_response(cache_key)
        if cached_data and request.args.get("force_refresh") != "true":
            return jsonify(cached_data)

        if chapter_id:
            chapter = Chapter.query.get(chapter_id)
            if chapter:
                response = {
                    "id": chapter.id,
                    "name": chapter.name,
                    "description": chapter.description,
                    "subject_id": chapter.subject_id
                }
                cache_response(cache_key, response)
                return jsonify(response)
            return jsonify({"error": "Chapter not found"}), 404

        else:
            # ✅ Filter chapters by subject_id if provided
            query = Chapter.query
            if subject_id:
                query = query.filter_by(subject_id=subject_id)

            chapters = query.all()
            response = [{"id": c.id, "name": c.name, "subject_id": c.subject_id} for c in chapters]

            cache_response(cache_key, response)
            return jsonify(response)
    def post(self):
        """Create a new chapter with a description."""
        data = request.json

        # Ensure required fields are present
        if "name" not in data or "subject_id" not in data:
            return jsonify({"error": "Missing required fields"}), 400

        new_chapter = Chapter(
            name=data["name"],
            description=data.get("description", ""),  # Default to empty string if not provided
            subject_id=data["subject_id"]
        )

        db.session.add(new_chapter)
        db.session.commit()

        # ✅ Clear all relevant cache entries
        redis_client.delete("chapters_list")
        redis_client.delete("subjects_list")
        redis_client.delete(f"chapters_list_subject_{data['subject_id']}")  # ✅ NEW: Clear subject-specific chapter list cache
        redis_client.delete(f"subject_{data['subject_id']}")  # ✅ NEW: Ensure fresh subject cache

        return {
            "message": "Chapter created successfully",
            "id": new_chapter.id,
            "name": new_chapter.name,
            "description": new_chapter.description
        }, 201

    @limiter.limit("5 per minute")
    def put(self, chapter_id):
        """Edit an existing chapter."""
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return jsonify({"error": "Chapter not found"}), 404

        data = request.json
        chapter.name = data.get("name", chapter.name)
        chapter.subject_id = data.get("subject_id", chapter.subject_id)
        db.session.commit()
        redis_client.delete(f"chapter_{chapter_id}")
        redis_client.delete(f"subject_{chapter.subject_id}")
        redis_client.delete("chapters_list")
        redis_client.delete("subjects_list")  # Ensure fresh subject list
        return jsonify({"message": "Chapter updated successfully"})
    @limiter.limit("5 per minute")
    def delete(self, chapter_id):
        """Delete a chapter."""
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return jsonify({"error": "Chapter not found"}), 404
        db.session.delete(chapter)
        db.session.commit()
        redis_client.delete(f"chapter_{chapter_id}")
        redis_client.delete(f"subject_{chapter.subject_id}")
        redis_client.delete("chapters_list")
        redis_client.delete("subjects_list")  # Ensure fresh subject list
        return jsonify({"message": "Chapter deleted successfully"})

# Register ChapterResource
api.add_resource(ChapterResource, "/api/chapters", "/api/chapters/<int:chapter_id>")
# CRUD for Quizzes
class QuizResource(Resource):
    @limiter.limit("10 per minute")
    def get(self, quiz_id=None):
        """Retrieve all quizzes or a specific quiz with subject and chapter name."""
        cache_key = f"quiz_{quiz_id}" if quiz_id else "quizzes_list"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)
        if quiz_id:
            quiz = Quiz.query.get(quiz_id)
            if quiz:
                response={
                    "id": quiz.id,
                    "chapter_id": quiz.chapter_id,
                    "chapter_name": quiz.get_chapter_name(),
                    "subject_name": quiz.get_subject_name(),
                    "date_of_quiz": quiz.date_of_quiz.isoformat(),
                    "time_duration": quiz.time_duration,
                    "no_of_questions":quiz.num_questions(),
                    "remarks": quiz.remarks
                }
                cache_response(cache_key, response)
                return jsonify(response)
            return jsonify({"error": "Quiz not found"}), 404
        else:
            quizzes = Quiz.query.all()
            response=[
                {
                    "id": q.id,
                    "chapter_id": q.chapter_id,
                    "chapter_name": q.get_chapter_name(),
                    "subject_name": q.get_subject_name(),
                    "date_of_quiz": q.date_of_quiz.isoformat(),
                    "time_duration": q.time_duration,
                    "no_of_questions":q.num_questions(),
                    "remarks": q.remarks
                }
                for q in quizzes
            ]
        cache_response(cache_key, response)
        return jsonify(response)
    def post(self):
        """Create a new quiz."""
        data = request.json
        date_of_quiz = datetime.strptime(data["date_of_quiz"], "%Y-%m-%d").date()
        new_quiz = Quiz(
            chapter_id=data["chapter_id"],
            date_of_quiz=date_of_quiz,
            time_duration=data.get("time_duration"),
            remarks=data.get("remarks", "")
        )
        db.session.add(new_quiz)
        db.session.commit()
        redis_client.delete("quizzes_list")
        return {"message": "Quiz created successfully", 
                "id": new_quiz.id,
                "chapter_id": new_quiz.chapter_id,
                "date_of_quiz": new_quiz.date_of_quiz.isoformat(),
                "time_duration": new_quiz.time_duration,
                "remarks": new_quiz.remarks
                }, 201
    @limiter.limit("5 per minute")
    def put(self, quiz_id):
        """Edit an existing quiz."""
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        data = request.json
        quiz.chapter_id = data.get("chapter_id", quiz.chapter_id)
        quiz.date_of_quiz = data.get("date_of_quiz", quiz.date_of_quiz)
        quiz.date_of_quiz = datetime.strptime(quiz.date_of_quiz, "%Y-%m-%d").date()
        quiz.time_duration = data.get("time_duration", quiz.time_duration)
        quiz.remarks = data.get("remarks", quiz.remarks)
        db.session.commit()
            # Clear relevant cache entries
        redis_client.delete(f"quiz_{quiz_id}")
        redis_client.delete(f"chapter_quizzes_{quiz.chapter_id}")
        redis_client.delete("quizzes_list")
        return jsonify({"message": "Quiz updated successfully"})
    @limiter.limit("5 per minute")
    def delete(self, quiz_id):
        """Delete a quiz along with all its questions."""
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        # Delete all questions associated with the quiz
        questions = Questions.query.filter_by(quiz_id=quiz_id).all()
        for question in questions:
            db.session.delete(question)

        # Now delete the quiz itself
        db.session.delete(quiz)
        db.session.commit()

        # Clear relevant cache entries
        redis_client.delete(f"quiz_{quiz_id}")
        redis_client.delete(f"chapter_quizzes_{quiz.chapter_id}")
        redis_client.delete("quizzes_list")
        redis_client.delete(f"quiz_questions_{quiz_id}")  # Clear cache for quiz questions

        return jsonify({"message": "Quiz and its questions deleted successfully"})


# Register QuizResource
api.add_resource(QuizResource, "/api/quizzes", "/api/quizzes/<int:quiz_id>")

# CRUD for Qustions 
class QuestionResource(Resource):
    @limiter.limit("10 per minute")
    def get(self, question_id=None):
        """Retrieve all questions, a specific question, or questions by quiz_id."""
        quiz_id = request.args.get("quiz_id")  # Get quiz_id from query params
        cache_key = f"question_{question_id}" if question_id else f"quiz_questions_{quiz_id}" if quiz_id else "questions_list"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)
        if question_id:
            question = Questions.query.get(question_id)
            if question:
                response={
                    "id": question.id,
                    "quiz_id": question.quiz_id,
                    "question_title": question.question_title,
                    "question_statement": question.question_statement,
                    "option1": question.option1,
                    "option2": question.option2,
                    "option3": question.option3,
                    "option4": question.option4,
                    "correct_option": question.correct_option
                }
                cache_response(cache_key, response)
                return jsonify(response)
            return jsonify({"error": "Question not found"}), 404

        elif quiz_id:
            questions = Questions.query.filter_by(quiz_id=quiz_id).all()
            response=[
                {
                    "id": q.id,
                    "quiz_id": q.quiz_id,
                    "question_title": q.question_title,
                    "question_statement": q.question_statement,
                    "option1": q.option1,
                    "option2": q.option2,
                    "option3": q.option3,
                    "option4": q.option4,
                    "correct_option": q.correct_option
                }
                for q in questions
            ]
        
        else:
            questions = Questions.query.all()
            response=[
                {
                    "id": q.id,
                    "quiz_id": q.quiz_id,
                    "question_title": q.question_title,
                    "question_statement": q.question_statement,
                }
                for q in questions
            ]
        cache_response(cache_key, response)
        return jsonify(response)

    def post(self):
        """Create a new question."""
        data = request.json
        new_question = Questions(
            quiz_id=data["quiz_id"],
            question_title=data["question_title"],
            question_statement=data["question_statement"],
            option1=data["option1"],
            option2=data["option2"],
            option3=data["option3"],
            option4=data["option4"],
            correct_option=data["correct_option"]
        )
        db.session.add(new_question)
        db.session.commit()
        redis_client.delete("questions_list")
        redis_client.delete(f"quiz_questions_{data['quiz_id']}")
        return {"quiz_id": new_question.quiz_id,
                "question_title": new_question.question_title,
                "question_statment": new_question.question_statement,
                "option1":new_question.option1,
                "option2":new_question.option2,
                "option3":new_question.option3,
                "option4":new_question.option4,
                "correct_option":new_question.correct_option,}, 201
    @limiter.limit("5 per minute")
    def put(self, question_id):
        """Edit an existing question."""
        question = Questions.query.get(question_id)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        data = request.json
        question.question_title = data.get("question_title", question.question_title)
        question.question_statement = data.get("question_statement", question.question_statement)
        question.option1 = data.get("option1", question.option1)
        question.option2 = data.get("option2", question.option2)
        question.option3 = data.get("option3", question.option3)
        question.option4 = data.get("option4", question.option4)
        question.correct_option = data.get("correct_option", question.correct_option)
        db.session.commit()
        redis_client.delete(f"question_{question_id}")
        redis_client.delete(f"quiz_questions_{question.quiz_id}")
        redis_client.delete("questions_list")
        return jsonify({"message": "Question updated successfully"})
    @limiter.limit("5 per minute")
    def delete(self, question_id):
        """Delete a question."""
        question = Questions.query.get(question_id)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        db.session.delete(question)
        db.session.commit()
        redis_client.delete(f"question_{question_id}")
        redis_client.delete(f"quiz_questions_{question.quiz_id}")
        redis_client.delete("questions_list")
        redis_client.delete("quizzes_list")
        return jsonify({"message": "Question deleted successfully"})

# Register QuestionResource
api.add_resource(QuestionResource, "/api/questions", "/api/questions/<int:question_id>") # Assuming Scores is the SQLAlchemy model for storing scores

from sqlalchemy import desc


class ScoresResources(Resource):
    @limiter.limit("10 per minute")
    def get(self, user_id=None, quiz_id=None, latest=False):
        latest = request.path.startswith("/api/scores/latest")
        cache_key = f"scores_user_{user_id}_quiz_{quiz_id}_latest" if latest else \
                    f"scores_user_{user_id}_quiz_{quiz_id}" if user_id and quiz_id else \
                    f"scores_user_{user_id}" if user_id else "scores_list"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)
        try:
            query = Scores.query
            
            if user_id and not quiz_id and not latest:  # Fetch all scores of a user
                scores = query.filter(Scores.user_id == user_id).order_by(desc(Scores.time_stamp_of_attempt)).all()
                if not scores:
                    return []
                response= [
                    {
                        "quiz_id": score.quiz_id,
                        "noq": score.quiz.num_questions(),
                        "subject_name": score.quiz.chapter.subject.name,  # Fetch Subject Name
                        "chapter_name": score.quiz.chapter.name,
                        "user_id": score.user_id,
                        "full_name":score.user.full_name,
                        "total_scored": score.total_scored,
                        "timestamp": score.time_stamp_of_attempt.isoformat()
                    }
                    for score in scores
                ] if scores else ({"message": "No scores found"}, 404)

            if user_id and quiz_id:  # Fetch scores for a particular quiz
                query = query.filter(Scores.user_id == user_id, Scores.quiz_id == quiz_id)

            if latest:  # Fetch latest score
                score = query.order_by(desc(Scores.time_stamp_of_attempt)).first()
                response= {
                    "quiz_id": score.quiz_id,
                    "user_id": score.user_id,
                    "full_name":score.user.full_name,
                    "noq": score.quiz.num_questions(),
                    "subject_name": score.quiz.chapter.subject.name,  # Fetch Subject Name
                    "chapter_name": score.quiz.chapter.name,
                    "total_scored": score.total_scored,
                    "timestamp": score.time_stamp_of_attempt.isoformat()
                } if score else ({"message": "No scores found"}, 404)
            cache_response(cache_key, response)
            return jsonify(response)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def post(self):
        """
        Add a new quiz score when a user completes a quiz.
        Expected JSON payload
        {
            "quiz_id": <int>,
            "user_id": <int>,
            "total_scored": <float>
        }
        """
        try:
            data = request.get_json()
            
            if not all(k in data for k in ("quiz_id", "user_id", "total_scored")):
                return jsonify({"error": "Missing required fields"}), 400
            
            new_score = Scores(
                quiz_id=data["quiz_id"],
                user_id=data["user_id"],
                total_scored=data["total_scored"],
                time_stamp_of_attempt=datetime.utcnow()
            )
            
            db.session.add(new_score)
            db.session.commit()
            cache_keys_to_delete = [
            f"scores_user_{data['user_id']}",
            f"scores_user_{data['user_id']}_quiz_{data['quiz_id']}",
            f"scores_user_{data['user_id']}_quiz_{data['quiz_id']}_latest",
            "scores_list",
            f"user_summary_{data['user_id']}",
            "quiz_attempts_stats",
            "subject_attempts_stats"]
            for key in cache_keys_to_delete:
                redis_client.delete(key)
                return {"message": "Score recorded successfully"}, 201
        
        except Exception as e:
            return {"error": str(e)}, 500
api.add_resource(ScoresResources, 
    '/api/scores', 
    '/api/scores/<int:user_id>',  # New route for fetching scores by user_id
    '/api/scores/<int:quiz_id>/<int:user_id>', 
    '/api/scores/latest/<int:quiz_id>/<int:user_id>',
     '/api/scores/all_users')
class UserSummaryResource(Resource):
    @limiter.limit("10 per minute")
    def get(self, user_id):
        cache_key = f"user_summary_{user_id}"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)
        try:
            # Fetch all quiz scores for the given user
            scores = Scores.query.filter(Scores.user_id == user_id).order_by(desc(Scores.time_stamp_of_attempt)).all()
            
            if not scores:
                return jsonify({"message": "No scores found"}), 404

            quiz_summary = []
            subject_scores = {}
            trend_scores = {}
            processed_quizzes = {}  # ✅ Track quizzes to avoid duplicate entries

            for score in scores:
                quiz_id = score.quiz_id

                # ✅ Only process each quiz once
                if quiz_id not in processed_quizzes:
                    quiz_attempts = Scores.query.filter(Scores.user_id == user_id, Scores.quiz_id == quiz_id).all()
                    highest_score = max(s.total_scored for s in quiz_attempts)
                    average_score = round(sum(s.total_scored for s in quiz_attempts) / len(quiz_attempts), 2)

                    quiz_summary.append({
                        "quiz_id": quiz_id,
                        "user_id": score.user_id,
                        "full_name": score.user.full_name,
                        "subject_name": score.quiz.chapter.subject.name,
                        "chapter_name": score.quiz.chapter.name,
                        "total_attempts": len(quiz_attempts),
                        "highest_score": highest_score,
                        "average_score": average_score
                    })

                    processed_quizzes[quiz_id] = True  # ✅ Mark quiz as processed

                # ✅ Aggregate scores for subject-wise performance
                subject_name = score.quiz.chapter.subject.name
                if subject_name not in subject_scores:
                    subject_scores[subject_name] = []
                subject_scores[subject_name].append(score.total_scored)

                # ✅ Collect scores based on timestamp for performance trends
                week_label = f"Week{score.time_stamp_of_attempt.strftime('%U')}"
                if week_label not in trend_scores:
                    trend_scores[week_label] = []
                trend_scores[week_label].append(score.total_scored)

            # ✅ Compute average scores for subjects
            subject_chart_data = {subject: round(sum(scores) / len(scores), 2) for subject, scores in subject_scores.items()}

            # ✅ Compute average scores for trend data
            trend_chart_data = {week: round(sum(scores) / len(scores), 2) for week, scores in trend_scores.items()}

            response= {
                "quizSummary": quiz_summary,
                "subjectChartData": subject_chart_data,
                "trendChartData": trend_chart_data
            }
            cache_response(cache_key, response)
            return jsonify(response)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
class ExportUserSummaryResource(Resource):
    def post(self, user_id):
        """Trigger an asynchronous CSV export."""
        from app import export_user_summary
        cache_key = f"user_summary_{user_id}"
        redis_client.delete(cache_key)
        task = export_user_summary.apply_async(args=[user_id])
        return jsonify({"task_id": task.id, "message": "Export started!"})
    @limiter.limit("10 per minute")
    def get(self, user_id):
        """Download the exported CSV file."""
        file_path = f"exports/user_{user_id}_summary.csv"
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        return jsonify({"error": "File not found!"}), 404
# Add route to API
api.add_resource(UserSummaryResource, "/api/user-summary/<int:user_id>")
api.add_resource(ExportUserSummaryResource, "/api/user-summary/export/<int:user_id>")
class QuizStatsResource(Resource):
    @limiter.limit("10 per minute")
    def get(self):
        cache_key = "quiz_attempts_stats"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)
        try:
            quiz_attempts = (
                db.session.query(Scores.quiz_id, Chapter.name, db.func.count(Scores.quiz_id))
                .join(Quiz, Scores.quiz_id == Quiz.id)
                .join(Chapter, Quiz.chapter_id == Chapter.id)
                .group_by(Scores.quiz_id, Chapter.name)
                .order_by(db.func.count(Scores.quiz_id).desc())
                .all()
            )

            response= [
                {"quiz_name": f"{chapter_name}: Quiz {quiz_id}", "attempts": attempts}
                for quiz_id, chapter_name, attempts in quiz_attempts
            ]
            cache_response(cache_key, response)
            return jsonify(response)
        except Exception as e:
            return jsonify({"error": str(e)}), 500


api.add_resource(QuizStatsResource, '/api/stats/quiz-attempts')


class SubjectStatsResource(Resource):
    @limiter.limit("10 per minute")
    def get(self):
        cache_key = "subject_attempts_stats"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)
        try:
            subject_attempts = (
                db.session.query(Subject.name, db.func.count(Scores.quiz_id))
                .join(Chapter)
                .join(Quiz)
                .join(Scores)
                .group_by(Subject.name)
                .order_by(db.func.count(Scores.quiz_id).desc())
                .all()
            )

            response= [
                {"subject_name": subject_name, "attempts": attempts}
                for subject_name, attempts in subject_attempts
            ]
            cache_response(cache_key, response)
            return jsonify(response)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

api.add_resource(SubjectStatsResource, '/api/stats/subject-attempts')
class UserResource(Resource):
    @limiter.limit("10 per minute")
    def get(self):
        """Retrieve all users with their details, excluding the admin."""
        cache_key = "users_list"
        cached_data = get_cached_response(cache_key)
        if cached_data:
            return jsonify(cached_data)

        users = User.query.filter(User.id != 1, User.email != "admin@example.com").all()
        response = [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "qualification": user.qualification or "N/A"
            }
            for user in users
        ]

        cache_response(cache_key, response)
        return jsonify(response)

api.add_resource(UserResource, "/api/users")



