import DownloadAction from '../DownloadAction';

describe('DownloadAction url', () => {
  let downloadSpy;

  const record = { id: 'emodel/doc@1' };

  const exec = async config => {
    await new DownloadAction().execForRecord(record, { config });

    return downloadSpy.mock.calls[0][0];
  };

  beforeEach(() => {
    downloadSpy = jest.spyOn(DownloadAction, '_downloadDataStr').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('asks the ecos content endpoint for an attachment when no url is configured', async () => {
    const url = await exec({});

    expect(url).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&download=true');
    expect(url.match(/download=/g)).toHaveLength(1);
  });

  it('asks for an attachment on a configured url built from the record ref placeholder', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    const url = await exec({ url: '/gateway/emodel/api/ecos/webapp/content?ref=${recordRef}' });

    expect(url).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&download=true');
  });

  it('overrides the inline disposition of a configured url', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    const url = await exec({ url: '/gateway/emodel/api/ecos/webapp/content?ref=${recordRef}&download=false' });

    expect(url).toEqual('/gateway/emodel/api/ecos/webapp/content?ref=emodel/doc@1&download=true');
    expect(url.match(/download=/g)).toHaveLength(1);
  });

  it('keeps a configured url of another endpoint as is', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    const url = await exec({ url: 'https://storage.example.com/files/${recordRef}?a=true' });

    expect(url).toEqual('https://storage.example.com/files/emodel/doc@1?a=true');
    expect(url).not.toContain('download=');
  });

  it('keeps the legacy print service url of an alfresco record as is', async () => {
    await new DownloadAction().execForRecord({ id: 'workspace://SpacesStore/1234' }, { config: {} });

    const url = downloadSpy.mock.calls[0][0];

    expect(url).toContain('citeck/print/content?nodeRef=workspace://SpacesStore/1234');
    expect(url).not.toContain('download=');
  });

  it('opens the link in a new tab with the file name as the download attribute', async () => {
    await new DownloadAction().execForRecord(record, { config: { fileName: 'report.pdf' } });

    expect(downloadSpy).toHaveBeenCalledWith(expect.any(String), 'report.pdf', { target: '_blank' });
  });
});
