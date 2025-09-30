const express = require('express');
const router = express.Router();
const { EvaluateQuestion } = require('../Code/codeEvaluation');
const { SubmitAssignmentsSchema } = require('../db/schema');
const mongoose = require('mongoose');

// Assume you have a function to get question details by ID
const getQuestionById = async (questionId) => {
    // ...fetch question from DB...
};

router.post('/submit-question-score', async (req, res) => {
    const { AssignmentId, StudentId, QuestionId, UserCode } = req.body;
    try {
        const Question = await getQuestionById(QuestionId);
        const ws = { send: () => {}, close: () => {} };
        const result = await EvaluateQuestion(ws, Question, UserCode);

        // Save submission in DB
        const submission = {
            AssignmentId: mongoose.Types.ObjectId(AssignmentId),
            StudentId: mongoose.Types.ObjectId(StudentId),
            Submission: [{
                SubmittedCode: UserCode,
                QuestionId: mongoose.Types.ObjectId(QuestionId),
                ScoreObtained: result.ScoreObtained,
                TotalScore: result.TotalScore
            }],
            SubmittedOn: new Date(),
            ScoreObtained: result.ScoreObtained,
            TotalScore: result.TotalScore
        };

        // Save using your DB logic
        // e.g., await SubmitAssignmentsModel.create(submission);

        res.json({
            success: true,
            ScoreObtained: result.ScoreObtained,
            TotalScore: result.TotalScore
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

module.exports = router;