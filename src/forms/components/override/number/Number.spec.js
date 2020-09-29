import _ from 'lodash';

import Harness from '../../../test/harness';
import NumberComponent from './Number';

import { comp1, comp2, comp3, comp4 } from './fixtures';

describe('Number Component', () => {
  it('Should build an number component', done => {
    Harness.testCreate(NumberComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 1);
      done();
    });
  });

  it('Should format numbers for USA locale', done => {
    /* eslint-disable max-statements */
    Harness.testCreate(NumberComponent, comp2, { language: 'en-US' }).then(component => {
      Harness.testSetInput(component, null, '', '');
      Harness.testSetInput(component, undefined, '', '');
      Harness.testSetInput(component, '', '', '');
      Harness.testSetInput(component, {}, '', '');
      Harness.testSetInput(component, [], '', '');
      Harness.testSetInput(component, [''], '', '');
      Harness.testSetInput(component, ['1'], 1, '1');
      Harness.testSetInput(component, 0, 0, '0');
      Harness.testSetInput(component, 1, 1, '1');
      Harness.testSetInput(component, -1, -1, '-1');
      Harness.testSetInput(component, 1000, 1000, '1,000');
      Harness.testSetInput(component, -1000, -1000, '-1,000');
      Harness.testSetInput(component, 1000.0, 1000, '1,000');
      Harness.testSetInput(component, -1000.0, -1000, '-1,000');
      Harness.testSetInput(component, 1000.01, 1000.01, '1,000.01');
      Harness.testSetInput(component, -1000.01, -1000.01, '-1,000.01');
      Harness.testSetInput(component, 1000.001, 1000.001, '1,000.001');
      Harness.testSetInput(component, -1000.001, -1000.001, '-1,000.001');
      Harness.testSetInput(component, 1234567890.12, 1234567890.12, '1,234,567,890.12');
      Harness.testSetInput(component, -1234567890.12, -1234567890.12, '-1,234,567,890.12');
      Harness.testSetInput(component, 12.123456789, 12.123456789, '12.123456789');
      Harness.testSetInput(component, -12.123456789, -12.123456789, '-12.123456789');
      // These tests run into the maximum number of significant digits for floats.
      Harness.testSetInput(component, 123456789.123456789, 123456789.123456789, '123,456,789.12345679');
      Harness.testSetInput(component, -123456789.123456789, -123456789.123456789, '-123,456,789.12345679');
      Harness.testSetInput(component, '0', 0, '0');
      Harness.testSetInput(component, '1', 1, '1');
      Harness.testSetInput(component, '-1', -1, '-1');
      Harness.testSetInput(component, '1000', 1000, '1,000');
      Harness.testSetInput(component, '-1000', -1000, '-1,000');
      Harness.testSetInput(component, '1000.01', 1000.01, '1,000.01');
      Harness.testSetInput(component, '-1000.01', -1000.01, '-1,000.01');
      Harness.testSetInput(component, '1000.00', 1000, '1,000');
      Harness.testSetInput(component, '-1000.00', -1000, '-1,000');
      Harness.testSetInput(component, '1000.001', 1000.001, '1,000.001');
      Harness.testSetInput(component, '-1000.001', -1000.001, '-1,000.001');
      Harness.testSetInput(component, '1234567890.12', 1234567890.12, '1,234,567,890.12');
      Harness.testSetInput(component, '-1234567890.12', -1234567890.12, '-1,234,567,890.12');
      Harness.testSetInput(component, '12.123456789', 12.123456789, '12.123456789');
      Harness.testSetInput(component, '-12.123456789', -12.123456789, '-12.123456789');
      Harness.testSetInput(component, '123456789.123456789', 123456789.123456789, '123,456,789.12345679');
      Harness.testSetInput(component, '-123456789.123456789', -123456789.123456789, '-123,456,789.12345679');
      done();
    });
    /* eslint-enable max-statements */
  });

  it('Should format numbers for British locale', done => {
    Harness.testCreate(NumberComponent, comp2, { language: 'en-GB' }).then(component => {
      Harness.testSetInput(component, null, '', '');
      Harness.testSetInput(component, 0, 0, '0');
      Harness.testSetInput(component, 1, 1, '1');
      Harness.testSetInput(component, -1, -1, '-1');
      Harness.testSetInput(component, 1000, 1000, '1,000');
      Harness.testSetInput(component, -1000, -1000, '-1,000');
      Harness.testSetInput(component, 1000.0, 1000, '1,000');
      Harness.testSetInput(component, -1000.0, -1000, '-1,000');
      Harness.testSetInput(component, 1000.01, 1000.01, '1,000.01');
      Harness.testSetInput(component, -1000.01, -1000.01, '-1,000.01');
      Harness.testSetInput(component, 1000.001, 1000.001, '1,000.001');
      Harness.testSetInput(component, -1000.001, -1000.001, '-1,000.001');
      Harness.testSetInput(component, 1234567890.12, 1234567890.12, '1,234,567,890.12');
      Harness.testSetInput(component, -1234567890.12, -1234567890.12, '-1,234,567,890.12');
      Harness.testSetInput(component, 12.123456789, 12.123456789, '12.123456789');
      Harness.testSetInput(component, -12.123456789, -12.123456789, '-12.123456789');
      done();
    });
  });

  it('Should display default integer value', done => {
    Harness.testCreate(NumberComponent, comp3).then(number => {
      expect(_.get(number, ['inputs', '0', 'value'])).toBe('42');
      done();
    });
  });

  it('Should display default decimal value', done => {
    const TEST_VAL = 4.2;
    const comp = _.cloneDeep(comp3);

    comp.defaultValue = TEST_VAL;
    comp.decimalLimit = 2;
    comp.requireDecimal = true;

    Harness.testCreate(NumberComponent, comp).then(number => {
      expect(_.get(number, ['inputs', '0', 'value'])).toBe('4.20');
      done();
    });
  });

  it('Should add trailing zeros on blur, if decimal required', done => {
    const comp = _.cloneDeep(comp3);

    comp.decimalLimit = 2;
    comp.requireDecimal = true;
    comp.defaultValue = '';

    Harness.testCreate(NumberComponent, comp).then(number => {
      const testset = [
        // [inv, outv, display]
        ['42', 42, '42.00'],
        ['42.1', 42.1, '42.10'],
        ['42.01', 42.01, '42.01'],
        ['4200', 4200, '4200.00'],
        ['4200.4', 4200.4, '4200.40'],
        ['4200.42', 4200.42, '4200.42'],
        ['4200.', 4200, '4200.00'],
        ['99999999.', 99999999, '99999999.00']
      ];

      testset.forEach((set, index) => {
        try {
          Harness.testNumberBlur(number, ...set);
        } catch (err) {
          done(new Error(`Test case #${index}, set: ${set}, err: ${err.message}`));
        }
      });

      done();
    }, done);
  });

  it('Should add trailing zeros on blur, if decimal and delimiter is required', done => {
    const comp = _.cloneDeep(comp3);

    comp.decimalLimit = 2;
    comp.requireDecimal = true;
    comp.delimiter = true;
    comp.defaultValue = '';

    /* eslint-disable max-statements */
    Harness.testCreate(NumberComponent, comp).then(number => {
      const testset = [
        // [inv, outv, display]
        ['42', 42, '42.00'],
        ['42.1', 42.1, '42.10'],
        ['42.01', 42.01, '42.01'],
        ['4200', 4200, '4,200.00'],
        ['4200.4', 4200.4, '4,200.40'],
        ['4200.42', 4200.42, '4,200.42'],
        ['4200.', 4200, '4,200.00'],
        ['99999999.', 99999999, '99,999,999.00']
      ];

      testset.forEach((set, index) => {
        try {
          Harness.testNumberBlur(number, ...set);
        } catch (err) {
          done(new Error(`Test case #${index}, set: ${set}, err: ${err.message}`));
        }
      });

      done();
    }, done);
  });

  it('Should add trailing zeros on blur with `multiple` flag', done => {
    Harness.testCreate(NumberComponent, comp4).then(number => {
      const testset = [
        ['42', 42, '42.00'],
        ['42.1', 42.1, '42.10'],
        ['42.01', 42.01, '42.01'],
        ['4200', 4200, '4,200.00'],
        ['4200.4', 4200.4, '4,200.40'],
        ['4200.42', 4200.42, '4,200.42'],
        ['4200.', 4200, '4,200.00'],
        ['99999999.', 99999999, '99,999,999.00']
      ];

      testset.forEach((set, index) => {
        try {
          expect(number.inputs.length).toBe(index + 1);
          Harness.testNumberBlur(number, ...set, index);
          number.addValue();
        } catch (err) {
          done(new Error(`Test case #${index}, set: ${set}, err: ${err.message}`));
        }
      });

      done();
    }, done);
  });

  it('"Big number" settings disabled, but input big number (with decimal and delimiter settings)', done => {
    const comp = _.cloneDeep(comp3);

    comp.decimalLimit = 2;
    comp.requireDecimal = true;
    comp.delimiter = true;
    comp.isBigNumber = false;

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, '3333333333333333313331', 3.3333333333333335e21, '3,333,333,333,333,333,500,000.00');
      Harness.testSetInput(component, 222222222222222222, 222222222222222200, '222,222,222,222,222,200.00');
      Harness.testSetInput(component, '1234578902345678901234567890', 1.234578902345679e27, '1,234,578,902,345,679,000,000,000,000.00');
      done();
    });
  });

  it('"Big number" settings disabled, but input big number', done => {
    const comp = _.cloneDeep(comp3);
    comp.defaultValue = '';
    comp.isBigNumber = false;

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, 111111111111111111111, 111111111111111110000, 111111111111111110000);
      Harness.testSetInput(component, 2.2222222222222223e22, 2.2222222222222223e22, 22222222222222223000000);
      Harness.testSetInput(component, '1234578902345678901234567890', 1.234578902345679e27, '1234578902345679000000000000');
      done();
    });
  });

  it('"Big number" settings enabled (always outputs string value)', done => {
    const comp = _.cloneDeep(comp3);
    comp.defaultValue = '';
    comp.isBigNumber = true;

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER), String(Number.MAX_SAFE_INTEGER));
      Harness.testSetInput(component, -Number.MAX_SAFE_INTEGER, String(-Number.MAX_SAFE_INTEGER), String(-Number.MAX_SAFE_INTEGER));
      Harness.testSetInput(component, '1111111111111111111111111111', '1111111111111111111111111111', '1111111111111111111111111111');
      Harness.testSetInput(component, '-1111111111111111111111111111', '-1111111111111111111111111111', '-1111111111111111111111111111');
      Harness.testSetInput(component, '2222222222222222222222222222', '2222222222222222222222222222', '2222222222222222222222222222');
      Harness.testSetInput(component, 42, '42', '42');
      done();
    });
  });

  it('"Big number" settings enabled with required decimals', done => {
    const comp = _.cloneDeep(comp3);

    comp.defaultValue = '';
    comp.isBigNumber = true;
    comp.decimalLimit = 2;
    comp.requireDecimal = true;

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, '91111111111111111111111111111', '91111111111111111111111111111', '91111111111111111111111111111.00');
      Harness.testSetInput(
        component,
        '-91111111111111111111111111111',
        '-91111111111111111111111111111',
        '-91111111111111111111111111111.00'
      );
      Harness.testSetInput(component, '92222222222222222222222222222', '92222222222222222222222222222', '92222222222222222222222222222.00');
      Harness.testSetInput(component, 942, 942, '942.00');
      done();
    });
  });

  it('"Use Delimeter" settings enabled with delimiter characters (" | ")', done => {
    const comp = _.cloneDeep(comp3);

    comp.defaultValue = '';
    comp.delimiter = true;
    comp.delimiterValue = ' | ';

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, 123, 123, '123');
      Harness.testSetInput(component, 12345678, 12345678, '12 | 345 | 678');
      done();
    });
  });

  it('"Use Delimeter" settings enabled with delimiter characters (",")', done => {
    const comp = _.cloneDeep(comp3);

    comp.defaultValue = '';
    comp.delimiter = true;
    comp.delimiterValue = ',';

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, 123, 123, '123');
      Harness.testSetInput(component, 12345678, 12345678, '12,345,678');
      Harness.testSetInput(component, 12345678.03, 12345678.03, '12,345,678.03');
      done();
    });
  });

  it('"Use Delimeter" settings enabled with delimiter characters ("-[-thousand-]-")', done => {
    const comp = _.cloneDeep(comp3);

    comp.defaultValue = '';
    comp.delimiter = true;
    comp.delimiterValue = '-[-thousand-]-';

    Harness.testCreate(NumberComponent, comp).then(component => {
      Harness.testSetInput(component, 123, 123, '123');
      Harness.testSetInput(component, 12345678, 12345678, '12-[-thousand-]-345-[-thousand-]-678');
      Harness.testSetInput(component, 12345678.03, 12345678.03, '12-[-thousand-]-345-[-thousand-]-678.03');
      done();
    });
  });
});
