import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';

function DryRunModal({ CodeToRun = "", AssignmentId = "", QuestionId = "" }) {

    const socketRef = useRef(null);
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [firstOutput, setFirstOutput] = useState("");
    const [firstError, setFirstError] = useState("");
    const [receivedFirst, setReceivedFirst] = useState(false);

    const handleClose = () => {
        if (socketRef.current) {
            try { socketRef.current.close(); } catch (_) {}
            socketRef.current = null;
        }
        setShow(false);
        setIsLoading(true);
        setFirstOutput("");
        setFirstError("");
        setReceivedFirst(false);
    }
    const handleShow = () => {
        setFirstOutput("");
        setFirstError("");
        setReceivedFirst(false);
        setIsLoading(true);
        setShow(true);
        HandleDryRun();
    }

    const HandleDryRun = () => {
        try {
            // create ws
            const socket = new WebSocket(`${process.env.REACT_APP_SERVER_WS_URL}/students/assignments/runCode/${AssignmentId}/${QuestionId}`);
            socketRef.current = socket;

            socket.onopen = () => {
            };

            socket.onmessage = (event) => {
                if (event.data === "start") {
                    try {
                        socket.send(JSON.stringify({ CodeToRun }));
                    } catch (error) {
                        toast.error(error.message);
                        socket.close();
                    }
                    return;
                }

                if (receivedFirst) return;

                try {
                    const response = JSON.parse(event.data);

                    if (response && response.type === "output" && response.testcase) {
                        // normalize testcase label e.g., "Testcase 1"
                        const tcLabel = String(response.testcase).toLowerCase();
                        if (tcLabel.includes('testcase 1') || tcLabel.includes('testcase-1') || tcLabel.includes('case 1')) {
                            // capture output or error, stop listening
                            setFirstOutput(response.output || "");
                            setFirstError(response.error || "");
                            setReceivedFirst(true);
                            setIsLoading(false);

                            try { socket.close(); } catch (_) {}
                        }
                    }
                } catch (error) {
                    console.warn('DryRunModal parse error', error);
                }
            };

            socket.onclose = () => {
                setIsLoading(false);
            };

            socket.onerror = (e) => {
                toast.error('WebSocket error');
                setIsLoading(false);
                try { socket.close(); } catch (_) {}
            };
        } catch (error) {
            toast.error(`Error while Creating a ws Connection, err : ${error.message}`);
            setIsLoading(false);
        }
    }

    return (
        <>
            <Button variant="primary" onClick={handleShow} className='w-100'>
                <FontAwesomeIcon icon={faCode} style={{ cursor: 'pointer', color: 'white' }} /> Run
            </Button>

            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isLoading ? <><Spinner animation="border" size="sm" /> Running first testcase...</> : 'Result (Testcase 1)'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoading ? (
                        <div className="text-center my-3">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <div>
                            <label style={{ fontWeight: 600 }}>Output</label>
                            <pre style={{ background: '#0d1117', color: '#e6edf3', padding: '10px', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                                {firstOutput || (firstError ? `Error: ${firstError}` : 'No output')}
                            </pre>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default DryRunModal;