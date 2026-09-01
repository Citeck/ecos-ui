import ecosFetch from '@/helpers/ecosFetch';

import TransformAction from '../TransformAction';

jest.mock('@/helpers/ecosFetch');

describe('TransformAction', () => {
  const action = new TransformAction();
  let clickedHrefs;
  let clickSpy;

  beforeEach(() => {
    clickedHrefs = [];
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clickedHrefs.push(this.getAttribute('href'));
    });
    ecosFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'emodel/temp-file@transformed' })
    });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('the link to the transformed file asks for an attachment', async () => {
    const result = await action.execForRecord({ id: 'emodel/some-type@rec' }, { config: {} });

    expect(result).toEqual(false);
    expect(clickedHrefs).toEqual(['/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@transformed&download=true']);
  });

  it('nothing is clicked when the transformation result is returned to the caller', async () => {
    const result = await action.execForRecord({ id: 'emodel/some-type@rec' }, { config: { output: { type: 'content', config: {} } } });

    expect(result).toEqual({ result: 'emodel/temp-file@transformed' });
    expect(clickedHrefs).toEqual([]);
  });
});
