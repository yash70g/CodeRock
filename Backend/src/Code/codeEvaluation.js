const { RunCpp } = require("./Run");

// Send minimal execution result to ws: only success, output or error, type and testcase
async function RunCode(ws, Code, TestCase, Type, RunOn) {
    try {
        let CodeResponse = await RunCpp(Code, TestCase, 5);

        // Only send minimal output/error to websocket for student runs
        if (Type === "Student" && ws && typeof ws.send === 'function') {
            ws.send(JSON.stringify({
                success: !!CodeResponse.success,
                output: CodeResponse.success ? (CodeResponse.output || "") : "",
                error: CodeResponse.success ? "" : (CodeResponse.message || CodeResponse.verdict || "Execution Error"),
                testcase: RunOn,
                type: "output"
            }));
        }

        return CodeResponse;
    } catch (err) {
        if (ws && typeof ws.send === 'function') {
            ws.send(JSON.stringify({
                success: false,
                output: "",
                error: `Internal Server Error while running ${Type} Code [${RunOn}] : ${err.message}`,
                testcase: RunOn,
                type: "output"
            }));
            try { ws.close(1011); } catch (_) {}
        }
        return { success: false, message: err.message, verdict: "Internal Error" };
    }
}

// Compare outputs as strings (no files)
async function CompareOutputs(ws, solutionCodeResponse, studentCodeResponse, RunOn) {
    try {
        if (solutionCodeResponse.output === undefined || studentCodeResponse.output === undefined) {
            return { success: false, error: `Missing output for comparison in ${RunOn}` };
        }

        const normalize = str => (str || "").replace(/\r\n/g, "\n").trim();
        const solOut = normalize(solutionCodeResponse.output);
        const stuOut = normalize(studentCodeResponse.output);

        return { success: true, different: (solOut !== stuOut) };
    } catch (e) {
        return { success: false, error: `Internal Server Error while comparing outputs of ${RunOn}: ${e.message}` };
    }
}

// RunAndCompare returns boolean (true if passed), does not emit websocket verdicts itself
async function RunAndCompare(ws, SolutionCode, StudentCode, TestCase, RunOn, QuestionPlaceHolder = "") {
    let solutionCodeResponse = await RunCode(ws, SolutionCode, TestCase, "Solution", RunOn);
    if (solutionCodeResponse === undefined) return undefined;
    let studentCodeResponse = await RunCode(ws, StudentCode, TestCase, "Student", RunOn);
    if (studentCodeResponse === undefined) return undefined;

    if (solutionCodeResponse.success === false) {
        // cannot compare if solution failed
        return { ok: false, reason: 'solution_failed', message: solutionCodeResponse.message || solutionCodeResponse.verdict };
    }

    if (studentCodeResponse.success === false) {
        // student had runtime/compile/tle; treat as failed
        return { ok: false, reason: 'student_error', message: studentCodeResponse.message || studentCodeResponse.verdict };
    }

    let Comparison = await CompareOutputs(ws, solutionCodeResponse, studentCodeResponse, RunOn);
    if (Comparison === undefined || Comparison.success === false) {
        return { ok: false, reason: 'compare_error', message: Comparison && Comparison.error ? Comparison.error : 'compare failed' };
    }

    if (Comparison.different === true) {
        return { ok: false, reason: 'wrong_answer' };
    } else {
        return { ok: true };
    }
}

// Evaluate question using Judge0 for all testcases
// Emits only a final Decision message (TotalScore, ScoreObtained) after evaluating all testcases
async function EvaluateQuestion(ws, Question, CodeToRun) {
    // optional prelim message (can be removed if not desired)
    if (ws && typeof ws.send === 'function') {
        ws.send(JSON.stringify({
            success: true,
            message: `Evaluation started for ${Question.QuestionName}`,
            type: `output`
        }));
    }

    let PassedAllTestCases = true;
    let TotalScore = 0;
    let ScoreObtained = 0;

    for (let i = 0; i < Question.TestCases.length; i++) {
        const runOn = `Testcase ${i + 1}`;
        let res = await RunAndCompare(ws, Question.SolutionCode, CodeToRun, Question.TestCases[i].input, runOn, Question.QuestionName);
        if (res === undefined) {
            // internal error - abort evaluation
            if (ws && typeof ws.send === 'function') {
                ws.send(JSON.stringify({
                    success: false,
                    message: `Internal error while evaluating ${runOn}`,
                    type: `output`
                }));
            }
            return;
        }

        TotalScore += 1;
        if (res.ok === true) {
            ScoreObtained += 1;
        } else {
            PassedAllTestCases = false;
            // continue evaluating remaining tests but do not emit detailed verdicts here
        }
    }

    // Final decision message with totals
    if (ws && typeof ws.send === 'function') {
        ws.send(JSON.stringify({
            success: true,
            message: PassedAllTestCases ? 'All Testcases Passed' : 'Some Testcases Failed',
            verdict: PassedAllTestCases ? 'Accepted' : 'Wrong Answer',
            type: 'Decision',
            TotalScore,
            ScoreObtained,
            Question: Question.QuestionName
        }));
    }

    return {
        TotalScore,
        ScoreObtained
    };
}

module.exports = { RunAndCompare, RunCode, CompareOutputs, EvaluateQuestion };