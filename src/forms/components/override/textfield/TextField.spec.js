import Harness from '../../../test/harness';
import TextFieldComponent from './TextField';
import EventEmitter from '../../../EventEmitter';

import comp1 from './fixtures/comp1';

describe('TextField Component', () => {
  it('Should build a TextField component', done => {
    Harness.testCreate(TextFieldComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 1);
      done();
    });
  });
});

describe('TextField Builder', () => {
  let builder = null;
  Harness.builderBefore(() => {}, {
    editForm: {
      events: new EventEmitter({
        wildcard: false,
        maxListeners: 0,
        loadLimit: 250,
        log: true
      })
    }
  });

  it('Should create a new textfield component', done => {
    builder = Harness.buildComponent('textfield');
    builder.editForm.formReady.then(() => {
      // Make sure default preview is correct.
      const preview = builder.componentPreview.innerHTML;
      expect(preview.indexOf('formio-component formio-component-textfield formio-component-textField')).not.toBe(-1);
      expect(preview.indexOf('<label class="control-label" style="" for="textField">Text Field</label>')).not.toBe(-1);
      expect(preview.indexOf('<input name="data[textField]" type="text" class="form-control" lang="en" id="textField"')).not.toBe(-1);
      done();
    });
  });

  it('Should allow you to change the label', done => {
    Harness.setComponentProperty('label', 'Text Field', { en: 'First Name' }, preview => {
      expect(!!preview.match(/label.*input/)).toBe(true);
      expect(preview.indexOf('<label class="control-label" style="" for="textField2">First Name</label>')).not.toBe(-1);
      done();
    });
  });

  it('Should allow you to hide/show the label', done => {
    Harness.setComponentProperty('hideLabel', false, true, preview => {
      expect(preview.indexOf('<label class="control-label"')).toBe(-1);
      Harness.setComponentProperty('hideLabel', true, false, preview => {
        expect(preview.indexOf('<label class="control-label"')).not.toBe(-1);
        done();
      });
    });
  });

  it('Should allow you to change the label position', done => {
    Harness.setComponentProperty('labelPosition', 'top', 'bottom', preview => {
      expect(!!preview.match(/input.*label/)).toBe(true);
      Harness.setComponentProperty('labelPosition', 'bottom', 'left-left', preview => {
        expect(!!preview.match(/label.*style=".*float: left; width: 30%; margin-right: 3%;.*input/)).toBe(true);
        Harness.setComponentProperty('labelPosition', 'left-left', 'left-right', preview => {
          expect(!!preview.match(/label.*style=".*float: left; width: 30%; margin-right: 3%; text-align: right;.*input/)).toBe(true);
          Harness.setComponentProperty('labelPosition', 'left-right', 'right-left', preview => {
            expect(!!preview.match(/label.*style=".*float: right; width: 30%; margin-left: 3%;.*input/)).toBe(true);
            Harness.setComponentProperty('labelPosition', 'right-left', 'right-right', preview => {
              expect(!!preview.match(/label.*style=".*float: right; width: 30%; margin-left: 3%; text-align: right;.*input/)).toBe(true);
              done();
            });
          });
        });
      });
    });
  });

  it('Should allow you to change the label width and margin', done => {
    Harness.setComponentProperty('labelPosition', 'right-right', 'top', () => {
      Harness.testVisibility(builder.editForm, '.formio-component-labelWidth', false);
      Harness.testVisibility(builder.editForm, '.formio-component-labelMargin', false);
      Harness.setComponentProperty('labelPosition', 'top', 'left-left', () => {
        Harness.testVisibility(builder.editForm, '.formio-component-labelWidth', true);
        Harness.testVisibility(builder.editForm, '.formio-component-labelMargin', true);
        Harness.setComponentProperty('labelWidth', 30, 20, () => {
          Harness.setComponentProperty('labelMargin', 3, 5, preview => {
            expect(!!preview.match(/label.*style=".*float: left; width: 20%; margin-right: 5%;.*input/)).toBe(true);
            Harness.setComponentProperty('labelPosition', 'left-left', 'right-right', preview => {
              expect(!!preview.match(/label.*style=".*float: right; width: 20%; margin-left: 5%; text-align: right;.*input/)).toBe(true);
              Harness.testVisibility(builder.editForm, '.formio-component-labelWidth', true);
              Harness.testVisibility(builder.editForm, '.formio-component-labelMargin', true);
              done();
            });
          });
        });
      });
    });
  });

  it('Should allow you to set the input mask', done => {
    Harness.testBuilderProperty('inputMask', '', '(999) 999-9999', null, () => {
      expect(builder.preview.inputs[0].placeholder).toBe('(___) ___-____');
      builder.preview.setValue('1234567890');
      expect(builder.preview.inputs[0].value).toBe('(123) 456-7890');
      expect(builder.preview.getValue()).toBe('(123) 456-7890');
      done();
    });
  });

  it('Should set the placeholder of the input', done => {
    const value = 'Enter something here';

    Harness.setComponentProperty('labelPosition', 'right-right', 'top', () => {
      Harness.testBuilderProperty(
        'placeholder',
        '',
        { en: value },
        /input.*name="data\[textField2\].*placeholder="Enter something here"/,
        done,
        value
      );
    });
  });

  it('Should set the description of the input', done => {
    const value = 'This is a description';

    Harness.testBuilderProperty(
      'description',
      '',
      { en: value },
      /input.*div.*class="help-block">This is a description<\/div>/,
      done,
      value
    );
  });

  it('Should set the tooltip of the input', done => {
    const value = 'This is something you should fill out.';

    Harness.testBuilderProperty(
      'tooltip',
      '',
      // 'This is something you should fill out.',
      { en: value },
      /label.*i.*class="glyphicon glyphicon-question-sign text-muted.*<\/label>/,
      () => {
        expect(!!builder.preview.tooltip).toBe(true);
        builder.preview.tooltip.show();
        const toolTipText = builder.preview.element.querySelector('.tooltip-inner');
        expect(toolTipText.innerHTML).toBe(value);
        done();
      },
      value
    );
  });

  it('Should set the prefix of the input', done => {
    Harness.testBuilderProperty(
      'prefix',
      '',
      '$',
      /div class="input-group">.*<div class="input-group-addon input-group-prepend">.*<span class="input-group-text">\$<\/span><\/div>.*input/,
      done
    );
  });

  it('Should set the suffix of the input', done => {
    Harness.testBuilderProperty(
      'suffix',
      '',
      'USD',
      /div class="input-group">.*input.*<div class="input-group-addon input-group-append">.*<span class="input-group-text">USD<\/span><\/div>/,
      done
    );
  });

  it('Should set the custom css class of the input', done => {
    Harness.testBuilderProperty('customClass', '', 'custom-text-field', null, () => {
      expect(!!builder.preview.hasClass(builder.preview.element, 'custom-text-field')).toBe(true);
      done();
    });
  });

  it('Should set the tab index of the input element', done => {
    Harness.testBuilderProperty('tabindex', '', 10, null, () => {
      expect(builder.preview.inputs[0].tabIndex).toBe(10);
      done();
    });
  });

  it('Should allow you to set the multiple flag', done => {
    Harness.testBuilderProperty('multiple', false, true, null, () => {
      done();
    });
  });
});
