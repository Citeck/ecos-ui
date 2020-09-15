export default {
  source: {
    type: 'custom',
    custom: {
      syncData: `value = 5`,
      asyncData: `value = data * 2;`
    }
  },
  result: 10
};
