import createDevStubApi from './index';

import EsignComponent from '@/components/domain/Esign/Esign';
import EsignConverter from '@/dto/esign';

jest.mock('@/services/esign', () => ({ Esign: { init: () => new Promise(() => {}) } }));
jest.mock('@/components/domain/Esign/EsignModal', () => () => null);
jest.mock('@/components/common/dialogs/Manager', () => ({}));
jest.mock('@/helpers/util', () => ({ t: value => value, getMLValue: value => value }));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

async function signedCertificate(subject) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: 'remote-cert',
        serialHex: '01',
        subjectCN: 'Test signer',
        subject,
        algorithm: 'gost2012_256',
        notBefore: '2020-01-01',
        notAfter: '2099-01-01'
      }
    ]
  });
  const [raw] = await createDevStubApi({ mode: 'remote', url: '/gateway/edi-sim/admin/api' }).getValidCertificates();
  const selectedCertificate = await EsignConverter.getCertificateForModal(raw);
  const onSigned = jest.fn();
  const component = new EsignComponent({ recordRefs: ['document'], onSigned, onClose: jest.fn() });
  component.state.selectedCertificate = selectedCertificate;
  component.setState = jest.fn();
  component.documentSigned([{ success: true }]);
  expect(onSigned).toHaveBeenCalledTimes(1);
  return onSigned.mock.calls[0][1];
}

it('preserves real remote identity fields through the converter and signing callback', async () => {
  const certificate = await signedCertificate({
    commonName: 'Test signer',
    inn: 'test-inn',
    ogrn: 'test-ogrn',
    organization: 'Test organization'
  });
  expect(certificate.subject).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: 'CN', text: 'Test signer' }),
      expect.objectContaining({ code: 'ИНН', text: 'test-inn' }),
      expect.objectContaining({ code: 'ОГРН', text: 'test-ogrn' }),
      expect.objectContaining({ code: 'O', text: 'Test organization' })
    ])
  );
});

it.each([undefined, {}, { ogrn: '' }, { ogrn: null }])('does not invent an organization identity for subject %p', async subject => {
  const certificate = await signedCertificate(subject);
  expect(certificate.subject.some(field => ['OGRN', 'ОГРН', '1.2.643.100.1'].includes(field.code))).toBe(false);
  expect(certificate.subject.find(field => field.code === 'CN').text).toBe('Test signer');
});
