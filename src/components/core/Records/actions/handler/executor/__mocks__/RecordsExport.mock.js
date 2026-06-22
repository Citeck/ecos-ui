import get from 'lodash/get';
import last from 'lodash/last';

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);
  const record = get(body, 'records[0]', '');
  const type = get(body, 'params.type', '');
  let data;

  switch (true) {
    case type.endsWith('bad') && url.endsWith('group-action'):
      data = { type, data: { results: [] } };
      break;
    case type.endsWith('link') && url.endsWith('group-action'):
      data = { type, data: { url: 'url' } };
      break;
    case type.endsWith('one_results') && url.endsWith('group-action'):
      data = { type: type.replace('one_', ''), data: { results: [1] } };
      break;
    case type.endsWith('results') && url.endsWith('group-action'):
      data = { type, data: { results: [1, 2, 3] } };
      break;
    default:
      data = getResponse(record);
      break;
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ ...data })
  });
});

function getResponse(record) {
  const type = last(record.split('-'));

  let attributes;
  switch (type) {
    case 'action':
    case 'no_config':
      attributes = {};
      break;
    case 'no_handler':
      attributes = {
        '?json': {
          config: {}
        }
      };
      break;
    default:
      attributes = getAttrByType(type);
      break;
  }

  return {
    records: [
      {
        id: record,
        attributes
      }
    ]
  };
}

function getAttrByType(type) {
  return {
    '?json': {
      config: { params: { type } },
      type: 'server-group-action'
    }
  };
}
