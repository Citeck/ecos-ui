import createDevStubApi, { DevModes, getDevMode, isDevModeEnabled } from './index';

describe('esign dev stub', () => {
  describe('mode resolution', () => {
    it('is off when the config is missing, empty or unknown', () => {
      expect(getDevMode(undefined)).toBe(DevModes.OFF);
      expect(getDevMode({})).toBe(DevModes.OFF);
      expect(getDevMode({ mode: 'something-else' })).toBe(DevModes.OFF);
      expect(isDevModeEnabled({})).toBe(false);
    });

    it('is on for the supported modes', () => {
      expect(getDevMode({ mode: 'stub' })).toBe(DevModes.STUB);
      expect(getDevMode({ mode: 'remote' })).toBe(DevModes.REMOTE);
      expect(isDevModeEnabled({ mode: 'stub' })).toBe(true);
    });
  });

  describe('stub mode', () => {
    const api = createDevStubApi({ mode: 'stub' });

    it('exposes the invalid states through the raw list only, like the real API', async () => {
      const all = await api.getCertsList();
      const valid = await api.getValidCertificates();

      expect(all).toHaveLength(3);
      // getValidCertificates must drop the expired / not-yet-valid ones, otherwise the
      // debug mode shows the UI something production never can.
      expect(valid).toHaveLength(1);
      expect(valid[0].friendlySubjectInfo()[0].text).toContain('действующий');
    });

    it('offers a usable certificate plus the invalid states', async () => {
      const certificates = await api.getCertsList();

      expect(certificates).toHaveLength(3);
      certificates.forEach(certificate => {
        // The shape EsignConverter.getCertificateForModal reads.
        expect(typeof certificate.friendlySubjectInfo).toBe('function');
        expect(typeof certificate.friendlyIssuerInfo).toBe('function');
        expect(certificate.friendlySubjectInfo()[0]).toEqual(expect.objectContaining({ code: 'CN' }));
        expect(certificate.thumbprint).toBeTruthy();
        expect(certificate.validPeriod.from).toBeInstanceOf(Date);
        expect(certificate.privateKey.ProviderName).toBeTruthy();
      });

      const [valid, expired, notYetValid] = certificates;
      expect(valid.validPeriod.to.getTime()).toBeGreaterThan(Date.now());
      expect(expired.validPeriod.to.getTime()).toBeLessThan(Date.now());
      expect(notYetValid.validPeriod.from.getTime()).toBeGreaterThan(Date.now());
    });

    it('produces a marked signature so it stays recognizable downstream', async () => {
      const signature = await api.signBase64('dev-thumb', 'ZG9jdW1lbnQ=');
      const decoded = decodeURIComponent(escape(window.atob(signature)));

      expect(decoded).toContain('ECOS-DEV-SIGNATURE');
      expect(decoded).toContain('dev-thumb');
      await expect(api.verifyBase64(signature, 'ZG9jdW1lbnQ=')).resolves.toBe(true);
    });

    it('resolves a certificate by thumbprint and rejects an unknown one', async () => {
      const [first] = await api.getCertsList();

      await expect(api.getCert(first.thumbprint)).resolves.toEqual(expect.objectContaining({ thumbprint: first.thumbprint }));
      await expect(api.getCert('nope')).rejects.toThrow(/no debug certificate/);
    });

    it('refuses the operations it cannot stand in for instead of faking them', () => {
      expect(() => api.signXml()).toThrow(/not available in debug mode/);
      expect(() => api.getHash()).toThrow(/not available in debug mode/);
    });
  });

  describe('remote mode', () => {
    const config = { mode: 'remote', url: '/gateway/edi-sim/admin/api/' };

    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    const mockFetch = (payload, ok = true, status = 200) => {
      global.fetch = jest.fn().mockResolvedValue({ ok, status, json: async () => payload });
    };

    it('lists the oracle certificates and drops the public-only ones', async () => {
      mockFetch([
        { id: 'cert-1', subjectCN: 'Иван Петров', algorithm: 'gost2012_256', serialHex: 'AB', notBefore: '2026-01-01T00:00:00Z', notAfter: '2027-01-01T00:00:00Z' },
        { id: 'cert-2', subjectCN: 'Внешний', algorithm: 'rsa2048', imported: true }
      ]);

      const certificates = await createDevStubApi(config).getValidCertificates();

      // The trailing slash of the configured url must not double up.
      expect(global.fetch).toHaveBeenCalledWith('/gateway/edi-sim/admin/api/certificates', expect.objectContaining({ method: 'GET' }));
      expect(certificates).toHaveLength(1);
      // The oracle addresses a certificate by id, so the id must survive as the thumbprint.
      expect(certificates[0].thumbprint).toBe('cert-1');
      expect(certificates[0].friendlySubjectInfo()[0].text).toContain('Иван Петров');
    });

    it('passes the document through to the oracle and returns its signature', async () => {
      mockFetch({ signature: 'Q01TLWJ5dGVz' });

      const signature = await createDevStubApi(config).signBase64('cert-1', 'ZG9jdW1lbnQ=');

      expect(signature).toBe('Q01TLWJ5dGVz');
      expect(global.fetch).toHaveBeenCalledWith(
        '/gateway/edi-sim/admin/api/certificates/cert-1/sign',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: 'ZG9jdW1lbnQ=' }) })
      );
    });

    it('fails loudly on an oracle error or an empty signature', async () => {
      mockFetch(null, false, 503);
      await expect(createDevStubApi(config).signBase64('cert-1', 'ZG9j')).rejects.toThrow(/answered 503/);

      mockFetch({ signature: '' });
      await expect(createDevStubApi(config).signBase64('cert-1', 'ZG9j')).rejects.toThrow(/empty signature/);
    });

    it('fails when no oracle url is configured', async () => {
      await expect(createDevStubApi({ mode: 'remote' }).getCertsList()).rejects.toThrow(/"url" is not set/);
    });

    it('refuses a cross-origin oracle url', async () => {
      // The document itself travels in the sign request, together with the session
      // cookie, so an absolute url would hand both to a foreign host.
      for (const url of ['https://evil.example.com/api', '//evil.example.com/api']) {
        await expect(createDevStubApi({ mode: 'remote', url }).getCertsList()).rejects.toThrow(/same-origin path/);
      }
    });

    it('reports an unreachable oracle instead of leaking a bare fetch error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(createDevStubApi(config).getCertsList()).rejects.toThrow(/is unreachable/);
    });
  });
});
