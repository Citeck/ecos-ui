import Harness from '../../../test/harness';
import MLTextComponent from './MLText';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp1';

basicSectionTest(MLTextComponent);

describe('MLText Component', () => {
  it('Should build a MLText component', done => {
    Harness.testCreate(MLTextComponent, comp1).then(() => {
      done();
    });
  });

  it('Only text should be displayed in mode viewOnly', done => {
    Harness.testCreate(MLTextComponent, comp2).then(component => {
      const value = { en: 'test' };

      component.setReactProps({ viewOnly: true });
      component.setReactProps({ value });
      component.setValue(value);

      component.on('componentChange', () => {
        expect(component.element.querySelector('input')).toEqual(null);
        expect(component.element.querySelector('.ecos-ml-text').innerHTML).toEqual(value.en);

        done();
      });
    });
  });
});
