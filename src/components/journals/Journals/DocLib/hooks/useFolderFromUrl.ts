import { DocLibUrlParams, JournalUrlParams } from '@citeck/constants';
import get from 'lodash/get';
import { useEffect, useRef } from 'react';

import { useDocLibDispatch } from './useDocLibDispatch';
import { useDocLibSelector } from './useDocLibSelector';

import { openFolder } from '@/actions/docLib';
import { isDocLib } from '@/components/journals/Journals/constants';
import { selectDocLibFolderId, selectDocLibRootId } from '@/selectors/docLib';
import { selectUrl } from '@/selectors/journals';

type UrlParams = Record<string, string | undefined>;

/**
 * Keeps the opened folder in sync with the page tab's link after the library has been initialised.
 *
 * The library reads `folderId` from the URL only once, in `sagaInitDocumentLibrary`, and DocLibView
 * dispatches that init once per `typeRef`. Page tabs are keyed by journal, so a link to another
 * folder of the same library (clicked inside the app, e.g. from a comment or a dashboard) does not
 * open a new tab: the existing tab gets the new link, the cached page stays mounted, `Journals`
 * refreshes `journals.url` — and nothing re-reads it. The URL then shows the linked folder while
 * the view still shows the previously opened one. A full page load never hit this, which is why the
 * bug looked intermittent.
 *
 * The store URL, not `window.location`, is the source of truth here: it is what the init saga
 * reads, `Journals` keeps it current for the active page, and it stays untouched for background
 * tabs. Only links of the document-library view are honoured — on a tab switch `journals.url` is
 * transiently overwritten with the other page's params, and a table-view link of the same journal
 * must not reset the folder either.
 *
 * The current folder is read through a ref on purpose: the effect must fire on URL changes only.
 * When the user opens a folder, the store folder changes first and the URL catches up later — by
 * then both agree and nothing is dispatched.
 */
export function useFolderFromUrl(stateId: string, enabled: boolean) {
  const dispatchW = useDocLibDispatch(stateId);
  const url = useDocLibSelector<UrlParams>(selectUrl, stateId);
  const rootId = useDocLibSelector<string | null>(selectDocLibRootId, stateId);
  const folderId = useDocLibSelector<string | null>(selectDocLibFolderId, stateId);

  const isDocLibLink = isDocLib(get(url, JournalUrlParams.VIEW_MODE));
  const urlFolderId: string | null = isDocLibLink ? get(url, DocLibUrlParams.FOLDER_ID) || rootId : null;

  const folderIdRef = useRef(folderId);
  folderIdRef.current = folderId;

  useEffect(() => {
    if (!enabled || !urlFolderId || !folderIdRef.current) {
      return;
    }

    if (urlFolderId !== folderIdRef.current) {
      dispatchW(openFolder, urlFolderId);
    }
  }, [enabled, urlFolderId, dispatchW]);
}
