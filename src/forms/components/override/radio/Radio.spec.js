import Harness from '../../../test/harness';
import RadioComponent from './Radio';

import comp1 from './fixtures/comp1';

describe('Radio Component', () => {
  it('Should build a radio component', done => {
    Harness.testCreate(RadioComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="radio"]', 4);
      Harness.testElements(component, 'span', 4);
      done();
    });
  });

  it('Span should have correct text label', done => {
    Harness.testCreate(RadioComponent, comp1).then(component => {
      component.element.querySelectorAll('input').forEach(input => {
        expect(input.getAttribute('class').indexOf('form-check-input')).not.toBe(-1);
      });
      const spans = component.element.querySelectorAll('span');
      expect(spans[0].innerHTML).toBe('Red');
      expect(spans[1].innerHTML).toBe('Green');
      expect(spans[2].innerHTML).toBe('Blue');
      expect(spans[3].innerHTML).toBe('Yellow');
      done();
    });
  });

  it('Should set the radio-selected class on wrapper of selected radio', done => {
    Harness.testCreate(RadioComponent, comp1).then(component => {
      const selector = '.radio:nth-child(1)';
      const firstRadioWrapper = component.element.querySelector(selector);
      expect(firstRadioWrapper.getAttribute('class').indexOf('radio-selected')).toBe(-1);
      Harness.clickElement(component, `${selector} input`);
      expect(firstRadioWrapper.getAttribute('class').indexOf('radio-selected')).not.toBe(-1);
      done();
    });
  });

  it('Should unset the radio-selected class on wrapper of selected radio', done => {
    Harness.testCreate(RadioComponent, comp1).then(component => {
      const selector = number => `.radio:nth-child(${number})`;
      const radioWrapper = component.element.querySelector(selector(1));
      expect(radioWrapper.getAttribute('class').indexOf('radio-selected')).toBe(-1);
      Harness.clickElement(component, `${selector(1)} input`);
      expect(radioWrapper.getAttribute('class').indexOf('radio-selected')).not.toBe(-1);
      Harness.clickElement(component, `${selector(2)} input`);
      expect(radioWrapper.getAttribute('class').indexOf('radio-selected')).toBe(-1);
      done();
    });
  });
});
