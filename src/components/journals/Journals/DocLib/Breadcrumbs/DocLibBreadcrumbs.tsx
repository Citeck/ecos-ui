import { DocLibUrlParams } from '@citeck/constants';
import queryString from 'query-string';
import React, { useCallback } from 'react';

import { openFolder } from '@/actions/docLib';
import ChevronRight from '@/components/common/icons/ChevronRight';
import DocLibConverter from '@/dto/docLib';
import { selectDocLibFolderPath } from '@/selectors/docLib';

import { useDocLibDispatch } from '../hooks/useDocLibDispatch';
import { useDocLibSelector } from '../hooks/useDocLibSelector';
import { PathItem } from '../types';

import './DocLibBreadcrumbs.scss';

interface DocLibBreadcrumbsProps {
  stateId: string;
}

const DocLibBreadcrumbs = ({ stateId }: DocLibBreadcrumbsProps) => {
  const dispatchW = useDocLibDispatch(stateId);
  const path = useDocLibSelector<PathItem[]>(selectDocLibFolderPath, stateId) || [];

  const onCrumbClick = useCallback((id: string) => dispatchW(openFolder, id), [dispatchW]);

  if (!Array.isArray(path) || !path.length) {
    return null;
  }

  const renderCrumb = (item: PathItem, idx: number) => {
    const completeItem = DocLibConverter.completeItemId(item) as unknown as PathItem;
    const folderId = completeItem.id;
    const title = completeItem.disp;

    const urlParts = queryString.parseUrl(window.location.href);
    const query = urlParts.query;
    query[DocLibUrlParams.FOLDER_ID] = folderId;
    const url = `${urlParts.url}?${queryString.stringify(query)}`;

    return (
      <React.Fragment key={folderId}>
        {idx > 0 && (
          <span className="citeck-doclib-breadcrumbs__separator">
            <ChevronRight width={12} height={12} color="currentColor" />
          </span>
        )}
        <a
          href={url}
          className="citeck-doclib-breadcrumbs__link"
          title={title}
          onClick={e => {
            e.preventDefault();
            onCrumbClick(folderId);
          }}
        >
          {title}
        </a>
      </React.Fragment>
    );
  };

  return <nav className="citeck-doclib-breadcrumbs">{path.map(renderCrumb)}</nav>;
};

export default DocLibBreadcrumbs;
