const { RunAndCompare, EvaluateQuestion } = require('../src/Code/codeEvaluation');

jest.mock('../src/Code/Run', () => ({
  RunCpp: jest.fn(),
  DeleteAfterExecution: jest.fn()
}));

jest.mock('../src/Code/StreamComparison', () => ({
  compareTextFilesLineByLine: jest.fn()
}));

const { RunCpp } = require('../src/Code/Run');
const { compareTextFilesLineByLine } = require('../src/Code/StreamComparison');

describe('RunAndCompare', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses testcase.output as ground truth when present and passes when outputs match', async () => {
    const tc = { input: '1 2', output: '42', sampleTestCase: true };

    // student run returns same output
    RunCpp.mockResolvedValueOnce({ success: true, output: '42' });
    compareTextFilesLineByLine.mockResolvedValue({ success: true, different: false });

    const res = await RunAndCompare(null, 'solution', 'student', tc, 'TC1', 'Q');

    expect(res.ok).toBe(true);
    // Solution RunCpp should NOT be called since output provided; only student run should be called
    expect(RunCpp).toHaveBeenCalledTimes(1);
    expect(RunCpp).toHaveBeenCalledWith('student', tc.input, 5);
    expect(res.solOutput).toBe('42');
    expect(res.stuOutput).toBe('42');
    expect(res.success).toBe(true);
  });

  test('returns wrong_answer when student output differs from testcase.output', async () => {
    const tc = { input: 'a', output: 'expected', sampleTestCase: false };

    RunCpp.mockResolvedValueOnce({ success: true, output: 'unexpected' });
    compareTextFilesLineByLine.mockResolvedValue({ success: true, different: true });

    const res = await RunAndCompare(null, 'solution', 'student', tc, 'TC2', 'Q');

    expect(res.ok).toBe(false);
    expect(res.reason).toBe('wrong_answer');
    expect(res.solOutput).toBe('expected');
    expect(res.stuOutput).toBe('unexpected');
  });

  test('returns student_error when student run fails', async () => {
    const tc = { input: '', output: 'o', sampleTestCase: true };

    RunCpp.mockResolvedValueOnce({ success: false, message: 'runtime error', verdict: 'Runtime Error' });

    const res = await RunAndCompare(null, 'solution', 'student', tc, 'TC3', 'Q');

    expect(res.ok).toBe(false);
    expect(res.reason).toBe('student_error');
    expect(res.stuError).toBe('runtime error');
  });

  test('falls back to running solution when testcase.output is missing', async () => {
    const tc = { input: '5 6', sampleTestCase: false };

    // First call: solution run
    RunCpp.mockResolvedValueOnce({ success: true, output: 'SOL' });
    // Second call: student run
    RunCpp.mockResolvedValueOnce({ success: true, output: 'SOL' });
    compareTextFilesLineByLine.mockResolvedValue({ success: true, different: false });

    const res = await RunAndCompare(null, 'solution', 'student', tc, 'TC4', 'Q');

    expect(res.ok).toBe(true);
    expect(RunCpp).toHaveBeenCalledTimes(2);
    expect(RunCpp).toHaveBeenNthCalledWith(1, 'solution', tc.input, 5);
    expect(RunCpp).toHaveBeenNthCalledWith(2, 'student', tc.input, 5);
    expect(res.solOutput).toBe('SOL');
    expect(res.stuOutput).toBe('SOL');
  });
});

describe('EvaluateQuestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('evaluates all testcases, uses testcase outputs and returns correct totals', async () => {
    // Question with two testcases, first has output, second missing
    const question = {
      QuestionName: 'TQ',
      TestCases: [
        { input: '1', output: 'A', sampleTestCase: true },
        { input: '2', sampleTestCase: false }
      ],
      SolutionCode: 'solcode'
    };

    // For test1: student returns A
    RunCpp.mockResolvedValueOnce({ success: true, output: 'A' });
    // For test2: solution run (fallback) returns B, student returns B
    RunCpp.mockResolvedValueOnce({ success: true, output: 'B' });
    RunCpp.mockResolvedValueOnce({ success: true, output: 'B' });

    compareTextFilesLineByLine.mockResolvedValue({ success: true, different: false });

    const ws = { send: jest.fn() };

    const result = await EvaluateQuestion(ws, question, 'studentcode');

    expect(result.TotalScore).toBe(2);
    expect(result.ScoreObtained).toBe(2);
    expect(result.Details).toHaveLength(2);
    expect(result.Details[0].testcaseIndex).toBe(1);
    expect(result.Details[1].testcaseIndex).toBe(2);
    expect(result.Details[0].solOutput).toBe('A');
    expect(result.Details[0].stuOutput).toBe('A');
    expect(result.Details[1].solOutput).toBe('B');
    expect(result.Details[1].stuOutput).toBe('B');

    // Ensure ws got a start message and final decision
    expect(ws.send).toHaveBeenCalled();
    const sentArgs = ws.send.mock.calls.flat();
    const containsDecision = sentArgs.some(a => typeof a === 'string' && a.includes('All Testcases Passed'));
    expect(containsDecision).toBe(true);
  });
});
