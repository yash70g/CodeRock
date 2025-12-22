const fs = require('fs');
const path = require('path');
const { DeleteAfterExecution } = require('../src/Code/Run');

describe('DeleteAfterExecution', () => {
  test('deletes temp file within a short window', async () => {
    const tempDir = path.join(__dirname, '..', 'src', 'Code', 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const fname = path.join(tempDir, `test_del_${Date.now()}_${Math.random().toString(36).slice(2,6)}.txt`);
    fs.writeFileSync(fname, 'hello');

    expect(fs.existsSync(fname)).toBe(true);

    DeleteAfterExecution(fname);

    // wait up to 2 seconds for deletion (polling)
    const waitUntilDeleted = async () => {
      for (let i = 0; i < 20; i++) {
        if (!fs.existsSync(fname)) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return false;
    };

    const deleted = await waitUntilDeleted();
    expect(deleted).toBe(true);
  });
});
