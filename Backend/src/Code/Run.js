const axios = require('axios');
const fs = require('fs'); // keep for DeleteAfterExecution compatibility
const path = require('path');

function DeleteAfterExecution(...filePaths) {
    filePaths.forEach(filePath => {
        fs.unlink(filePath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log(`File ${filePath} does not exist`);
                } else {
                    console.log(`Error occurred while deleting the ${filePath} file, err : ${err}`);
                }
            } else {
                console.log(`Successfully deleted the ${filePath} file`);
            }
        });
    });
}

const RAW_JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com/submissions';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;
const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com';

function ensureJudge0Url(url) {
    // Ensure wait=true and base64_encoded=true in URL query
    try {
        const u = new URL(url);
        u.searchParams.set('wait', 'true');
        u.searchParams.set('base64_encoded', 'true');
        return u.toString();
    } catch (e) {
        let out = url;
        if (!/wait=/.test(out)) out += (out.includes('?') ? '&' : '?') + 'wait=true';
        if (/base64_encoded=/.test(out)) {
            out = out.replace(/base64_encoded=[^&]*/, 'base64_encoded=true');
        } else {
            out += '&base64_encoded=true';
        }
        return out;
    }
}

function b64EncodeSafe(s = '') {
    return Buffer.from(String(s), 'utf8').toString('base64');
}

function b64DecodeSafe(s = '') {
    try {
        return Buffer.from(String(s), 'base64').toString('utf8');
    } catch (e) {
        return String(s || '');
    }
}

const JUDGE0_URL = ensureJudge0Url(RAW_JUDGE0_URL);

async function RunCpp(code, input = "", TimeLimit = 5) {
    try {
        // Judge0 expects base64-encoded fields when base64_encoded=true
        const payload = {
            source_code: b64EncodeSafe(code || ""),
            stdin: b64EncodeSafe(input || ""),
            language_id: 52, // C++ (GCC). adjust if needed
            cpu_time_limit: TimeLimit
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        if (RAPIDAPI_KEY) {
            headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
            headers['X-RapidAPI-Host'] = JUDGE0_HOST;
        }

        const axiosConfig = {
            headers,
            timeout: (TimeLimit + 10) * 1000 // buffer
        };

        const resp = await axios.post(JUDGE0_URL, payload, axiosConfig);
        const result = resp.data || {};

        // When base64_encoded=true Judge0 returns base64 strings for stdout/stderr/compile_output
        const statusId = result && result.status && result.status.id;
        const rawStdout = result.stdout || "";
        const rawStderr = result.stderr || "";
        const rawCompile = result.compile_output || "";

        const stdout = rawStdout ? b64DecodeSafe(rawStdout) : "";
        const stderr = rawStderr ? b64DecodeSafe(rawStderr) : "";
        const compile_output = rawCompile ? b64DecodeSafe(rawCompile) : "";

        if (statusId === 3) { // Accepted / successful run
            return {
                success: true,
                output: String(stdout),
                verdict: "Run Successful"
            };
        }

        if (statusId === 5) { // Time Limit Exceeded
            return {
                success: false,
                message: "Time Limit Exceeded",
                verdict: "Time Limit Exceeded"
            };
        }

        if (statusId === 6) { // Compilation Error
            return {
                success: false,
                message: String(compile_output || "Compilation Error"),
                verdict: "Compilation Error"
            };
        }

        if (statusId === 4) { // Runtime Error
            return {
                success: false,
                message: String(stderr || "Runtime Error"),
                verdict: "Runtime Error"
            };
        }

        return {
            success: false,
            message: result.status ? result.status.description : "Unknown Error",
            verdict: result.status ? result.status.description : "Unknown Error"
        };
    } catch (err) {
        const msg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
        return {
            success: false,
            message: `Judge0 Error: ${msg}`,
            verdict: "Internal Error"
        };
    }
}

module.exports = { RunCpp, DeleteAfterExecution };
