import assert from 'power-assert';

import Harness from '../harness';

export default {
  title: 'Calculated Fields Test',
  form: {
    components: [
      {
        type: 'textfield',
        label: 'A',
        key: 'a',
        input: true,
        inputType: 'text'
      },
      {
        type: 'textfield',
        label: 'B',
        key: 'b',
        input: true,
        inputType: 'text'
      },
      {
        type: 'textfield',
        label: 'Total',
        key: 'total',
        input: true,
        inputType: 'text',
        disabled: true,
        calculateValue: {
          '+': [{ var: 'data.a' }, { var: 'data.b' }]
        }
      },
      {
        label: 'c',
        type: 'number',
        input: true,
        key: 'c'
      },
      {
        label: 'd',
        type: 'number',
        input: true,
        key: 'd'
      },
      {
        label: 'Total with override',
        type: 'number',
        input: true,
        key: 'totalWithOverride',
        calculateValue: 'value = data.c + data.d;',
        allowCalculateOverride: true
      },
      {
        key: 'hiddenDefault',
        label: 'hidden (default value)',
        type: 'hidden',
        input: true,
        customDefaultValue: 'value = "default value"'
      },
      {
        key: 'hiddenCalculate',
        label: 'hidden (calculate value)',
        type: 'hidden',
        input: true,
        calculateValue: 'value = "calculated value";'
      }
    ]
  },
  tests: {
    'Test calculated fields'(form, done) {
      form.on('change', () => {
        const value = form.getValue();
        assert.equal(value.data.total, '25');

        done();
      });
      Harness.testSetGet(form, {
        data: {
          a: '10',
          b: '15',
          hiddenDefault: 'default value',
          total: ''
        }
      });
    },
    'Test field is initially calculated when allow override is checked'(form, done) {
      form.on('change', () => {
        const value = form.getValue();
        assert.equal(value.data.totalWithOverride, 20);
        done();
      });
      form.setValue({
        data: {
          c: 7,
          d: 13
        }
      });
    },
    'Test Hidden field contains its value in data-object, if defaultValue is set'(form, done) {
      const value = form.getValue();
      assert.equal(value.data.hiddenDefault, 'default value');
      done();
    },
    'Test Hidden field contains its value in data-object, if calculateValue is set'(form, done) {
      form.on('initialized', () => {
        const value = form.getValue();
        assert.equal(value.data.hiddenCalculate, 'calculated value');
        done();
      });
    }
  }
};
