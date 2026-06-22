import classnames from 'classnames';
import get from 'lodash/get';
import React from 'react';
import { connect } from 'react-redux';

import { getStateId } from '@/helpers/store';
import { updateCurrentUrl } from '@/helpers/urls';
import { getMLValue, getSearchParams } from '@/helpers/util';
import PageTabList from '@/services/pageTabs/PageTabList';
import { MLTextType } from '@/types/components';
import { RootState } from '@/types/store';

import './Breadcrumbs.scss';

interface BreadcrumbsProps {
  stateId?: string;
  className?: string;
  breadcrumbs: { id: string; disp: string }[];
  journalName: MLTextType;
}

function Breadcrumbs({ breadcrumbs, journalName, className }: BreadcrumbsProps) {
  const updateUrl = (recordRef: string | null) => {
    if (!recordRef) {
      updateCurrentUrl({ recordRef: 'null' });
      return;
    }

    updateCurrentUrl({ recordRef });
  };

  const renderBreadcrumbs = () => {
    if (!breadcrumbs || !breadcrumbs.length) {
      return null;
    }

    return breadcrumbs.map(breadcrumb => (
      <div key={breadcrumb.id} className="breadcrumbs__item" onClick={() => updateUrl(breadcrumb.id)}>
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.21967 4.71967C6.51256 4.42678 6.98744 4.42678 7.28033 4.71967L10.5303 7.96967C10.8232 8.26256 10.8232 8.73744 10.5303 9.03033L7.28033 12.2803C6.98744 12.5732 6.51256 12.5732 6.21967 12.2803C5.92678 11.9874 5.92678 11.5126 6.21967 11.2197L8.93934 8.5L6.21967 5.78033C5.92678 5.48744 5.92678 5.01256 6.21967 4.71967Z"
            fill="#767676"
          />
        </svg>
        <span className="breadcrumbs__item_text">{breadcrumb.disp}</span>
      </div>
    ));
  };

  return (
    <div className={classnames('breadcrumbs', className)}>
      <h5 className="breadcrumbs_title" onClick={() => updateUrl(null)}>
        {getMLValue(journalName)}
      </h5>
      {renderBreadcrumbs()}
    </div>
  );
}

const mapStateToProps = (state: RootState, props: Pick<BreadcrumbsProps, 'stateId'>): BreadcrumbsProps => {
  const stateId = props.stateId || getStateId({ tabId: PageTabList.activeTabId, id: (getSearchParams().journalId as string) || '' });
  const newState = get(state, ['journals', stateId]) || {};

  return {
    breadcrumbs: get(newState, 'breadcrumbs', []),
    journalName: get(newState, 'journalConfig.name', ''),
    stateId
  };
};

export default connect(mapStateToProps)(Breadcrumbs);
