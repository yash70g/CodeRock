import { useState, useEffect } from "react";
import TestCase from "../TestCase";
import axios from "axios";
import { toast } from "react-toastify";

function TestcasesTab({ TestCases, handleInputChange, formData, FormMetaData, editQuestion = false, _id }) {

    const [testcases, setTestcases] = useState(TestCases || []);

    useEffect(() => {
        setTestcases(TestCases); // Update the testcases when the TestCases prop changes from the parent
    }, [TestCases]);

    //function that adds a new testcase
    const addTestcase = () => {
        const newTestcases = [...testcases, { input: "", output: "", sampleTestCase: false }];
        setTestcases(newTestcases);
        handleInputChange("TestCases", newTestcases);
    };

    //function that removes the last testcase
    const removeTestcase = () => {
        if (testcases.length === 1) return; // Ensure at least one testcase remains
        const newTestcases = testcases.slice(0, -1); // Remove the last testcase
        setTestcases(newTestcases);
        handleInputChange("TestCases", newTestcases);
    };

    //function that toggles the value of sampleTestCase
    const toggleSample = (index) => {
        const updatedTestcases = [...testcases];
        updatedTestcases[index].sampleTestCase = !updatedTestcases[index].sampleTestCase;
        setTestcases(updatedTestcases);
        handleInputChange("TestCases", updatedTestcases);
    };

    //function that updates the value of the testcase (input or output)
    const updateTestcase = (index, field, value) => {
        const updatedTestcases = [...testcases];
        updatedTestcases[index][field] = value;
        setTestcases(updatedTestcases);
        handleInputChange("TestCases", updatedTestcases);
    }

    const validateForm = () => {
        if (formData.QuestionName === "") {
            toast.error("Question Name is required");
            return true;
        }
        if (formData.ProblemStatement === "") {
            toast.error("Problem Statement is required");
            return true;
        }
        if (formData.Constraints === "") {
            toast.error("Constraints is required");
            return true;
        }
        if (formData.InputFormat === "") {
            toast.error("Input Format is required");
            return true;
        }
        if (formData.OutputFormat === "") {
            toast.error("Output Format is required");
            return true;
        }
        if (!formData.TestCases || formData.TestCases.length === 0) {
            toast.error("Test Cases are required");
            return true;
        } else {
            if (!formData.TestCases.some(testcase => !testcase.sampleTestCase)) { // no object with sampleTestCase = false
                toast.error("atleast one Hidden Test Case is required");
                return true;
            }
            if (!formData.TestCases.some(testcase => testcase.sampleTestCase)) { //no object with sampleTestCase = true
                toast.error("atleast one Sample Test Case is required");
                return true;
            }
        }
        if (formData.SolutionCode === "") {
            toast.error("Solution Code is required");
            return true;
        }
        if (formData.RandomTestChecked && formData.RandomTestCode === "") {
            toast.error("Random Test Code is required, if you have checked the Random Test Case Generator");
            return true;
        }
        return false;
    }

    const HandleSubmit = async (e) => {
        e.preventDefault(); // Prevents default refresh by the browser
        if (validateForm()) return; // Reuse validation logic
        try {
            if (!formData.RandomTestChecked) { // if Random Test Case Generator is not checked, then RandomTestCode should be empty
                formData.RandomTestCode = "";
            }
            const response = await axios.post("/professors/createQuestion", formData, { withCredentials: true });
            toast[response.data.success ? "success" : "error"](response.data.message);
            if (response.data.success) {
                window.location.reload();
            }
        } catch (err) {
            console.log(err);
            toast.error(`Error while creating question: ${err}`);
        }
    }

    const HandleUpdate = async (e) => {
        e.preventDefault(); // Prevents default refresh by the browser
        if (validateForm()) return; // Reuse validation logic
        try {
            if (!formData.RandomTestChecked) { // if Random Test Case Generator is not checked, then RandomTestCode should be empty
                formData.RandomTestCode = "";
            }
            formData._id = _id;
            const response = await axios.put("/professors/updateQuestion", formData, { withCredentials: true });
            toast[response.data.success ? "success" : "error"](response.data.message);
            if (response.data.success) {
                window.location.reload();
            }
        } catch (err) {
            console.log(err);
            toast.error(`Error while updating question: ${err}`);
        }
    }

    return (
        <div style={{ color: "white" }}>
            <div className="container">
                <div className="row my-3">
                    <div className="col my-3">
                        <button type="button" className="btn btn-success w-100 h-100" onClick={addTestcase}>
                            Add Testcase
                        </button>
                    </div>
                    <div className="col my-3">
                        <button type="button" className="btn btn-danger w-100 h-100" onClick={removeTestcase}>
                            Remove Testcase
                        </button>
                    </div>
                </div>
                {testcases.map((testcase, index) => (
                    <div className="row my-1" key={index}>
                        <div className="col">
                            <TestCase
                                index={index}
                                toggleSample={toggleSample}
                                name={`Testcase ${index + 1}`}
                                isChecked={testcase.sampleTestCase}
                                input={testcase.input}
                                output={testcase.output}
                                updateTestcase={updateTestcase}
                            />
                        </div>
                    </div>
                ))}
                <div className="row mb-3 mt-3">
                    <div className="col">
                        {editQuestion ? <button className="btn btn-primary w-100 mb-3" onClick={HandleUpdate}>Update</button> : <button className="btn btn-primary w-100 mb-3" onClick={HandleSubmit}>Create</button>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TestcasesTab; 
