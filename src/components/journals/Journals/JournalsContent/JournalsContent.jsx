import classnames from 'classnames';
import get from 'lodash/get';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Well } from '@/components/common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';

import Breadcrumbs from '@/components/journals/Journals/Breadcrumbs';
import { HEIGHT_BREADCRUMBS } from '@/components/journals/Journals/constants';
import { getSearchParams } from '@/helpers/urls';

import './JournalsContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    grid: get(newState, 'grid', {}),
    gridData: get(newState, 'grid.data', []),
    searchParams: getSearchParams()
  };
};

const Content = React.memo(({ showWidgets, maxHeight, isNotGrouping, recordRef, breadcrumbsHeight, ...props }) => (
  <Well
    className={classnames('ecos-journals-content__grid-well ecos-journals-content__grid-well_overflow_hidden', {
      'ecos-journals-content__grid-well_preview': showWidgets,
      'ecos-journal__not-grouping': isNotGrouping
    })}
    maxHeight={maxHeight + breadcrumbsHeight}
  >
    {props.journalId && recordRef && recordRef !== 'null' && (
      <Breadcrumbs className="ecos-journals-content__breadcrumbs" stateId={props.stateId} />
    )}
    <JournalsDashletGrid
      noTopBorder
      doInlineToolsOnRowClick={showWidgets}
      toolsClassName={'grid-tools_r_12'}
      selectorContainer={'.ecos-journal-page'}
      maxHeight={maxHeight}
      {...props}
    />
  </Well>
));

class JournalsContent extends Component {
  render() {
    const {
      stateId,
      showWidgets,
      onRowClick,
      maxHeight,
      minHeight = 450,
      onOpenSettings,
      isResetGridSettings,
      journalId,
      searchParams,
      draggableEvents,
      grid: _grid
    } = this.props;
    const recordRef = get(searchParams, 'recordRef');
    const hasBreadcrumbs = !!recordRef && recordRef !== 'null';
    const { groupBy } = _grid || {};

    const breadcrumbsHeight =
      get(document.querySelector('.ecos-journals-content__breadcrumbs'), 'offsetHeight') || hasBreadcrumbs ? HEIGHT_BREADCRUMBS : 0;

    return (
      <Content
        draggableEvents={draggableEvents}
        recordRef={recordRef}
        isNotGrouping={!groupBy || (groupBy && !groupBy.length)}
        stateId={stateId}
        showWidgets={showWidgets}
        onRowClick={onRowClick}
        onOpenSettings={onOpenSettings}
        maxHeight={maxHeight}
        minHeight={minHeight}
        isResetGridSettings={isResetGridSettings}
        autoHeight
        journalId={journalId}
        breadcrumbsHeight={breadcrumbsHeight}
      />
    );
  }
}

export default connect(mapStateToProps)(JournalsContent);
