import moment from 'moment';

import * as Util from '../util';

function check(data, functionName) {
  data.forEach(item => {
    it(item.title, () => {
      const isValid = Util[functionName](...item.input);

      expect(isValid).toEqual(item.output);
    });
  });
}

describe('Util helpers', () => {
  describe('Method getTextByLocale', () => {
    describe('Object with needed locale', () => {
      const data = [
        {
          title: '(ru) Заголовок',
          input: [{ en: 'Title', ru: 'Заголовок' }, 'ru'],
          output: 'Заголовок'
        },
        {
          title: '(en) Title',
          input: [{ en: 'Title', ru: 'Заголовок' }, 'en'],
          output: 'Title'
        }
      ];

      check(data, 'getTextByLocale');
    });

    describe('Object without needed locale, but with "en" locale', () => {
      const data = [
        {
          title: '(fr) Title',
          input: [{ en: 'Title', ru: 'Заголовок' }, 'fr'],
          output: 'Title'
        },
        {
          title: '(by) Title',
          input: [{ en: 'Title', ru: 'Заголовок' }, 'by'],
          output: 'Title'
        }
      ];

      check(data, 'getTextByLocale');
    });

    describe('Object with only "ru" locale', () => {
      const data = [
        {
          title: '(fr) Заголовок',
          input: [{ ru: 'Заголовок' }, 'fr'],
          output: 'Заголовок'
        },
        {
          title: '(en) Заголовок',
          input: [{ ru: 'Заголовок' }, 'en'],
          output: 'Заголовок'
        }
      ];

      check(data, 'getTextByLocale');
    });

    describe('String data', () => {
      const data = [
        {
          title: 'Заголовок',
          input: ['Заголовок'],
          output: 'Заголовок'
        },
        {
          title: 'Title',
          input: ['Title'],
          output: 'Title'
        }
      ];

      check(data, 'getTextByLocale');
    });

    describe('Array of objects', () => {
      const data = [
        {
          title: '(ru) [ "Заголовок", "Имя" ]',
          input: [[{ ru: 'Заголовок', en: 'Title' }, { ru: 'Имя', en: 'Name' }], 'ru'],
          output: ['Заголовок', 'Имя']
        },
        {
          title: '(en) [ "Title", "Name" ]',
          input: [[{ ru: 'Заголовок', en: 'Title' }, { ru: 'Имя', en: 'Name' }], 'en'],
          output: ['Title', 'Name']
        }
      ];

      check(data, 'getTextByLocale');
    });

    describe('Array of string', () => {
      const data = [
        {
          title: '[ "Title", "Имя" ]',
          input: [['Title', 'Имя']],
          output: ['Title', 'Имя']
        }
      ];

      check(data, 'getTextByLocale');
    });

    describe('Array of mixed data', () => {
      const data = [
        {
          title: '(ru) [ "Заголовок", "Title", "Имя", "", [ "ID", "Les données", "" ] ]',
          input: [[{ ru: 'Заголовок', en: 'Title' }, 'Title', 'Имя', null, [{ en: 'ID' }, { fr: 'Les données' }, undefined]], 'ru'],
          output: ['Заголовок', 'Title', 'Имя', '', ['ID', 'Les données', '']]
        }
      ];

      check(data, 'getTextByLocale');
    });
  });

  describe('function isExistValue', () => {
    const data = [
      {
        input: [undefined],
        output: false
      },
      {
        input: [null],
        output: false
      },
      {
        input: [false],
        output: true
      },
      {
        input: [0],
        output: true
      },
      {
        input: [''],
        output: true
      }
    ];
    data.forEach(_ => {
      _.title = `${_.input[0]} > ${_.output}`;
    });

    check(data, 'isExistValue');
  });

  describe('fun hasInString', () => {
    const data = [
      {
        input: ['there is data here', 'data'],
        output: true
      },
      {
        input: ['there is not data here', 'text'],
        output: false
      }
    ];

    data.forEach(_ => {
      _.title = `${_.input[0]}`;
    });

    check(data, 'hasInString');
  });

  describe.each([
    ['empty id', true, 'true'],
    ['clean id begins number', '123qwerty', 'tooltip-123qwerty'],
    ['clean id begins str', 'id123qwerty', 'id123qwerty'],
    ['dirty id begins number', '8- 4 5-6*/qwerty', 'tooltip-8-45-6qwerty'],
    ['dirty id begins str', '- 4 5-6*/qwerty', '-45-6qwerty']
  ])('fun prepareTooltipId %s', (title, input, output) => {
    it(input + '>' + output, () => expect(Util.prepareTooltipId(input)).toEqual(output));
  });

  describe.each([
    ['123 qwerty', 'prefix', '123-qwerty-prefix'],
    ['2Aw3zA A14s14 F51f35A', undefined, '2aw3za-a14s14-f51f35a'],
    ['id123qwerty', '8- 4 5-6*/qwerty', 'id123qwerty-8-4-5-6-qwerty']
  ])('function getHtmlIdByUid', (id, prefix, output) => {
    it(`getHtmlIdByUid: ${id}`, () => expect(Util.getHtmlIdByUid(id, prefix)).toEqual(output));
  });

  describe('function reverseString', () => {
    const data = [
      {
        title: 'Input string value',
        input: ['test'],
        output: 'tset'
      },
      {
        title: 'Without input parameter',
        input: [],
        output: ''
      },
      {
        title: 'Input not string value',
        input: [5],
        output: 5
      }
    ];

    check(data, 'reverseString');
  });

  describe('function getCodesSumOfString', () => {
    const data = [
      {
        title: 'Without arguments',
        input: [],
        output: 0
      },
      {
        title: 'Argument - number (converting number to string)',
        input: [123],
        output: 150
      },
      {
        title: 'Argument - object 9converting object to string -> [object Object]',
        input: [{}],
        output: 1446
      },
      {
        title: 'Argument - string',
        input: ['type'],
        output: 450
      }
    ];

    check(data, 'getCodesSumOfString');
  });

  describe('function getColorByString', () => {
    const data = [
      {
        title: 'Without arguments - will generate black color',
        input: [],
        output: '#000000'
      },
      {
        title: 'Argument - number',
        input: [123],
        output: '#12e12e'
      },
      {
        title: 'Argument - string',
        input: ['type'],
        output: '#375375'
      },
      {
        title: 'Argument - object',
        input: [{}],
        output: '#b4eb4e'
      },
      {
        title: 'Argument - null',
        input: [null],
        output: '#374374'
      }
    ];

    check(data, 'getColorByString');
  });

  describe.each([
    ['str undefined', undefined, 1, 0, '1', undefined],
    ['first symbol changes', 'string', 0, 1, 'S', 'String'],
    ['add prefix', 'string', 0, 0, 'prefix_', 'prefix_string'],
    ['empty str s0', '', 0, 0, 'begin', 'begin'],
    ['empty str s2', '', 2, 0, 'new', 'new'],
    ['obj', {}, 0, 0, 'prefix_', {}]
  ])('fun strSplice %s', (title, input, start, del, str, output) => {
    it(input + '>' + output, () => expect(Util.strSplice(input, start, del, str)).toEqual(output));
  });

  describe('function isJsonObjectString', () => {
    const data = [
      {
        title: 'Without arguments - will returned false',
        input: [],
        output: false
      },
      {
        title: 'Failed json - will returned false',
        input: ['simple string'],
        output: false
      },
      {
        title: 'In json non-object value - will returned false',
        input: ['true'],
        output: false
      },
      {
        title: 'In json valid value - will returned true',
        input: ['{"key": "username", "value": "qwerty123"}'],
        output: true
      }
    ];

    check(data, 'isJsonObjectString');
  });

  describe('function normalize', () => {
    const data = [
      {
        title: 'Without arguments - will return empty array',
        input: [],
        output: []
      },
      {
        title: 'Array of numbers as input',
        input: [[1, 23, 44, 99999]],
        output: [16.75, 23, 44, 50.25]
      },
      {
        title: 'Array of objects as input, without field name for value - will return the original array',
        input: [
          [
            { id: 'q', value: 12 },
            { id: 'w', value: 468 },
            { id: 'e', value: 126 },
            { id: 'r', value: 3 },
            { id: 't', value: 999999 },
            { id: 'y', value: 777 }
          ]
        ],
        output: [
          { id: 'q', value: 12 },
          { id: 'w', value: 468 },
          { id: 'e', value: 126 },
          { id: 'r', value: 3 },
          { id: 't', value: 999999 },
          { id: 'y', value: 777 }
        ]
      },
      {
        title: 'Array of objects as input, with field name for value',
        input: [
          [
            { id: 'q', value: 12 },
            { id: 'w', value: 468 },
            { id: 'e', value: 126 },
            { id: 'r', value: 3 },
            { id: 't', value: 999999 },
            { id: 'y', value: 777 }
          ],
          'value'
        ],
        output: [
          { id: 'q', value: 148.5 },
          { id: 'w', value: 445.5 },
          { id: 'e', value: 148.5 },
          { id: 'r', value: 148.5 },
          { id: 't', value: 445.5 },
          { id: 'y', value: 445.5 }
        ]
      }
    ];

    check(data, 'normalize');
  });

  describe('function getMedian', () => {
    const data = [
      {
        title: 'Without arguments - will return 0',
        input: [],
        output: 0
      },
      {
        title: 'Array with one item - will return a single element',
        input: [[16]],
        output: 16
      },
      {
        title: 'Array with many numbers',
        input: [[16, 38, 999, 492, 19377182, 0, 34]],
        output: 38
      },
      {
        title: 'Array with many numbers (positive and negative)',
        input: [[16, 38, -999, 492, 19377182, 0, 34, -234234, 2234, -2331211233, 0.45]],
        output: 16
      }
    ];

    check(data, 'getMedian');
  });

  describe('function getMonthPeriodByDate', () => {
    const currentDate = parseInt(moment().format('MMDD'));
    const data = [
      {
        title: 'Valid date with a month greater than 9',
        input: [moment('11.11', 'DD.MM').toDate()],
        output: {
          start: 1111,
          end: 1211
        }
      },
      {
        title: 'Valid date with month less than 10',
        input: [moment('05.02', 'DD.MM').toDate()],
        output: {
          start: 205,
          end: 305
        }
      },
      {
        title: 'If there is no argument, the current date is used',
        input: [],
        output: {
          start: currentDate,
          end: currentDate + 100
        }
      },
      {
        title: 'If the date in the argument is not valid, the current date is used',
        input: [moment('00.00', 'DD.MM').toDate()],
        output: {
          start: currentDate,
          end: currentDate + 100
        }
      },
      {
        title: 'If the argument is a number, the current date is used',
        input: [23],
        output: {
          start: currentDate,
          end: currentDate + 100
        }
      },
      {
        title: 'If the argument is a string, the current date is used',
        input: ['12.05'],
        output: {
          start: currentDate,
          end: currentDate + 100
        }
      }
    ];

    check(data, 'getMonthPeriodByDate');
  });

  describe('function camelize', () => {
    const data = [
      {
        title: 'Without arguments - returns an empty string',
        input: [''],
        output: ''
      },
      {
        title: 'With a hyphenated string, it will return to camelCase',
        input: ['test-test'],
        output: 'testTest'
      },
      {
        title: 'With an argument in a string with many hyphens, it will return everything to camelCase',
        input: ['test-test-test-test'],
        output: 'testTestTestTest'
      },
      {
        title: 'If the argument is not a string, it will return this argument in its original form',
        input: [1],
        output: 1
      },
      {
        title: 'If the argument is not a string, it will return this argument in its original form',
        input: [{ test: 'test' }],
        output: { test: 'test' }
      }
    ];

    check(data, 'camelize');
  });

  describe('function permute', () => {
    const data = [
      {
        title: 'Without arguments - returns an empty list in the list',
        input: [[]],
        output: [[]]
      },
      {
        title: 'With one argument - returns a list of one item in the list',
        input: [[1]],
        output: [[1]]
      },
      {
        title: 'With one argument (string) - returns a list of one item in the list',
        input: [['a']],
        output: [['a']]
      },
      {
        title: 'With two arguments - returns two different options as lists inside the list',
        input: [[1, 2]],
        output: [[1, 2], [2, 1]]
      },
      {
        title: 'With two arguments (strings) - returns two different parameters as a list within a list',
        input: [['a', 'b']],
        output: [['a', 'b'], ['b', 'a']]
      }
    ];

    check(data, 'permute');
  });
});
