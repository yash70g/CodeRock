import { useState, useRef, useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import LogsAccordion from '../Accordion/LogsAccordion';
import { Spinner } from 'react-bootstrap';
import GroupedResults from '../List/EvaluateAssignmentDisplay';
import { useNavigate } from 'react-router-dom';

//_id is the assignment id and UserCodes is an array of objects with the following structure
// {
//     QuestionName: String,
//     UserCode: String,
//     QuestionId: String
// }

function SubmitAssignmentModal({ _id, UserCodes }) {
    const [showModal, setShowModal] = useState(false);
    const [logsMessage, setLogsMessage] = useState([]);
    const [CurMessage, setCurMessage] = useState("");
    const [isOpen, setIsOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [verdictAndDecision, setverdictAndDecision] = useState([]);
    const socketRef = useRef(null);
    const navigate = useNavigate();

    const handleShowModal = () => {
        setShowModal(true);
        setIsOpen(true);
        setIsLoading(true);
        setLogsMessage([]);
        setCurMessage("");
        setverdictAndDecision([]);
        handleEvaluateAssignment();
    }

    const handleCloseModal = () => {
        if (socketRef.current) {
            try { socketRef.current.close(); } catch (e) { /* ignore */ }
            socketRef.current = null;
        }
        setShowModal(false);
        setLogsMessage([]);
        setCurMessage("");
        setverdictAndDecision([]);
        setIsLoading(true);
    }

    useEffect(() => {
        if (!isLoading) {
            const expected = Array.isArray(UserCodes) ? UserCodes.length : 0;
            if (expected === 0) return;
            const decisionsCount = verdictAndDecision.filter(r => r.type === 'Decision' || r.type === 'Verdict').length;
            if (decisionsCount >= expected) {
                navigate('/students/assignments');
                handleCloseModal();
            }
        }
    }, [isLoading, verdictAndDecision]);

    const handleEvaluateAssignment = async () => {
        try {
            const socket = new WebSocket(`${process.env.REACT_APP_SERVER_WS_URL}/students/assignments/evaluateAssignment/${_id}`);
            socketRef.current = socket;

            socket.onopen = () => { /*  "start" */ };

            socket.onmessage = (event) => {
                if (event.data === "start") {
                    try {
                        socket.send(JSON.stringify({ UserCodes }));
                    } catch (error) {
                        toast.error(error.message);
                        try { socket.close(); } catch (_) {}
                    }
                    return;
                }

                try {
                    const response = JSON.parse(event.data);

                    if (response.success === false) {
                        try { socket.close(); } catch (_) {}
                        return;
                    }

                    if (response.type === "output") {
                        setLogsMessage((prev) => [...prev, response]);
                        setCurMessage(response); 
                    }

                    if (response.type === "Verdict" || response.type === "Decision") {
                        setverdictAndDecision((prev) => [...prev, response]);
                    }

                } catch (error) {
                    toast.error(error.message);
                    try { socket.close(); } catch (_) {}
                }
            };

            socket.onclose = () => {
                setIsLoading(false);
                setIsOpen(false);
            };

            socket.onerror = (e) => {
                toast.error('WebSocket error during evaluation');
                setIsLoading(false);
                try { socket.close(); } catch (_) {}
            };
        } catch (error) {
            toast.error(error.message);
            setIsLoading(false);
        }
    }

    const handleUnsubmit = () => {
        try {
            if (socketRef.current && socketRef.current.readyState === 1) {
                socketRef.current.send(JSON.stringify({ type: 'cancel' }));
                socketRef.current.close();
            }
        } catch (e) { console.warn('unsubmit error', e); }

        setShowModal(false);
        setLogsMessage([]);
        setCurMessage("");
        setverdictAndDecision([]);
        setIsLoading(true);
    }

    return (
        <>
            <Button variant="primary" onClick={handleShowModal}>
                Submit Assignment
            </Button>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Submit Assignment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{CurMessage && CurMessage.message ? CurMessage.message : ''}</p>

                    {isLoading && <Spinner animation="border" role="status" />}

                    {/* Show grouped results (verdicts/decisions) */}
                    
                    <GroupedResults results={verdictAndDecision} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    <Button variant="danger" onClick={handleUnsubmit}>Unsubmit</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default SubmitAssignmentModal;
