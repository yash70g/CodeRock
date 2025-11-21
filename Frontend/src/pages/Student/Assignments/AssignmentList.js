import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getTimeElapsed, convertIsoToNormalTime } from "../../../Scripts/TimeFunctions";
import AssignmentListSkeleton from "../../../components/Skeletons/AssignmentListSkeleton";
import { fetchData, putAPI, fetchAPI } from '../../../Scripts/Axios';
import { Dropdown } from "react-bootstrap";
import UnsubmitAssignmentConfirmationModal from "../../../components/Modal/UnsubmitAssignmentConfirmationModal";
import './AssignmentList.css';

function AssignmentList({ listType }) {

    const [assignments, setAssignments] = useState(null);
    const [questionNames, setQuestionNames] = useState({});

    // Unsubmit Modal
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

    const handleShowConfirmationModal = (assignmentId) => {
        setSelectedAssignmentId(assignmentId);
        setShowConfirmationModal(true);
    };

    const handleCloseConfirmationModal = () => {
        setShowConfirmationModal(false);
        setSelectedAssignmentId(null);
    };

    const handleUnsubmit = async () => {
        try {
            const response = await putAPI(`/students/assignment/unsubmit/${selectedAssignmentId}`);

            if (response.data.success) {
                toast.success(response.data.message);
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(response.data.message);
            }

        } catch (err) {
            toast.error("Error unsubmitting Assignment.");
        }
    };

    // Fetch question name by ID
    const fetchQuestionName = async (questionId) => {
        try {
            // Use Public endpoint for students, Full for professors
            const type = listType === "Pending" || listType === "Submitted" ? "Public" : "Full";
            const response = await fetchAPI(`/Get${type}Question/${questionId}`);
            
            if (response.data.success && response.data.Question) {
                return response.data.Question.QuestionName;
            }
            return "Untitled Question";
        } catch (error) {
            console.error(`Error fetching question name for ${questionId}:`, error);
            return "Untitled Question";
        }
    };

    // Fetch all question names for assignments
    const fetchAllQuestionNames = async (assignmentsList) => {
        const names = {};
        
        for (const assignment of assignmentsList) {
            for (const question of assignment.Questions) {
                const qId = question._id || question;
                if (!names[qId]) {
                    names[qId] = await fetchQuestionName(qId);
                }
            }
        }
        
        setQuestionNames(names);
    };

    // Fetch assignments
    useEffect(() => {
        const loadAssignments = async () => {
            try {
                const response = await fetchAPI(`/students/assignments/${listType.toLowerCase()}`);
                
                if (response.data.success) {
                    setAssignments(response.data.Assignments || []);
                    // Fetch question names after assignments are loaded
                    if (response.data.Assignments && response.data.Assignments.length > 0) {
                        await fetchAllQuestionNames(response.data.Assignments);
                    }
                } else {
                    toast.error(response.data.message || `Error fetching ${listType} Assignments`);
                    setAssignments([]);
                }
            } catch (error) {
                toast.error(`Error fetching ${listType} Assignments`);
                setAssignments([]);
            }
        };

        loadAssignments();
    }, [listType]);

    if (assignments === null) return <AssignmentListSkeleton count={1} />;

    return (
        <div className="container px-1 my-1 cc-assignments">

            {assignments.length === 0 ? (
                <h6 className="text-light text-center">No {listType} Assignments</h6>
            ) : (

                assignments.map((assignment, index) => (
                    <div key={index} className="row my-3 w-100">
                        <div className="col">
                            <div className="card">

                                {/* HEADER */}
                                <div className="card-header d-flex align-items-center">
                                    <small className="text-muted">{assignment.PostedBy.Name}</small>

                                    <h5 className="text-center mb-0 flex-grow-1">
                                        {assignment.AssignmentName}
                                    </h5>

                                    {listType === "Submitted" && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleShowConfirmationModal(assignment._id)}
                                        >
                                            Unsubmit
                                        </button>
                                    )}
                                </div>

                                {/* BODY */}
                                <div className="card-body">

                                    <p className="card-text">
                                        <strong>Posted On:</strong>{" "}
                                        {convertIsoToNormalTime(assignment.PostedOn).date}{" "}
                                        {convertIsoToNormalTime(assignment.PostedOn).time}{" "}
                                        <span className="text-muted">[ {getTimeElapsed(assignment.PostedOn)} ]</span>
                                    </p>

                                    <p className="card-text">
                                        <strong>Due Timestamp:</strong>{" "}
                                        {convertIsoToNormalTime(assignment.DueTimestamp).date}{" "}
                                        {convertIsoToNormalTime(assignment.DueTimestamp).time}{" "}
                                        <span className="text-muted">[ {getTimeElapsed(assignment.DueTimestamp)} ]</span>
                                    </p>

                                    <p className="card-text">
                                        <strong>Batches:</strong>{" "}
                                        {assignment.Batches.map((batch, i) => (
                                            <span key={i} className="badge bg-secondary mx-1">
                                                {batch}
                                            </span>
                                        ))}
                                    </p>

                                </div>

                                {/* FOOTER */}
                                <div className="card-footer d-flex justify-content-between align-items-center">

                                    {/* QUESTIONS DROPDOWN using correct Question.js routes */}
                                    <Dropdown>
                                        <Dropdown.Toggle variant="secondary" size="sm">
                                            Questions: {assignment.Questions.length}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="bg-dark text-white">
                                            {assignment.Questions.map((q, i) => {
                                                const qId = q._id || q;
                                                return (
                                                    <Dropdown.Item
                                                        key={qId || `q-${i}`}
                                                        className="text-white"
                                                        onClick={() => {
                                                            // Students → Public
                                                            // Professors → Full
                                                            const type = listType === "Pending" || listType === "Submitted"
                                                                ? "Public"
                                                                : "Full";

                                                            window.location.href = `/Question/${type}/${qId}`;
                                                        }}
                                                    >
                                                        {i + 1}. {questionNames[qId] || "Loading..."}
                                                    </Dropdown.Item>
                                                );
                                            })}
                                        </Dropdown.Menu>
                                    </Dropdown>

                                    {/* Solve */}
                                    {listType === "Pending" && (
                                        <a
                                            href={`/students/solveAssignment/${assignment._id}`}
                                            className="btn btn-success btn-sm"
                                        >
                                            Solve
                                        </a>
                                    )}

                                    {/* Submissions */}
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() =>
                                            window.location.href =
                                            `/students/submissions/${assignment.AssignmentName}/${assignment._id}`
                                        }
                                    >
                                        Submissions ({assignment.SubmittedBy.length})
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                ))
            )}

            <UnsubmitAssignmentConfirmationModal
                show={showConfirmationModal}
                handleClose={handleCloseConfirmationModal}
                Label={"This Assignment"}
                handleUnsubmit={handleUnsubmit}
            />
        </div>
    );
}

export default AssignmentList;