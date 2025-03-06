import Harness from '../../../test/harness';
import MLTextComponent from './MLText';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

describe('MLText Component', () => {
  it('Should build a MLText component', (done) => {
    Harness.testCreate(MLTextComponent, comp1).then((component) => {
      // expect(component.element).toMatchSnapshot();

      done();
    });
  });

  it('Only text should be displayed in mode viewOnly', (done) => {
    Harness.testCreate(MLTextComponent, comp2).then((component) => {
      const value = { en: 'test' };

      component.setReactProps({ viewOnly: true, value });
      component.setValue(value);

      component.on('componentChange', () => {
        // expect(component.element.getElementsByTagName("input")).toEqual(null);
        // expect(component.element.getElementsByClassName("ecos-ml-text").item(0).textContent).toEqual(value.en);
        // expect(component.element).toMatchSnapshot();
        done();
      });
    });
  });
});
