import Harness from '../../../test/harness';
import HiddenComponent from './Hidden';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(HiddenComponent);

describe('Hidden Component', () => {
  it('Should build a hidden component', done => {
    Harness.testCreate(HiddenComponent, comp1).then(() => {
      done();
    });
  });

  it('Hidden component must be hidden', done => {
    Harness.testCreate(HiddenComponent, comp1).then(component => {
      expect(component.visible).toBe(false);
      done();
    });
  });
});
