import Harness from './test/harness';
import WebformBuilder from './WebformBuilder';

describe('Formio Form Builder tests', () => {
  beforeEach(done => Harness.builderBefore(done));
  afterEach(() => Harness.builderAfter());
  it('Should create a new form builder class', done => {
    const builder = Harness.buildComponent('textfield');
    expect(builder).toBeInstanceOf(WebformBuilder);
    done();
  });
});
