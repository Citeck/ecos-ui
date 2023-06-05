import { convertAttributeValues } from '../util';

describe('Function convertAttributeValues', () => {
  const columns = [
    { text: 'Количество', type: 'int', attribute: 'quantity' },
    { text: 'Стоимость', type: 'float', attribute: 'cost' },
    { text: 'Идентификатор', type: 'text', attribute: 'id' },
    { text: 'Да/Нет', type: 'boolean', attribute: 'accepted' }
  ];

  const [INT, FLOAT, TEXT, BOOL] = columns;

  const data = [
    {
      title: `${INT.type} ${INT.text} simple`,
      input: {
        att: INT.attribute,
        val: '123'
      },
      output: {
        att: INT.attribute,
        val: 123
      },
      expectedJsType: 'number'
    },
    {
      title: `${INT.type} ${INT.text} from float`,
      input: {
        att: INT.attribute,
        val: '123.3333'
      },
      output: {
        att: INT.attribute,
        val: 123
      },
      expectedJsType: 'number'
    },
    {
      title: `${FLOAT.type} ${FLOAT.text}`,
      input: {
        att: FLOAT.attribute,
        val: '123.5'
      },
      output: {
        att: FLOAT.attribute,
        val: 123.5
      },
      expectedJsType: 'number'
    },
    {
      title: `${TEXT.type} ${TEXT.text}`,
      input: {
        att: TEXT.attribute,
        val: null
      },
      output: { att: TEXT.attribute, val: '' },
      expectedJsType: 'string'
    },
    {
      title: `${BOOL.type} ${BOOL.text}`,
      input: {
        att: BOOL.attribute,
        val: 'ye'
      },
      output: {
        att: BOOL.attribute,
        val: true
      },
      expectedJsType: 'boolean'
    },
    {
      title: `${BOOL.type} ${BOOL.text}`,
      input: {
        att: BOOL.attribute,
        val: 'n'
      },
      output: {
        att: BOOL.attribute,
        val: false
      },
      expectedJsType: 'boolean'
    },
    {
      title: `${BOOL.type} ${BOOL.text} strict - full str`,
      input: {
        att: BOOL.attribute,
        val: 'true'
      },
      output: {
        att: BOOL.attribute,
        val: true
      },
      expectedJsType: 'boolean'
    },
    {
      title: `${BOOL.type} ${BOOL.text} strict - non-full str`,
      input: {
        att: BOOL.attribute,
        val: 'tr'
      },
      output: {
        att: BOOL.attribute,
        val: null
      },
      expectedJsType: 'object'
    },
    {
      title: 'Big case - any values',
      input: {
        val: [
          {
            att: BOOL.attribute,
            val: 'tr'
          },
          {
            val: [
              {
                att: BOOL.attribute,
                val: 'no'
              },
              {
                att: INT.attribute,
                val: '15'
              },
              {
                att: FLOAT.attribute,
                val: '15.33'
              },
              {
                att: TEXT.attribute,
                val: 'text'
              }
            ]
          }
        ]
      },
      output: {
        val: [
          {
            val: [
              {
                att: BOOL.attribute,
                val: false
              },
              {
                att: INT.attribute,
                val: 15
              },
              {
                att: FLOAT.attribute,
                val: 15.33
              },
              {
                att: TEXT.attribute,
                val: 'text'
              }
            ]
          }
        ]
      }
    },
    {
      title: 'Big case - invalid values',
      input: {
        val: [
          {
            att: INT.attribute,
            val: 'test'
          },
          {
            att: FLOAT.attribute,
            val: 'test'
          },
          {
            att: BOOL.attribute,
            val: 'qweqweqweqwe'
          }
        ]
      },
      output: {
        val: []
      }
    }
  ];

  data.forEach(async item => {
    it(item.title, async () => {
      const result = convertAttributeValues(item.input, columns);
      expect(result).toEqual(item.output);
      item.expectedJsType && expect(item.expectedJsType).toEqual(typeof item.output.val);
    });
  });
});
