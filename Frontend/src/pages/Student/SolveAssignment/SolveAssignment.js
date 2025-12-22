import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAPI } from '../../../Scripts/Axios';
import LoadingSpinner from '../../../components/Spinners/Spinners';
import SolveQuestion from './SolveQuestion';
import SubmitAssignmentNavbar from '../../../components/Navbar/SubmitAssignmentNavbar';
import AssignmentDetailsAccordion from '../../../components/Accordion/AssignmentDetailsAccordion';

let DefaultUserCode =

   `#include <bits/stdc++.h>
using namespace std;


//WRITE YOUR FUNCTION HERE


int main() {
    //Complete Your Function
    return 0;
}`

function SolveAssignment() {

    const { _id } = useParams();
    const [AssignmentDetails, setAssignmentDetails] = useState(null); //AssignmentDetails also contains the public details of each question
    const [UserCodes, setUserCodes] = useState([]);


    //UserCodes should be an array of object with each object having the following structure

    // {
    //     QuestionName: String,
    //     UserCode: String,
    //     QuestionId: String
    // }

    useEffect(() => {
        const FetchAssignment = async () => {
            try {
                console.log("fetching assignment Details")
                const response = await fetchAPI(`/students/getPendingAssignment/${_id}`);
                console.log(response.data);
                if (response.data.success) {
                    toast.success(response.data.message);
                    setAssignmentDetails(response.data.Assignment);

                    // Try to load saved user codes from localStorage for this assignment
                    const lsKey = `newp_usercodes:${response.data.Assignment._id}`;
                    let savedMap = {};
                    try {
                        const parsed = JSON.parse(localStorage.getItem(lsKey) || "{}");
                        if (parsed && typeof parsed === 'object') savedMap = parsed;
                    } catch (e) {
                        // ignore parse errors
                    }

                    const defaultSolutionCodes = response.data.Assignment.Questions.map((question) => {
                        return {
                            QuestionName: question.QuestionName,
                            UserCode: savedMap[question._id] || DefaultUserCode,
                            QuestionId: question._id
                        };
                    });
                    setUserCodes(defaultSolutionCodes);

                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error(`Error fetching Assignment. Please try again later. err : ${error}`);
            }
        }
        FetchAssignment();
    }, []);

    // Persist user code changes to localStorage so code survives refreshes
    // Keyed by assignment id: { questionId: code }
    useEffect(() => {
        if (!_id || !UserCodes || UserCodes.length === 0) return;
        const lsKey = `newp_usercodes:${_id}`;
        const map = {};
        try {
            UserCodes.forEach(uc => {
                if (uc && uc.QuestionId) map[uc.QuestionId] = uc.UserCode || "";
            });
            localStorage.setItem(lsKey, JSON.stringify(map));
        } catch (e) {
            // ignore localStorage errors
            console.error('Failed to persist user codes to localStorage', e);
        }
    }, [UserCodes, _id]);

    if (AssignmentDetails === null) {
        return <LoadingSpinner />
    }

    return (
        <>
            <SubmitAssignmentNavbar _id={_id} UserCodes={UserCodes} />
            <div className="container">
                <div className="row">
                    <div className="col">
                        <AssignmentDetailsAccordion PostedBy={AssignmentDetails?.PostedBy.Name} PostedOn={AssignmentDetails?.PostedOn} DueTimestamp={AssignmentDetails?.DueTimestamp} Batches={AssignmentDetails?.Batches} Year={AssignmentDetails?.Year} NumberOfQuestions={AssignmentDetails?.Questions.length} AIAssistance={AssignmentDetails.AIAssistance}/>
                    </div>
                </div>
                <SolveQuestion Questions={AssignmentDetails?.Questions} AssignmentId={AssignmentDetails?._id} UserCodes={UserCodes} setUserCodes={setUserCodes} AIAssistance={AssignmentDetails.AIAssistance}/>
            </div>
        </>
    );
}

export default SolveAssignment;

