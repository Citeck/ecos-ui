import Records, { configure, registerGlobal, recordsClientManager } from '@citeck/records-core';
import get from 'lodash/get';
import queryString from 'query-string';

import CipherSwpGostClient from '@/components/core/Records/client/cipherSwpGost/CipherSwpGostClient';
import ecosFetch from '@/helpers/ecosFetch';
import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces, t } from '@/helpers/util';

/**
 * Wires `@citeck/records-core` to the web platform: HTTP via `ecosFetch`,
 * i18n via `t`, workspace context from the app helpers, and the debug feature
 * flag from `localStorage`. Also exposes the singleton on `window` and
 * registers the browser-only CAPICOM cipher client.
 *
 * Must run once, before any Records API usage.
 */
export function bootstrapRecords(): void {
  configure({
    http: ecosFetch as any,
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    i18n: { t },
    workspace: {
      getWorkspaceId,
      getEnabledWorkspaces,
      getCurrentRecordRef: () => get(queryString.parseUrl(window.location.href), 'query.recordRef') as string | undefined
    }
  });

  recordsClientManager.register(new CipherSwpGostClient());
  recordsClientManager.init(Records);

  registerGlobal();
}
