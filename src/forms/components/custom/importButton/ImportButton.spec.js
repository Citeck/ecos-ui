import Harness from '../../../test/harness';
import ImportButton from './ImportButton';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

basicSectionTest(ImportButton);

describe('ImportButton Component', () => {
  it('Should build a ImportButton component', done => {
    Harness.testCreate(ImportButton, comp1).then(() => {
      done();
    });
  });

  it('Should be valid label (label is string)', done => {
    Harness.testCreate(ImportButton, comp1).then(component => {
      expect(component.element.textContent).toBe(comp1.label);
      done();
    });
  });

  it('Should be valid label (label is ml object)', done => {
    Harness.testCreate(ImportButton, comp2).then(component => {
      expect(component.element.textContent).toBe(comp2.label.en);
      done();
    });
  });
});
