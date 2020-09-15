import * as Util from '../util';

function check(data, nameFun) {
  data.forEach(item => {
    it(item.title, () => {
      const isValid = Util[nameFun](...item.input);

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
});
