export default {
  source: {
    type: 'ajax',
    ajax: {
      method: 'GET',
      url: 'someUrl',
      data: {
        foo: 1,
        bar: 2
      },
      mapping: `value = data.map(item => item.id)`
    }
  },
  fetchUrl: 'someUrl?foo=1&bar=2',
  response: [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }, { id: 3, name: 'Three' }],
  mapping: [1, 2, 3]
};
