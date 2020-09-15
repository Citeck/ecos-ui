export default {
  source: {
    type: 'ajax',
    ajax: {
      method: 'POST',
      url: 'someUrl',
      data: {
        foo: 1,
        bar: 2
      },
      mapping: ''
    }
  },
  fetchUrl: 'someUrl',
  response: 'Great success!'
};
