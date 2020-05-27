import { passwordValidator } from '../index';
import { BaseRules } from '../password';

function check(data) {
  data.forEach(item => {
    it(item.title, () => {
      const isValid = passwordValidator(...item.input);

      expect(isValid).toEqual(item.output);
    });
  });
}

describe('Validators helper', () => {
  describe('Method passwordValidator', () => {
    describe('Base validator rules', () => {
      const data = [
        {
          title: 'Aaa1 - valid value',
          input: ['Aaa1'],
          output: true
        },
        {
          title: 'password_123 - not valid value',
          input: ['password_123'],
          output: false
        },
        {
          title: 'Empty password - not valid',
          input: [''],
          output: false
        },
        {
          title: 'Number 123 - not valid',
          input: [123],
          output: false
        }
      ];

      check(data);
    });

    describe('Only custom validator rules (without functions)', () => {
      const data = [
        {
          title: 'min 10 numbers, 2 capital characters (1234567890_AA - valid value)',
          input: ['1234567890_AA', { num: 10, capital: 2 }],
          output: true
        },
        {
          title: 'min 10 numbers, 2 capital characters (1234567890_Aaaa - not valid value)',
          input: ['1234567890_Aaaa', { num: 10, capital: 2 }],
          output: false
        }
      ];

      check(data);
    });

    describe('Only custom validator rules (with functions)', () => {
      const data = [
        {
          title: 'Min length 7 characters (qwerty5 - valid value)',
          input: ['qwerty5', { minLength: word => word.length >= 7 }],
          output: true
        },
        {
          title: 'Min length 7 characters (123 - not valid value)',
          input: ['123', { minLength: word => word.length >= 7 }],
          output: false
        },
        {
          title: '4..10 characters (password_1 - valid value)',
          input: ['password_1', { minLength: word => word.length >= 4, maxLength: word => word.length <= 10 }],
          output: true
        },
        {
          title: '4..10 characters (password_1223 - not valid value)',
          input: ['password_1223', { minLength: word => word.length >= 4, maxLength: word => word.length <= 10 }],
          output: false
        }
      ];

      check(data);
    });

    describe('Custom validator rules combined with base rules', () => {
      const data = [
        {
          title: 'BaseRules + max length 10 characters (Password12 - valid value)',
          input: ['Password12', { ...BaseRules, maxLength: word => word.length <= 10 }],
          output: true
        },
        {
          title: 'BaseRules + max length 10 characters (Password_super12 - not valid value)',
          input: ['Password_super12', { ...BaseRules, maxLength: word => word.length <= 10 }],
          output: false
        },
        {
          title: 'BaseRules + redefinition min to 5 characters (Password_super12 - valid value)',
          input: ['Password_super12', { ...BaseRules, min: 5 }],
          output: true
        },
        {
          title: 'BaseRules + redefinition min to 5 characters (Pas1 - not valid value)',
          input: ['Pas1', { ...BaseRules, min: 5 }],
          output: false
        }
      ];

      check(data);
    });
  });
});
