from flask_restful import Resource, Api, reqparse
from models import db, Subject, Chapter, Quiz, Questions
from flask_security import auth_required, roles_required
from flask import request, jsonify
from datetime import datetime

api = Api()
# CRUD for Subjects
class SubjectResource(Resource):
    def get(self, subject_id=None):
        """Retrieve all subjects or a specific subject with chapters."""
        if subject_id:
            subject = Subject.query.get(subject_id)
            if subject:
                return jsonify({
                    "id": subject.id,
                    "name": subject.name,
                    "description": subject.description,
                    "chapters": [
                        {"id": ch.id, "name": ch.name, "description": ch.description}
                        for ch in subject.chapters
                    ]
                })
            return jsonify({"error": "Subject not found"}), 404
        else:
            subjects = Subject.query.all()
            return jsonify([
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
            ])
    def post(self):
        """Create a new subject."""
        data = request.json
        new_subject = Subject(name=data["name"], description=data.get("description", ""))
        db.session.add(new_subject)
        db.session.commit()
        return {
            "message": "Subject created successfully",
            "subject": {
                "id": new_subject.id,
                "name": new_subject.name,
                "description": new_subject.description
            }
        }, 201
    def put(self, subject_id):
        """Edit an existing subject."""
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404

        data = request.json
        subject.name = data.get("name", subject.name)
        subject.description = data.get("description", subject.description)
        db.session.commit()
        return jsonify({"message": "Subject updated successfully"})

    def delete(self, subject_id):
        """Delete a subject."""
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404

        db.session.delete(subject)
        db.session.commit()
        return jsonify({"message": "Subject deleted successfully"})

# Register Resources
api.add_resource(SubjectResource, "/api/subjects", "/api/subjects/<int:subject_id>")
# CRUD for Chapters
class ChapterResource(Resource):
    def get(self, chapter_id=None):
        """Retrieve all chapters or a specific chapter."""
        if chapter_id:
            chapter = Chapter.query.get(chapter_id)
            if chapter:
                return jsonify({
                    "id": chapter.id,
                    "name": chapter.name,
                    "subject_id": chapter.subject_id
                })
            return jsonify({"error": "Chapter not found"}), 404
        else:
            chapters = Chapter.query.all()
            return jsonify([
                {"id": c.id, "name": c.name, "subject_id": c.subject_id} for c in chapters
            ])
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

        return {
            "message": "Chapter created successfully",
            "id": new_chapter.id,
            "name": new_chapter.name,
            "description": new_chapter.description
        }, 201

    def put(self, chapter_id):
        """Edit an existing chapter."""
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return jsonify({"error": "Chapter not found"}), 404

        data = request.json
        chapter.name = data.get("name", chapter.name)
        chapter.subject_id = data.get("subject_id", chapter.subject_id)
        db.session.commit()
        return jsonify({"message": "Chapter updated successfully"})
    def delete(self, chapter_id):
        """Delete a chapter."""
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return jsonify({"error": "Chapter not found"}), 404

        db.session.delete(chapter)
        db.session.commit()
        return jsonify({"message": "Chapter deleted successfully"})

# Register ChapterResource
api.add_resource(ChapterResource, "/api/chapters", "/api/chapters/<int:chapter_id>")
# CRUD for Quizzes
class QuizResource(Resource):
    def get(self, quiz_id=None):
        """Retrieve all quizzes or a specific quiz with subject and chapter name."""
        if quiz_id:
            quiz = Quiz.query.get(quiz_id)
            if quiz:
                return jsonify({
                    "id": quiz.id,
                    "chapter_id": quiz.chapter_id,
                    "chapter_name": quiz.get_chapter_name(),
                    "subject_name": quiz.get_subject_name(),
                    "date_of_quiz": quiz.date_of_quiz.isoformat(),
                    "time_duration": quiz.time_duration,
                    "remarks": quiz.remarks
                })
            return jsonify({"error": "Quiz not found"}), 404
        else:
            quizzes = Quiz.query.all()
            return jsonify([
                {
                    "id": q.id,
                    "chapter_id": q.chapter_id,
                    "chapter_name": q.get_chapter_name(),
                    "subject_name": q.get_subject_name(),
                    "date_of_quiz": q.date_of_quiz.isoformat(),
                    "time_duration": q.time_duration,
                    "remarks": q.remarks
                }
                for q in quizzes
            ])
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
        return {"message": "Quiz created successfully", 
                "id": new_quiz.id,
                "chapter_id": new_quiz.chapter_id,
                "date_of_quiz": new_quiz.date_of_quiz.isoformat(),
                "time_duration": new_quiz.time_duration,
                "remarks": new_quiz.remarks
                }, 201
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
        return jsonify({"message": "Quiz updated successfully"})
    def delete(self, quiz_id):
        """Delete a quiz."""
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        db.session.delete(quiz)
        db.session.commit()
        return jsonify({"message": "Quiz deleted successfully"})

# Register QuizResource
api.add_resource(QuizResource, "/api/quizzes", "/api/quizzes/<int:quiz_id>")

# CRUD for Qustions 
class QuestionResource(Resource):
    def get(self, question_id=None):
        """Retrieve all questions, a specific question, or questions by quiz_id."""
        quiz_id = request.args.get("quiz_id")  # Get quiz_id from query params

        if question_id:
            question = Questions.query.get(question_id)
            if question:
                return jsonify({
                    "id": question.id,
                    "quiz_id": question.quiz_id,
                    "question_title": question.question_title,
                    "question_statement": question.question_statement,
                    "option1": question.option1,
                    "option2": question.option2,
                    "option3": question.option3,
                    "option4": question.option4,
                    "correct_option": question.correct_option
                })
            return jsonify({"error": "Question not found"}), 404

        elif quiz_id:
            questions = Questions.query.filter_by(quiz_id=quiz_id).all()
            return jsonify([
                {
                    "id": q.id,
                    "question_title": q.question_title,
                    "question_statement": q.question_statement,
                }
                for q in questions
            ])
        
        else:
            questions = Questions.query.all()
            return jsonify([
                {
                    "id": q.id,
                    "quiz_id": q.quiz_id,
                    "question_title": q.question_title,
                    "question_statement": q.question_statement,
                }
                for q in questions
            ])

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
        return {"quiz_id": new_question.quiz_id,
                "question_title": new_question.question_title,
                "question_statment": new_question.question_statement,
                "option1":new_question.option1,
                "option2":new_question.option2,
                "option3":new_question.option3,
                "option4":new_question.option4,
                "correct_option":new_question.correct_option,}, 201
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
        return jsonify({"message": "Question updated successfully"})
    def delete(self, question_id):
        """Delete a question."""
        question = Questions.query.get(question_id)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        db.session.delete(question)
        db.session.commit()
        return jsonify({"message": "Question deleted successfully"})

# Register QuestionResource
api.add_resource(QuestionResource, "/api/questions", "/api/questions/<int:question_id>")



