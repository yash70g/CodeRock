const express = require('express');
const router = express.Router();
const { EvaluateQuestion } = require('../Code/codeEvaluation');
const { SubmitAssignmentsSchema } = require('../db/schema');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { RunCpp, DeleteAfterExecution } = require('./Run');
const { compareTextFilesLineByLine } = require('./StreamComparison');

const getQuestionById = async (questionId) => {
    
};

router.post('/submit-question-score', async (req, res) => {
    const { AssignmentId, StudentId, QuestionId, UserCode } = req.body;
    try {
        const Question = await getQuestionById(QuestionId);
        const ws = { send: () => {}, close: () => {} };
        const result = await EvaluateQuestion(ws, Question, UserCode);

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

        res.json({
            success: true,
            ScoreObtained: result.ScoreObtained,
            TotalScore: result.TotalScore
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

async function evaluateAndCompareQuestion(Question, StudentCode, timeLimitSeconds = 5) {
    if (!Question || !Array.isArray(Question.TestCases)) {
        throw new Error('Invalid Question or TestCases');
    }

    const tempDir = path.join(__dirname, 'temp');
    try {
        fsSync.mkdirSync(tempDir, { recursive: true });
    } catch (e) {
        throw new Error(`Failed to create temp dir ${tempDir}: ${e.message}`);
    }

    const details = [];
    let TotalScore = 0;
    let ScoreObtained = 0;

    for (let i = 0; i < Question.TestCases.length; i++) {
        const tc = Question.TestCases[i];
        const input = String(tc.input || "");
        TotalScore += 1;

        let solResp;
        if (tc && typeof tc.output === 'string' && tc.output !== '') {
    
            solResp = { success: true, output: String(tc.output) };
        } else {

            solResp = await RunCpp(Question.SolutionCode || "", input, timeLimitSeconds);
        }

        const stuResp = await RunCpp(StudentCode || "", input, timeLimitSeconds);

        const safe = (s = "") => String(s).replace(/[^a-z0-9_\-]/gi, '_').slice(0, 40) || 'file';
        const uniq = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const base = `${safe(Question.QuestionName || 'q')}_tc${i}_${uniq}`;

        const solFile = path.join(tempDir, `sol_${base}.txt`);
        const stuFile = path.join(tempDir, `stu_${base}.txt`);

        const solContent = solResp.success ? (solResp.output || "") : (`ERROR: ${solResp.message || solResp.verdict || 'Unknown'}`);
        const stuContent = stuResp.success ? (stuResp.output || "") : (`ERROR: ${stuResp.message || stuResp.verdict || 'Unknown'}`);

        try {
            await Promise.all([
                fs.writeFile(solFile, solContent, 'utf8'),
                fs.writeFile(stuFile, stuContent, 'utf8')
            ]);
        } catch (writeErr) {
            try { DeleteAfterExecution(solFile, stuFile); } catch (_) {}
            details.push({
                testcaseIndex: i,
                input,
                solOutput: solResp.output || "",
                stuOutput: stuResp.output || "",
                solError: solResp.success ? null : (solResp.message || solResp.verdict),
                stuError: stuResp.success ? null : (stuResp.message || stuResp.verdict),
                different: true,
                success: false,
                compareError: `Failed to write temp files: ${writeErr.message}`
            });
            continue;
        }

        let cmp;
        try {
            cmp = await compareTextFilesLineByLine(solFile, stuFile);
        } catch (cmpErr) {

            try { DeleteAfterExecution(solFile, stuFile); } catch (_) {}
            details.push({
                testcaseIndex: i,
                input,
                solOutput: solResp.output || "",
                stuOutput: stuResp.output || "",
                solError: solResp.success ? null : (solResp.message || solResp.verdict),
                stuError: stuResp.success ? null : (stuResp.message || stuResp.verdict),
                different: true,
                success: false,
                compareError: cmpErr.message || String(cmpErr)
            });
            continue;
        }

        let different = true;
        let success = false;
        if (cmp && cmp.success === true) {
            different = !!cmp.different;
            success = !different && solResp.success;
        }

        if (success) ScoreObtained += 1;

        details.push({
            testcaseIndex: i,
            input,
            solOutput: solResp.output || "",
            stuOutput: stuResp.output || "",
            solError: solResp.success ? null : (solResp.message || solResp.verdict),
            stuError: stuResp.success ? null : (stuResp.message || stuResp.verdict),
            different,
            success,
            compareError: cmp && cmp.success === false ? cmp.error : null
        });
    }

    return {
        TotalScore,
        ScoreObtained,
        Details: details
    };
}

module.exports = { evaluateAndCompareQuestion };