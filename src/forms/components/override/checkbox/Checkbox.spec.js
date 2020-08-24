import Harness from '../../../test/harness';
import CheckBoxComponent from './Checkbox';

import comp1 from './fixtures/comp1';

describe('Checkbox Component', () => {
  it('Should build a checkbox component', done => {
    Harness.testCreate(CheckBoxComponent, comp1).then(component => {
      const inputs = Harness.testElements(component, 'input[type="checkbox"]', 1);
      for (let i = 0; i < inputs.length; i++) {
        expect(inputs[i].getAttribute('class').indexOf('form-check-input')).not.toBe(-1);
        expect(inputs[i].name).toBe(`data[${comp1.key}]`);
      }
      Harness.testElements(component, 'span', 1);
      done();
    });
  });

  it('Span should have correct text label', done => {
    Harness.testCreate(CheckBoxComponent, comp1).then(component => {
      const componentClass = component.element.getAttribute('class');
      expect(componentClass.indexOf('form-check')).not.toBe(-1);
      const labels = component.element.querySelectorAll('label');
      expect(labels.length).toBe(1);
      expect(labels[0].getAttribute('class').indexOf('form-check-label')).not.toBe(-1);
      const spans = labels[0].querySelectorAll('span');
      expect(spans.length).toBe(1);
      expect(spans[0].innerHTML).toBe('Check me');
      done();
    });
  });

  it('Should be able to set and get data', done => {
    Harness.testCreate(CheckBoxComponent, comp1).then(component => {
      Harness.testSetGet(component, 1);
      Harness.testSetGet(component, 0);
      done();
    });
  });

  it('Should set the checkbox-checked class on wrapper of checked checkbox', done => {
    Harness.testCreate(CheckBoxComponent, comp1).then(component => {
      expect(component.element.getAttribute('class').indexOf('checkbox-checked')).toBe(-1);
      Harness.clickElement(component, 'input[type="checkbox"]');
      expect(component.element.getAttribute('class').indexOf('checkbox-checked')).not.toBe(-1);
      done();
    });
  });

  it('Should unset the checkbox-checked class on wrapper of checked checkbox', done => {
    Harness.testCreate(CheckBoxComponent, comp1).then(component => {
      expect(component.element.getAttribute('class').indexOf('checkbox-checked')).toBe(-1);
      Harness.clickElement(component, 'input[type="checkbox"]');
      expect(component.element.getAttribute('class').indexOf('checkbox-checked')).not.toBe(-1);
      Harness.clickElement(component, 'input[type="checkbox"]');
      expect(component.element.getAttribute('class').indexOf('checkbox-checked')).toBe(-1);
      done();
    });
  });
});
