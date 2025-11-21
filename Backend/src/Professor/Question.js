const path = require('path');
const { RunCpp, DeleteAfterExecution } = require("../Code/Run")
const fs = require('fs');
const { writeDB, readDB, checkIfExists, deleteDB, updateDB } = require('../db/mongoOperations');
const { QuestionSchema, assignmentSchema } = require('../db/schema');
const { GetProfessor } = require('../other/Common');

async function ValidateSolutionCode(ws, req) {

    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type !== "Validation") {
                ws.send(JSON.stringify({
                    success: false,
                    message: "Invalid Type",
                }), () => {
                    ws.close(1008);
                });
                return;
            }

            ws.send(JSON.stringify({ success: true, message: "Running the code...", verdict: "Processing.." }));

            let response = await RunCpp(data.SolutionCodeToTest || "", data.validationTestCaseValue || "", 5);

            if (!response || response.success === false) {
                ws.send(JSON.stringify({
                    success: false,
                    message: response ? (response.message || response.verdict) : "Execution failed",
                    verdict: response ? response.verdict : "Error",
                    output: response ? (response.output || "") : ""
                }), () => {
                    ws.close(1008);
                });
                return;
            }

            // compare returned output with expectedOutputValue (normalize newlines)
            const runOutput = String(response.output || "").replace(/\r\n/g, "\n").trim();
            const expected = String(data.expectedOutputValue || "").replace(/\r\n/g, "\n").trim();

            if (runOutput === expected) {
                ws.send(JSON.stringify({
                    success: true,
                    message: "Output matched with expected output",
                    verdict: "Accepted",
                    output: runOutput
                }), () => {
                    ws.close(1000);
                });
            } else {
                ws.send(JSON.stringify({
                    success: true,
                    message: "Output did not match with expected output",
                    verdict: "Wrong Answer",
                    output: runOutput
                }), () => {
                    ws.close(1000);
                });
            }

        } catch (e) {
            ws.send(JSON.stringify({
                success: false,
                message: "Invalid JSON format recieved from client",
            }), () => {
                ws.close(1008);
            });
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
    });
}

async function ValidateRandomTestCaseCode(ws, req) {

    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type !== "RunRandomTestCaseCode") {
                ws.send(JSON.stringify({
                    success: false,
                    message: "Invalid Type",
                }), () => {
                    ws.close(1008);
                });
                return;
            }

            ws.send(JSON.stringify({ success: true, message: "Running the code...", verdict: "Processing.." }));

            let response = await RunCpp(data.RandomTestCaseCode || "", "", 5);

            // if the code is not executed successfully, send the error message and close
            if (!response || response.success === false) {
                ws.send(JSON.stringify({
                    success: false,
                    message: response ? (response.message || response.verdict) : "Execution failed",
                    verdict: response ? response.verdict : "Error",
                    output: response ? (response.output || "") : ""
                }), () => {
                    ws.close(1008);
                });
                return;
            }

            try {
                // ensure public TemporaryCodeBase exists
                const publicTempDir = path.join(__dirname, "..", "..", "public", "TemporaryCodeBase");
                if (!fs.existsSync(publicTempDir)) {
                    fs.mkdirSync(publicTempDir, { recursive: true });
                }

                // create safe unique filename and write output text
                const safeName = `random_out_${Date.now()}_${Math.random().toString(36).slice(2,8)}.txt`;
                const copyFilePath = path.join(publicTempDir, safeName);

                // write the stdout to the public file
                await fs.promises.writeFile(copyFilePath, String(response.output || ""), 'utf8');

                const outputLink = `${process.env.BackendHost.replace(/\/$/, '')}/TemporaryCodeBase/${safeName}`;

                ws.send(JSON.stringify({
                    success: true,
                    message: "Output Link will expire in 5 minutes",
                    verdict: outputLink,
                    output: response.output || ""
                }), () => {
                    ws.close(1000);

                    // schedule deletion after 5 minutes
                    setTimeout(() => {
                        try {
                            DeleteAfterExecution(copyFilePath);
                        } catch (e) {
                            console.error(`Failed to delete temp public file ${copyFilePath}`, e);
                        }
                    }, 300000);
                });

            } catch (e) {
                ws.send(JSON.stringify({
                    success: false,
                    message: `Error occurred while preparing output link: ${e.message}`,
                    verdict: "Internal Server Error"
                }), () => {
                    ws.close(1008);
                });
            }

        } catch (e) {
            ws.send(JSON.stringify({
                success: false,
                message: "Invalid JSON format recieved from client",
            }), () => {
                ws.close(1008);
            });
        }
    });
}

function createQuestionRoute(req, res) {
    console.log(req.body);
    req.body.CreatedBy = req.decoded._id;
    req.body.CreatedOn = new Date();
    writeDB("QuestionBank", req.decoded.Institution, req.body, QuestionSchema).then((data) => {
        res.status(201).send({
            success: true,
            message: "Question Created Successfully"
        });
    }).catch((error) => {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Create Question, error: ${error.message}`
        });
    });
}

async function FetchFullQuestionDetailsRoute(req, res) {
    try {
        console.log(req.params._id);

        // Fetch the question details from the database
        const Querry = {
            _id: req.params._id // This is the Question ID
        };

        const Projection = {
            _id: 0,
            __v: 0
        };

        const data = await readDB("QuestionBank", req.decoded.Institution, Querry, QuestionSchema, Projection);

        if (data.length === 0) {
            res.status(404).send({
                success: false,
                message: "Question not found"
            });
        } else {
            // Fetch additional details about the creator
            data[0].CreatedBy = await GetProfessor(data[0].CreatedBy, req.decoded.Institution);

            res.status(200).send({
                success: true,
                message: "Full Question Details Fetched Successfully",
                Question: data[0]
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Fetch Question Details, error: ${error.message}`
        });
    }
}

async function checkIfQuestionExists(req, res, next) {

    let Query = {
        _id: req.params._id, // This is the Question ID
        CreatedBy: req.decoded._id
    };

    try {
        let exists = await checkIfExists("QuestionBank", req.decoded.Institution, Query, QuestionSchema);
        if (exists) {
            next();
        } else {
            res.send({
                success: false,
                message: "Question not found"
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Check if Question Exists, error: ${error.message}`
        });
    }
}

async function CheckIfAddedInAnyAssignment(req, res, next) {
    // Check if the question is added in any assignment
    //check if id exists in Questions array of any assignment in the Assignments collection
    let Query = {
        Questions: {
            $in: [req.params._id]
        }
    };

    //only return AssignmentName
    let Projection = {
        AssignmentName: 1
    };

    try {
        let response = await readDB("Assignments", req.decoded.Institution, Query, assignmentSchema, Projection);
        if (response.length > 0) {
            res.send({
                success: false,
                message: `Question is added in the following assignments, please remove it from the assignments first`,
                assignments: response
            });
        } else {
            console.log("Question is not added in any assignment");
            next();
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Check if Question is already added in any Assignment, error: ${error.message}`
        });
    }
}

async function deleteQuestionRoute(req, res) {

    let Query = {
        _id: req.params._id // This is the Question ID
    };

    try {
        let response = await deleteDB("QuestionBank", req.decoded.Institution, Query, QuestionSchema);
        console.log(response);
        res.send({
            success: true,
            message: "Question Deleted Successfully"
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Delete Question with id ${req.params._id}, error: ${error.message}`
        });
    }
}

async function checkIfQuestionIsCreatedByThisProfessor(req, res, next) {
    let Query = {
        _id: req.body._id, // This is the Question ID
        CreatedBy: req.decoded._id
    };
    try {
        let exists = await checkIfExists("QuestionBank", req.decoded.Institution, Query, QuestionSchema);
        if (exists) {
            next();
        } else {
            res.send({
                success: false,
                message: "Either The Question Doesn't exists, or you are not allowed to edit it."
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Check if Question Exists, error: ${error.message}`
        });
    }
}

async function updateQuestionRoute(req, res) {
    console.log(req.body);
    let Query = {
        _id: req.body._id // This is the Question ID
    };
    try {
        req.body.CreatedBy = req.decoded._id;
        req.body.CreatedOn = new Date();
        console.log(req.body);
        const response = await updateDB("QuestionBank", req.decoded.Institution, Query, req.body, QuestionSchema);
        console.log(response);
        res.send({
            success: true,
            message: "Question Updated Successfully"
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Failed to Update Question with id ${req.body._id}, error: ${error.message}`
        });
    }

}

module.exports = { ValidateSolutionCode, ValidateRandomTestCaseCode, createQuestionRoute, updateQuestionRoute, checkIfQuestionIsCreatedByThisProfessor, FetchFullQuestionDetailsRoute, checkIfQuestionExists, CheckIfAddedInAnyAssignment, deleteQuestionRoute };