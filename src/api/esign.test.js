import esign from './esign';
import getCadespluginAPI from '@/services/asyncCadesPlugin';
import ConfigService from '@/services/config/ConfigService';
import Records from '@citeck/records-core';
import NotificationManager from '@/services/notifications/NotificationManager';

jest.mock('@/services/asyncCadesPlugin', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/services/config/ConfigService', () => ({
  __esModule: true,
  default: { getValue: jest.fn() },
  ALFRESCO_ENABLED: 'alfresco-enabled',
  ESIGN_DEV_MODE: 'app/edi$esign-dev-mode'
}));
jest.mock('@citeck/records-core', () => ({ __esModule: true, default: { query: jest.fn(), get: jest.fn() } }));
jest.mock('@/helpers/util', () => ({ t: value => value }));
jest.mock('@/services/notifications/NotificationManager', () => ({ __esModule: true, default: { warning: jest.fn() } }));

describe('esign plugin selection and ordinary server signing path', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    jest.clearAllMocks();
    esign.cadespluginApi = null;
    getCadespluginAPI.mockResolvedValue(null);
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it.each([undefined, {}, { mode: 'off' }, { mode: 'unknown' }])('keeps native signing for config %p', async config => {
    const native = { getValidCertificates: jest.fn() };
    ConfigService.getValue.mockResolvedValue(config);
    getCadespluginAPI.mockResolvedValue(native);
    expect(await esign.getCadespluginApi()).toBe(native);
    expect(NotificationManager.warning).not.toHaveBeenCalled();
  });

  it('uses the configured remote certificate and CMS while retaining digest and signature upload', async () => {
    ConfigService.getValue.mockResolvedValue({ mode: 'remote', url: '/gateway/edi-sim/admin/api' });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'signer', subjectCN: 'Test signer', notBefore: '2020-01-01', notAfter: '2099-01-01' }]
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ signature: 'CMS' }) });
    Records.query.mockResolvedValue({ records: [{ attributes: { data: 'CONTENT' } }] });
    const record = { att: jest.fn(), save: jest.fn().mockResolvedValue({ success: true }) };
    Records.get.mockReturnValue(record);
    const plugin = await esign.getCadespluginApi();
    expect(plugin.mode).toBe('remote');
    expect(getCadespluginAPI).not.toHaveBeenCalled();
    const [cert] = await esign.getCertificates();
    await esign.getDocumentData('emodel/edi-document@doc', '', false);
    const signature = await esign.getSignedDocument(cert.thumbprint, 'CONTENT');
    await esign.sendSignedDocument({ nodeRef: 'emodel/edi-document@doc', signature }, false);
    expect(Records.query).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/gateway/edi-sim/admin/api/certificates/signer/sign',
      expect.objectContaining({ body: JSON.stringify({ content: 'CONTENT' }) })
    );
    expect(record.att).toHaveBeenCalledWith('_self', expect.objectContaining({ signature: 'CMS' }));
    expect(record.save).toHaveBeenCalledWith('?json');
    await esign.getCadespluginApi();
    expect(NotificationManager.warning).toHaveBeenCalledTimes(1);
  });

  it('keeps an unavailable native plugin as a refusal', async () => {
    ConfigService.getValue.mockResolvedValue({ mode: 'off' });
    await expect(esign.getCadespluginApi()).rejects.toThrow();
  });
});
