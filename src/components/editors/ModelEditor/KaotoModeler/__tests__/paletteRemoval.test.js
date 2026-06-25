import fs from 'fs';
import path from 'path';

const PKG_DIR = path.resolve(__dirname, '..');

describe('Task 1: palette removal — file cleanup', () => {
  test('AddStepButton.jsx, AddStepModal.jsx, addStepTiles.js are removed', () => {
    expect(fs.existsSync(path.join(PKG_DIR, 'AddStepButton.jsx'))).toBe(false);
    expect(fs.existsSync(path.join(PKG_DIR, 'AddStepModal.jsx'))).toBe(false);
    expect(fs.existsSync(path.join(PKG_DIR, 'addStepTiles.js'))).toBe(false);
  });

  test('KaotoModeler.jsx contains no references to AddStepButton/handleAddStep/appendStep', () => {
    const src = fs.readFileSync(path.join(PKG_DIR, 'KaotoModeler.jsx'), 'utf8');
    expect(src).not.toMatch(/AddStepButton/);
    expect(src).not.toMatch(/AddStepModal/);
    expect(src).not.toMatch(/addStepTiles/);
    expect(src).not.toMatch(/handleAddStep/);
    expect(src).not.toMatch(/from '\.\/yamlSteps'/);
  });

  test('yamlSteps.js is removed — dumpYaml folded into initialRoute.js (js-yaml directly)', () => {
    expect(fs.existsSync(path.join(PKG_DIR, 'yamlSteps.js'))).toBe(false);
    const initialRouteSrc = fs.readFileSync(
      path.resolve(PKG_DIR, '../../../../pages/ModelEditor/CamelDslEditor/initialRoute.js'),
      'utf8'
    );
    // The starter-route YAML is now serialized inline via js-yaml — no yamlSteps wrapper.
    expect(initialRouteSrc).not.toMatch(/yamlSteps/);
    expect(initialRouteSrc).toMatch(/from 'js-yaml'/);
  });
});
