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

struct Node {
    int data;
    Node* left;
    Node* right;
    Node(int val) : data(val), left(NULL), right(NULL) {}
};

//Complete  YOUR FUNCTION HERE
int func(Node *root){return 0;}
Node* buildTree(vector<int>& nodes) { //Only change when needed 
    if (nodes.empty()) return NULL;
    Node* root = new Node(nodes[0]);
    queue<Node*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < nodes.size()) {
        Node* curr = q.front();
        q.pop();
        if (i < nodes.size() && nodes[i] != -1) { 
            curr->left = new Node(nodes[i]);
            q.push(curr->left);
        }
        i++;
        if (i < nodes.size() && nodes[i] != -1) {
            curr->right = new Node(nodes[i]);
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

int main() {
    int n;
    cin >> n;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    Node* root = buildTree(arr);

    cout << func(root); //function call
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

                    const defaultSolutionCodes = response.data.Assignment.Questions.map((question) => {
                        return {
                            QuestionName: question.QuestionName,
                            UserCode: DefaultUserCode,
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

