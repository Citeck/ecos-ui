import get from 'lodash/get';

/**
 * Debug e-signature mode: a stand-in for the CAdES plugin.
 *
 * Signing a document in the UI needs КриптоПро CSP, the browser plug-in and a
 * certificate whose private key was generated inside that CSP — none of which a
 * development machine normally has, and the key cannot be imported from outside.
 * Without them every flow that signs is not degraded but blocked outright, so a
 * developer cannot walk through a signing process at all.
 *
 * This module produces an object with the same surface `EsignApi` consumes from
 * the real plugin API (`getValidCertificates`, `getCert`, `signBase64`,
 * `verifyBase64`), so only the cryptographic primitive is replaced: the certificate
 * dialog, the digest request, the signature upload and the error handling above it
 * all run their normal path.
 *
 * Two flavours, chosen by the `esign-dev-mode` config:
 *   - `stub`   — synthetic certificates, signature bytes are a marked placeholder.
 *                Self-contained, needs nothing else running.
 *   - `remote` — certificates and signatures come from a signing oracle over HTTP
 *                (citeck-edi-sim implements one). The bytes are a real detached CMS
 *                carrying a real certificate, so signature attribution and stamps
 *                downstream behave as they do in production.
 *
 * Everything it produces is marked as debug output — see SIGNATURE_MARKER and the
 * certificate subjects — because these signatures are not cryptographic evidence of
 * anything and must stay recognizable wherever they end up.
 */

export const DevModes = {
  OFF: 'off',
  STUB: 'stub',
  REMOTE: 'remote'
};

/** Prefix of every placeholder signature, mirroring citeck-edi-sim's test signatures. */
const SIGNATURE_MARKER = 'ECOS-DEV-SIGNATURE';

const STUB_ISSUER = 'ECOS Dev Stub';
const STUB_PROVIDER = 'ECOS Debug Provider (no cryptography)';

/** Reads the mode out of the raw config value, tolerating an unset/blank config. */
export function getDevMode(config) {
  const mode = get(config, 'mode', DevModes.OFF);
  return Object.values(DevModes).includes(mode) ? mode : DevModes.OFF;
}

export function isDevModeEnabled(config) {
  return getDevMode(config) !== DevModes.OFF;
}

/**
 * Wraps the raw fields into the object shape `EsignConverter.getCertificateForModal`
 * reads: the two friendly-info getters are functions there, and the provider name is
 * awaited off the private key.
 */
function toCertificate({ thumbprint, serialNumber, subject, subjectInfo, issuer, from, to, provider }) {
  return {
    thumbprint,
    serialNumber,
    validPeriod: { from, to },
    privateKey: { ProviderName: provider || STUB_PROVIDER },
    friendlySubjectInfo: () => subjectInfo || [{ code: 'CN', text: subject }],
    friendlyIssuerInfo: () => [{ code: 'CN', text: issuer || STUB_ISSUER }]
  };
}

/**
 * The subject the way the real plugin reports it: one entry per distinguished-name attribute,
 * keyed by the same codes CryptoPro prints (SN, G, ИНН, ОГРН, СНИЛС, E).
 *
 * Debug signing has no crypto provider to ask, so this is the only place a caller can learn whom
 * a certificate was issued to. Reducing it to CN — as this stub used to — silently breaks every
 * check that branches on the subject: an ОГРН tells an organization's certificate from a person's,
 * and ФИО plus ИНН are what a доверенность is verified against.
 */
function subjectInfoOf(cert) {
  const subject = get(cert, 'subject') || {};
  const entries = [
    ['CN', subject.commonName || cert.subjectCN],
    ['O', subject.organization],
    ['SN', subject.surname],
    ['G', subject.givenName],
    ['ИНН', subject.inn],
    ['ОГРН', subject.ogrn],
    ['СНИЛС', subject.snils],
    ['E', subject.email]
  ];

  return entries.filter(([, text]) => !!text).map(([code, text]) => ({ code, text, value: '' }));
}

/**
 * Three synthetic certificates: one usable plus one expired and one not yet valid.
 * The invalid pair belongs to `getCertsList` only — the real API returns the raw list
 * there and filters it in `getValidCertificates`, so anything above this module sees a
 * valid certificate or nothing. Those states are painful to arrange with a real
 * certificate authority, which is why the debug list carries them.
 */
function stubCertificates() {
  const year = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return [
    toCertificate({
      thumbprint: 'dev0000000000000000000000000000000000valid',
      serialNumber: 'DEV-0001',
      subject: 'ТЕСТОВЫЙ СЕРТИФИКАТ (отладка) — действующий',
      from: new Date(now - year),
      to: new Date(now + year)
    }),
    toCertificate({
      thumbprint: 'dev00000000000000000000000000000000expired',
      serialNumber: 'DEV-0002',
      subject: 'ТЕСТОВЫЙ СЕРТИФИКАТ (отладка) — истёкший',
      from: new Date(now - 2 * year),
      to: new Date(now - year)
    }),
    toCertificate({
      thumbprint: 'dev000000000000000000000000000000notyetvalid',
      serialNumber: 'DEV-0003',
      subject: 'ТЕСТОВЫЙ СЕРТИФИКАТ (отладка) — ещё не вступил в силу',
      from: new Date(now + year),
      to: new Date(now + 2 * year)
    })
  ];
}

/** Placeholder signature bytes: a marker line, base64-encoded like a real one. */
function stubSignature(thumbprint) {
  const marker = `${SIGNATURE_MARKER} thumbprint=${thumbprint} at=${new Date().toISOString()}`;
  return window.btoa(unescape(encodeURIComponent(marker)));
}

/**
 * The oracle address must be a same-origin path (e.g. a gateway route). The document
 * itself — not a hash of it — travels in the sign request, and the request carries the
 * session cookie, so an absolute URL here would hand both to whatever host the config
 * names. Same-origin is also what removes the need for CORS on the oracle side.
 */
function oracleUrl(config, path) {
  const base = String(get(config, 'url', '')).trim().replace(/\/+$/, '');

  if (!base) {
    throw new Error('esign dev mode: "url" is not set in the esign-dev-mode config');
  }

  if (!base.startsWith('/') || base.startsWith('//')) {
    throw new Error(`esign dev mode: "url" must be a same-origin path (e.g. /gateway/edi-sim/admin/api), got "${base}"`);
  }

  return base + path;
}

async function oracleRequest(url, init) {
  let response;

  try {
    response = await fetch(url, { credentials: 'include', ...init });
  } catch (e) {
    throw new Error(`esign dev mode: signing oracle at ${url} is unreachable (${e.message})`);
  }

  if (!response.ok) {
    throw new Error(`esign dev mode: signing oracle answered ${response.status} for ${url}`);
  }

  return response.json();
}

/**
 * Certificates offered by the oracle. Public-only entries are dropped: the oracle
 * holds no private key for them, so choosing one would fail at signing time.
 */
async function remoteCertificates(config) {
  const list = await oracleRequest(oracleUrl(config, '/certificates'), { method: 'GET' });

  return (Array.isArray(list) ? list : [])
    .filter(cert => !cert.imported)
    .map(cert =>
      toCertificate({
        // The oracle addresses a certificate by its own id, not by thumbprint, so the
        // id is what must survive into signBase64 — see remoteSignature.
        thumbprint: cert.id,
        serialNumber: cert.serialHex,
        subject: `${cert.subjectCN} (отладка)`,
        subjectInfo: subjectInfoOf(cert),
        issuer: `${STUB_ISSUER} · ${cert.algorithm}`,
        from: cert.notBefore,
        to: cert.notAfter,
        provider: `Signing oracle · ${cert.algorithm}`
      })
    );
}

async function remoteSignature(config, certId, base64) {
  const result = await oracleRequest(oracleUrl(config, `/certificates/${encodeURIComponent(certId)}/sign`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: base64 })
  });
  const signature = get(result, 'signature', '');

  if (!signature) {
    throw new Error('esign dev mode: signing oracle returned an empty signature');
  }

  return signature;
}

/**
 * Builds the plugin-shaped API for the configured mode. Methods the debug mode
 * cannot stand in for throw explicitly rather than returning something plausible —
 * a silent wrong answer here would be read as a product defect.
 */
export default function createDevStubApi(config) {
  const mode = getDevMode(config);
  const unsupported = name => () => {
    throw new Error(`esign dev mode: "${name}" is not available in debug mode`);
  };

  const getCertsList = async () => (mode === DevModes.REMOTE ? remoteCertificates(config) : stubCertificates());
  // Mirrors the real API: the raw list is `getCertsList`, and `getValidCertificates`
  // drops everything outside its validity window (сertificatesApi.getValidCertificates).
  const getValidCertificates = async () => {
    const now = Date.now();

    return (await getCertsList()).filter(cert => {
      const from = new Date(cert.validPeriod.from).getTime();
      const to = new Date(cert.validPeriod.to).getTime();

      return now >= from && now <= to;
    });
  };

  return {
    mode,
    getValidCertificates,
    getCertsList,
    // Looks through the raw list: the real API resolves a certificate by thumbprint
    // whatever its validity, and callers pass thumbprints they already hold.
    getCert: async thumbprint => {
      const certificates = await getCertsList();
      const found = certificates.find(cert => cert.thumbprint === thumbprint);

      if (!found) {
        throw new Error(`esign dev mode: no debug certificate with thumbprint ${thumbprint}`);
      }

      return found;
    },
    getFirstValidCertificate: async () => (await getValidCertificates())[0],
    currentCadesCert: async thumbprint => thumbprint,
    signBase64: async (thumbprint, base64) =>
      mode === DevModes.REMOTE ? remoteSignature(config, thumbprint, base64) : stubSignature(thumbprint),
    // The real API verifies the produced signature locally through the plugin. There
    // is nothing to verify here, and answering false would abort every debug signing.
    verifyBase64: async () => true,
    about: async () => ({ mode, marker: SIGNATURE_MARKER }),
    signXml: unsupported('signXml'),
    signFile: unsupported('signFile'),
    getSignatureInfo: unsupported('getSignatureInfo'),
    getHash: unsupported('getHash'),
    signHash: unsupported('signHash')
  };
}
