import get from 'lodash/get';
import last from 'lodash/last';

// A bare content url, without any disposition of its own: the shape a group action which builds
// the link by hand hands out.
export const CONTENT_URL = '/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@report';

// What EcosContentService#getDownloadUrl hands out for a report file: the attachment disposition
// is already spelled out in the url.
export const CONTENT_DOWNLOAD_URL = `${CONTENT_URL}&download=true`;

// A link to an endpoint of its own, whose query string is signed: the shape a group action
// configured against an object storage hands out.
export const FOREIGN_URL = 'https://s3.example.com/reports/report.xlsx?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123';

jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
  const body = JSON.parse(request.body);
  const record = get(body, 'records[0]', '');
  const type = get(body, 'params.type', '');
  let data;

  switch (true) {
    case type.endsWith('bad') && url.endsWith('group-action'):
      data = { type, data: { results: [] } };
      break;
    case type.endsWith('content_link_download_true') && url.endsWith('group-action'):
      data = { type: 'link', data: { url: CONTENT_DOWNLOAD_URL } };
      break;
    case type.endsWith('foreign_link') && url.endsWith('group-action'):
      data = { type: 'link', data: { url: FOREIGN_URL } };
      break;
    // Must precede the plain 'link' case: 'content_link'.endsWith('link') is true as well.
    case type.endsWith('content_link') && url.endsWith('group-action'):
      data = { type: 'link', data: { url: CONTENT_URL } };
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
