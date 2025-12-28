import React, { useEffect, useState } from 'react';
import NavbarWithProfileAndSidebar from '../../../components/Navbar/NavbarWithProfileAndSidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchData, putData } from '../../../Scripts/Axios';
import CreateAssignmentNavtabs from './CreateAssignmentNavtabs';
import { toast } from 'react-toastify';

function EditAssignment({ NavTabs, NavLinks }) {
    const { _id } = useParams();
    const navigate = useNavigate();
    const [initialData, setInitialData] = useState(null);
    const [Batches, setBatches] = useState([]);
    const [MyQuestions, setMyQuestions] = useState([]);
    const [OtherQuestions, setOtherQuestions] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                // Fetch the assignment by listing professor assignments and picking the right one
                const r = await fetch(`${process.env.REACT_APP_SERVER_URL}/professors/myAssignments`, { credentials: 'include' });
                const data = await r.json();
                if (data && data.success) {
                    const found = data.Assignments.find(a => a._id === _id);
                    if (!found) {
                        toast.error('Assignment not found or you are not authorized');
                        navigate('/professors/assignments');
                        return;
                    }
                    setInitialData(found);
                }
            } catch (e) {
                toast.error('Failed to load assignment');
                navigate('/professors/assignments');
                return;
            }

            // fetch supporting data: batches and questions
            try {
                const r2 = await fetch(`${process.env.REACT_APP_SERVER_URL}/getBatches`, { credentials: 'include' });
                const d2 = await r2.json();
                if (d2 && d2.success) setBatches(d2.Batches || []);
            } catch (e) { }

            try {
                const r3 = await fetch(`${process.env.REACT_APP_SERVER_URL}/professors/getMyQuestions`, { credentials: 'include' });
                const d3 = await r3.json();
                if (d3 && d3.success) setMyQuestions(d3.Questions || []);
            } catch (e) { }

            try {
                const r4 = await fetch(`${process.env.REACT_APP_SERVER_URL}/professors/getOtherQuestions`, { credentials: 'include' });
                const d4 = await r4.json();
                if (d4 && d4.success) setOtherQuestions(d4.Questions || []);
            } catch (e) { }
        }
        fetch();
    }, [_id, navigate]);

    const handleUpdate = async (formData) => {
        try {
            const body = { ...formData, _id: _id };
            await putData('/professors/updateAssignment', body, 'Error updating assignment', () => {
                toast.success('Assignment updated');
                navigate('/professors/assignments');
            });
        } catch (e) {
            toast.error('Error updating assignment');
        }
    }

    return (
        <>
            <NavbarWithProfileAndSidebar TabNames={NavTabs} TabLinks={NavLinks} ActiveTabIndex={0} />
            <div className="container my-3">
                <h3>Edit Assignment</h3>
                {initialData ? (
                    <CreateAssignmentNavtabs activeTab="OverviewTab" Batches={Batches} MyQuestions={MyQuestions} OtherQuestions={OtherQuestions} initialData={initialData} onSubmit={handleUpdate} />
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </>
    );
}

export default EditAssignment;
