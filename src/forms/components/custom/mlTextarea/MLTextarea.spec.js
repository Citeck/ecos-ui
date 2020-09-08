import Harness from '../../../test/harness';
import MLTextareaComponent from './MLTextarea';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

describe('MLTextarea Component', () => {
  it('Should build a MLTextarea component', done => {
    Harness.testCreate(MLTextareaComponent, comp1).then(() => {
      done();
    });
  });

  it('Should set "en" language text', done => {
    Harness.testCreate(MLTextareaComponent, comp2).then(component => {
      Harness.getInputValue(component, 'Textarea', 'Test data', 'textarea');
      done();
    });
  });

  it('The set value must be equal to the received', done => {
    Harness.testCreate(MLTextareaComponent, comp2).then(component => {
      Harness.getInputValue(component, 'Textarea', 'Test data', 'textarea');
      Harness.testSetGet(component, { fr: 'Données de test' });
      done();
    });
  });

  // TODO: test falls
  // it('Should set "ru" language text', done => {
  //   const comp = _.cloneDeep(comp2);
  //
  //   comp.defaultValue = { en: 'Test data' };
  //
  //   Harness.testCreate(MLTextareaComponent, comp).then(component => {
  //     component.setReactProps({ lang: 'ru' });
  //     Harness.getInputValue(component, 'Textarea', '', 'textarea');
  //     done();
  //   });
  // });
});
