import { getTextByLocale, isExistValue } from '../util';

function check(data) {
  data.forEach(item => {
    it(item.title, () => {
      const isValid = getTextByLocale(...item.input);

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

      check(data);
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

      check(data);
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

      check(data);
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

      check(data);
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

      check(data);
    });

    describe('Array of string', () => {
      const data = [
        {
          title: '[ "Title", "Имя" ]',
          input: [['Title', 'Имя']],
          output: ['Title', 'Имя']
        }
      ];

      check(data);
    });

    describe('Array of mixed data', () => {
      const data = [
        {
          title: '(ru) [ "Заголовок", "Title", "Имя", "", [ "ID", "Les données", "" ] ]',
          input: [[{ ru: 'Заголовок', en: 'Title' }, 'Title', 'Имя', null, [{ en: 'ID' }, { fr: 'Les données' }, undefined]], 'ru'],
          output: ['Заголовок', 'Title', 'Имя', '', ['ID', 'Les données', '']]
        }
      ];

      check(data);
    });
  });

  describe('function isExistValue', () => {
    it('check value', () => {
      expect(isExistValue(undefined)).toEqual(false);
      expect(isExistValue(null)).toEqual(false);
      expect(isExistValue(false)).toEqual(true);
      expect(isExistValue(0)).toEqual(true);
      expect(isExistValue('')).toEqual(true);
    });
  });
});
