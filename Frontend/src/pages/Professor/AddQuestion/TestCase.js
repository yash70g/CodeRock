import { Form } from "react-bootstrap";
import CharacterCounter from "../../../components/CommonComponents/CharacterCounter"; // Assuming CharacterCounter is in a separate file
import { useRef } from 'react';


function TestCase({ index, toggleSample, name, isChecked, input, output, updateTestcase }) {

    const textAreaRef = useRef(null);
    const outputRef = useRef(null);

    return (
        <Form.Group controlId={`inputTestcase${index + 1}`}>
            <Form.Label>{name}</Form.Label>
            <Form.Check
                type="switch"
                id={`sampleToggle${index + 1}`}
                label="Sample Testcase"
                checked={isChecked}
                onChange={() => toggleSample(index)} // Added onChange handler
                className="mb-3"
            />

            <Form.Label>{`${name} Input`}</Form.Label>
            <Form.Control
                as="textarea"
                placeholder={`${name} Input`}
                maxLength={200}
                value={input}
                onChange={(e) => updateTestcase(index, 'input', e.target.value)} // Added onChange handler
                ref={textAreaRef}
            />
            <CharacterCounter
                maxLength={200}
                textAreaRef={textAreaRef}
                fontColor="white"
            />

            <Form.Label className="mt-3">{`${name} Output`}</Form.Label>
            <Form.Control
                as="textarea"
                placeholder={`${name} Output`}
                maxLength={200}
                value={output}
                onChange={(e) => updateTestcase(index, 'output', e.target.value)}
                ref={outputRef}
            />
            <CharacterCounter
                maxLength={200}
                textAreaRef={outputRef}
                fontColor="white"
            />
        </Form.Group>
    );
}

export default TestCase;