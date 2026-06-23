import Records, { configure, isConfigured, registerGlobal, recordsClientManager } from '@citeck/records-core';
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
  if (isConfigured()) {
    return;
  }

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

/*
 * Side-effect on import: configure `@citeck/records-core` during the module
 * evaluation phase, before the heavier app graph (actions/dialogs/widgets) is
 * pulled in. Importing this module first in the entry point guarantees the
 * Records API is configured even if a later circular-import TDZ aborts the
 * top-level body of `index.tsx`. The call is idempotent (guarded above).
 */
bootstrapRecords();
