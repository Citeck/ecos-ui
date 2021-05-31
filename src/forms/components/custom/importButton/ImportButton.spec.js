import Harness from '../../../test/harness';
import ImportButton from './ImportButton';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(ImportButton);

describe('ImportButton Component', () => {
  it('Should build a ImportButton component', done => {
    Harness.testCreate(ImportButton, comp1).then(() => {
      done();
    });
  });
});
