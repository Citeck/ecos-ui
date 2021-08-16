import Harness from '../../../test/harness';
import UrlComponent from './Url';
import { basicSectionTest } from '../../../test/builder/helpers';

import { comp1 } from './fixtures';

basicSectionTest(UrlComponent);

describe('Url Component', () => {
  it('Should build a url component', done => {
    Harness.testCreate(UrlComponent, comp1).then(() => {
      done();
    });
  });
});
