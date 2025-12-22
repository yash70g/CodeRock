# POST /professors/generateTestcaseOutputs

Generate and save missing testcase outputs using the question's solution code. Useful for backfilling older questions that don't have testcase outputs stored.

Request
- Method: POST
- URL: /professors/generateTestcaseOutputs
- Auth: Professor (JWT cookie required)
- Body: { _id: "<questionId>" }

Response
- 200 { success: true, message: "Testcase outputs generated and saved", Question: <updatedQuestionObject> }
- 400 if question id missing or question has no testcases
- 404 if question not found
- 500 on server error

Notes
- The route runs the `SolutionCode` on each testcase input if the testcase `output` is empty.
- If execution fails for a testcase, the route stores a marker in the output: `__ERROR__:<message>` so the professor can inspect and fix the solution code or the testcase.
- Only the professor who created the question can call this route (protected using `checkIfQuestionIsCreatedByThisProfessor`).