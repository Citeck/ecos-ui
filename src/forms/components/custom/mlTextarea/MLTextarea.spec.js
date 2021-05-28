import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import MLTextareaComponent from './MLTextarea';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

basicSectionTest(MLTextareaComponent);

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

  it('Should set "ru" language text', done => {
    const value1 = { en: 'Test data' };
    const value2 = { en: 'Test data', ru: 'Тест' };

    const comp = cloneDeep(comp2);
    comp.defaultValue = value1;

    Harness.testCreate(MLTextareaComponent, comp).then(component => {
      expect(component.getValue()).toEqual(cloneDeep(value1));

      component.setReactProps({ lang: 'ru', value: value2 });
      component.setValue(value2);
      component.on('componentChange', () => {
        expect(component.getValue()).toEqual(cloneDeep(value2));
        Harness.getInputValue(component, 'Textarea', value2.ru, 'textarea');
        done();
      });
    });
  });
});
