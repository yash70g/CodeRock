const { RunCpp } = require("./Run");
const { compareTextFilesLineByLine } = require("./StreamComparison");
const fs = require("fs");
const os = require("os");
const path = require("path");

async function RunCode(ws, Code, TestCase, Type, RunOn) {
    try {
        let CodeResponse = await RunCpp(Code, TestCase, 5);

        if (Type === "Student" && ws && typeof ws.send === "function") {
            ws.send(
                JSON.stringify({
                    success: !!CodeResponse.success,
                    output: CodeResponse.success ? CodeResponse.output || "" : "",
                    error: CodeResponse.success ? "" : CodeResponse.message || CodeResponse.verdict || "Execution Error",
                    testcase: RunOn,
                    type: "output",
                })
            );
        }

        return CodeResponse;
    } catch (err) {
        if (ws && typeof ws.send === "function") {
            ws.send(
                JSON.stringify({
                    success: false,
                    output: "",
                    error: `Internal Server Error while running ${Type} Code [${RunOn}] : ${err.message}`,
                    testcase: RunOn,
                    type: "output",
                })
            );
            try {
                ws.close(1011);
            } catch (_) {}
        }
        return { success: false, message: err.message, verdict: "Internal Error" };
    }
}

async function CompareOutputs(ws, solutionCodeResponse, studentCodeResponse, RunOn) {
    try {
        if (solutionCodeResponse.output === undefined || studentCodeResponse.output === undefined) {
            return { success: false, error: `Missing output for comparison in ${RunOn}` };
        }

        const normalize = (str) => (str || "").replace(/\r\n/g, "\n").trim();
        const solOut = normalize(solutionCodeResponse.output);
        const stuOut = normalize(studentCodeResponse.output);

        return { success: true, different: solOut !== stuOut };
    } catch (e) {
        return { success: false, error: `Internal Server Error while comparing outputs of ${RunOn}: ${e.message}` };
    }
}
async function RunAndCompare(ws, SolutionCode, StudentCode, TestCaseObj, RunOn, QuestionPlaceHolder = "") {


    let solutionCodeResponse;
    if (TestCaseObj && typeof TestCaseObj.output === 'string' && TestCaseObj.output !== '') {
        // Use stored testcase output as the expected output
        solutionCodeResponse = { success: true, output: String(TestCaseObj.output) };
    } else {
        // Fallback: run solution code to generate expected output (backwards compatibility)
        solutionCodeResponse = await RunCode(ws, SolutionCode, TestCaseObj && TestCaseObj.input ? TestCaseObj.input : TestCaseObj, "Solution", RunOn);
    }

    if (solutionCodeResponse === undefined) return undefined;

    let studentCodeResponse = await RunCode(ws, StudentCode, TestCaseObj && TestCaseObj.input ? TestCaseObj.input : TestCaseObj, "Student", RunOn);
    if (studentCodeResponse === undefined) return undefined;


    const indexMatch = String(RunOn || '').match(/\d+/);
    const testcaseIndexNum = indexMatch ? parseInt(indexMatch[0], 10) : null;

    const resDetails = {
        testcaseIndex: testcaseIndexNum,
        testcaseLabel: RunOn,
        input: TestCaseObj && TestCaseObj.input ? String(TestCaseObj.input) : "",
        solOutput: solutionCodeResponse.success ? String(solutionCodeResponse.output || "") : null,
        stuOutput: studentCodeResponse.success ? String(studentCodeResponse.output || "") : null,
        solError: solutionCodeResponse.success ? null : (solutionCodeResponse.message || solutionCodeResponse.verdict || null),
        stuError: studentCodeResponse.success ? null : (studentCodeResponse.message || studentCodeResponse.verdict || null),
        different: null,
        success: false,
        compareError: null,
        reason: null
    };

    if (solutionCodeResponse.success === false) {
        resDetails.success = false;
        resDetails.reason = "solution_failed";
        return { ok: false, ...resDetails };
    }

    if (studentCodeResponse.success === false) {
        resDetails.success = false;
        resDetails.reason = "student_error";
        return { ok: false, ...resDetails };
    }

    try {
        const sanitize = (s = "") => String(s).replace(/[^a-z0-9_\-]/gi, "_").slice(0, 40) || "q";
        const baseName = sanitize(QuestionPlaceHolder) + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

        const tempDir = path.join(__dirname, "temp");
        try {
            fs.mkdirSync(tempDir, { recursive: true });
        } catch (e) {
            console.warn(`Could not create temp dir ${tempDir}, falling back to os.tmpdir(): ${e.message}`);
        }

        const solFile = path.join(tempDir, `sol_${baseName}.txt`);
        const stuFile = path.join(tempDir, `stu_${baseName}.txt`);

        await fs.promises.writeFile(solFile, solutionCodeResponse.output || "", "utf8");
        await fs.promises.writeFile(stuFile, studentCodeResponse.output || "", "utf8");
        const cmp = await compareTextFilesLineByLine(solFile, stuFile);

        if (!cmp || cmp.success === false) {
            resDetails.success = false;
            resDetails.reason = "compare_error";
            resDetails.compareError = cmp && cmp.error ? cmp.error : "Comparison failed";
            return { ok: false, ...resDetails };
        }

        resDetails.different = !!cmp.different;
        resDetails.success = !cmp.different && solutionCodeResponse.success;

        if (cmp.different === true) {
            resDetails.reason = "wrong_answer";
            return { ok: false, ...resDetails };
        } else {
            return { ok: true, ...resDetails };
        }
    } catch (e) {
        return { ok: false, reason: "compare_exception", message: e.message || String(e) };
    }
}

async function EvaluateQuestion(ws, Question, CodeToRun) {
    if (ws && typeof ws.send === "function") {
        ws.send(
            JSON.stringify({
                success: true,
                message: `Evaluation started for ${Question.QuestionName}`,
                type: `output`,
            })
        );
    }

    let PassedAllTestCases = true;
    let TotalScore = 0;
    let ScoreObtained = 0;
    let Details = [];

    for (let i = 0; i < Question.TestCases.length; i++) {
        const runOn = `Testcase ${i + 1}`;
        let res = await RunAndCompare(ws, Question.SolutionCode, CodeToRun, Question.TestCases[i], runOn, Question.QuestionName);
        if (res === undefined) {
            if (ws && typeof ws.send === "function") {
                ws.send(JSON.stringify({ success: false, message: `Internal error while evaluating ${runOn}`, type: `output` }));
            }
            return;
        }

        // collect per-testcase result
        Details.push(res);

        TotalScore += 1;
        if (res.ok === true) {
            ScoreObtained += 1;
        } else {
            PassedAllTestCases = false;
            // continue evaluating remaining tests
        }
    }

    if (ws && typeof ws.send === "function") {
        ws.send(
            JSON.stringify({
                success: true,
                message: PassedAllTestCases ? "All Testcases Passed" : "Some Testcases Failed",
                verdict: PassedAllTestCases ? "Accepted" : "Wrong Answer",
                type: "Decision",
                TotalScore,
                ScoreObtained,
                Question: Question.QuestionName,
                Details
            })
        );
    }

    return {
        TotalScore,
        ScoreObtained,
        Details
    };
}

module.exports = { RunAndCompare, RunCode, CompareOutputs, EvaluateQuestion };