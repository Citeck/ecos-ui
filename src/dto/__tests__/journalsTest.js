/**
 * @jest-environment jsdom
 */
import JC from '../journals';
import { PREDICATE_AND, PREDICATE_CONTAINS, PREDICATE_OR } from '../../components/Records/predicates/predicates';

const check = (methodName, data) => {
  data.forEach((test) => {
    it(`should ${test.label}`, () => {
      expect(JC[methodName](...test.input)).toEqual(test.output);
    });
  });
};

describe('JournalsConverter', () => {
  describe('getColumnId', () => {
    const data = [
      {
        label: 'ID is null if column data is empty (not defined or is not object)',
        input: [undefined],
        output: undefined,
      },
      {
        label: 'ID is undefined if attribute & schema & name is not defined',
        input: [{}],
        output: undefined,
      },
      {
        label: 'ID from attribute',
        input: [{ attribute: 'cm:name', name: 'name', schema: 'cm_name' }],
        output: 'cm:name',
      },
      {
        label: 'ID from name',
        input: [{ name: 'name', schema: 'cm_name' }],
        output: 'name',
      },
      {
        label: 'ID from schema',
        input: [{ schema: 'cm_name' }],
        output: 'cm_name',
      },
    ];

    check('getColumnId', data);
  });

  describe('_splitStringByDelimiters', () => {
    const data = [
      {
        label: 'returned array with single item - full string (without backquotes), ignoring delimiters',
        input: ['`full string`', [' ', ',']],
        output: ['full string'],
      },
      {
        label: 'split string by whitespace',
        input: ['some string with multiple words', [' ']],
        output: ['some', 'string', 'with', 'multiple', 'words'],
      },
      {
        label: 'ignore lots of spaces',
        input: ['other         string', [' ']],
        output: ['other', 'string'],
      },
      {
        label: 'split string by multiple delimiters',
        input: ['string, with multiple delimi,ters!', [' ', ',']],
        output: ['string', 'with', 'multiple', 'delimi', 'ters!'],
      },
      {
        label: 'split string by multiple delimiters with support phrases in single quotes',
        input: ["string, with 'mu  ltiple' delimi,ters!", [' ', ',']],
        output: ['string', 'with', "'mu  ltiple'", 'delimi', 'ters!'],
      },
      {
        label: 'split string by multiple delimiters with support phrases in double quotes',
        input: ['string, with "mu  ltiple" delimi,ters!', [' ', ',']],
        output: ['string', 'with', '"mu  ltiple"', 'delimi', 'ters!'],
      },
      {
        label:
          'returns the original value in the array if there is a delimeter, but it is not in the string and there is a phrase in quotes',
        input: ['OOO "MY-COMPANY"', [',']],
        output: ['OOO "MY-COMPANY"'],
      },
      {
        label: 'splits the string if there is a delimiter and a quoted phrase that does not contain any delimiter',
        input: ['OOO "MY-COMPANY"', [',', ' ', '-']],
        output: ['OOO', '"MY-COMPANY"'],
      },
      {
        label: 'ignores all delimiters in a quoted phrase',
        input: ['OOO "MY-COMPANY"', ['-']],
        output: ['OOO "MY-COMPANY"'],
      },
      {
        label: 'split the string at a delimiter that is present in the phrase, but the phrase must remain unchanged',
        input: ['O-OO "MY-COMPANY"', ['-']],
        output: ['O', 'OO "MY-COMPANY"'],
      },
      {
        label: 'split the string by the delimiter, considering that there can be several phrases in quotes in the string',
        input: ['OOO "MY-COMPANY", OOO "Roga and CO"', [',']],
        output: ['OOO "MY-COMPANY"', 'OOO "Roga and CO"'],
      },
      {
        label: 'return an array with an empty string if an empty string is passed',
        input: ['', [',']],
        output: [''],
      },
      {
        label: 'return an array with an empty string if no arguments are passed',
        input: [],
        output: [''],
      },
    ];

    check('_splitStringByDelimiters', data);
  });

  describe('searchConfigProcessed', () => {
    const columns = [
      {
        attribute: 'tk:kind',
        searchConfig: {
          delimiters: [' ', ','],
        },
      },
      {
        attribute: 'cm:name',
        searchConfig: {
          delimiters: [':'],
        },
      },
      {
        attribute: 'note',
      },
    ];
    const getPredicates = (searchString) => ({
      t: PREDICATE_AND,
      val: [
        {
          t: PREDICATE_OR,
          val: [
            { att: 'tk:kind', t: PREDICATE_CONTAINS, val: searchString },
            { att: 'cm:name', t: PREDICATE_CONTAINS, val: searchString },
            { att: 'note', t: PREDICATE_CONTAINS, val: searchString },
          ],
        },
      ],
    });
    const data = [
      {
        label: 'remove extra spaces',
        input: [getPredicates('   a   '), columns],
        output: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_OR,
              val: [
                {
                  t: PREDICATE_CONTAINS,
                  att: 'tk:kind',
                  val: 'a',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'cm:name',
                  val: 'a',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'note',
                  val: 'a',
                },
              ],
            },
          ],
        },
      },
      {
        label: 'phrase in back quotes unchanged if have delimiters',
        input: [getPredicates('`full string`'), columns],
        output: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_OR,
              val: [
                {
                  t: PREDICATE_CONTAINS,
                  att: 'tk:kind',
                  val: 'full string',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'cm:name',
                  val: 'full string',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'note',
                  val: 'full string',
                },
              ],
            },
          ],
        },
      },
      {
        label: 'split search string by whitespace',
        input: [getPredicates('some string'), columns],
        output: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_OR,
              val: [
                {
                  t: PREDICATE_OR,
                  val: [
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'some',
                    },
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'string',
                    },
                  ],
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'cm:name',
                  val: 'some string',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'note',
                  val: 'some string',
                },
              ],
            },
          ],
        },
      },
      {
        label: 'split search string by whitespace and comma',
        input: [getPredicates('string, with multiple delimi,ters!'), columns],
        output: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_OR,
              val: [
                {
                  t: PREDICATE_OR,
                  val: [
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'string',
                    },
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'with',
                    },
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'multiple',
                    },
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'delimi',
                    },
                    {
                      t: PREDICATE_CONTAINS,
                      att: 'tk:kind',
                      val: 'ters!',
                    },
                  ],
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'cm:name',
                  val: 'string, with multiple delimi,ters!',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'note',
                  val: 'string, with multiple delimi,ters!',
                },
              ],
            },
          ],
        },
      },
      {
        label: 'return an empty object if the predicate is empty',
        input: [undefined, columns],
        output: {},
      },
      {
        label: 'return the input predicate if the columns are empty',
        input: [{ t: PREDICATE_CONTAINS, val: 'text' }],
        output: { t: PREDICATE_CONTAINS, val: 'text' },
      },
      {
        label: 'return an empty object if the predicate and columns is empty',
        input: [],
        output: {},
      },
      {
        label: 'phrase in double quotes in the search string',
        input: [getPredicates('OOO "MY-COMPANY"'), columns],
        output: {
          t: PREDICATE_AND,
          val: [
            {
              t: PREDICATE_OR,
              val: [
                {
                  t: PREDICATE_OR,
                  val: [
                    {
                      att: 'tk:kind',
                      t: PREDICATE_CONTAINS,
                      val: 'OOO',
                    },
                    {
                      att: 'tk:kind',
                      t: PREDICATE_CONTAINS,
                      val: '"MY-COMPANY"',
                    },
                  ],
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'cm:name',
                  val: 'OOO "MY-COMPANY"',
                },
                {
                  t: PREDICATE_CONTAINS,
                  att: 'note',
                  val: 'OOO "MY-COMPANY"',
                },
              ],
            },
          ],
        },
      },
    ];

    check('searchConfigProcessed', data);
  });
});
