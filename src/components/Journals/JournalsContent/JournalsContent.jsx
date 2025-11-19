import classnames from 'classnames';
import get from 'lodash/get';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Well } from '../../common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';

import Breadcrumbs from '@/components/Journals/Breadcrumbs';
import { HEIGHT_BREADCRUMBS } from '@/components/Journals/constants';
import { getSearchParams } from '@/helpers/urls';
import { selectIsViewNewJournal } from '@/selectors/view';

import './JournalsContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    grid: get(newState, 'grid', {}),
    gridData: get(newState, 'grid.data', []),
    searchParams: getSearchParams(),
    isViewNewJournal
  };
};

const Content = React.memo(({ showWidgets, isViewNewJournal, maxHeight, isNotGrouping, recordRef, breadcrumbsHeight, ...props }) => (
  <Well
    isViewNewJournal={isViewNewJournal}
    className={classnames('ecos-journals-content__grid-well ecos-journals-content__grid-well_overflow_hidden', {
      'ecos-journals-content__grid-well_preview': showWidgets,
      'ecos-journal__not-grouping': isNotGrouping
    })}
    maxHeight={maxHeight + breadcrumbsHeight}
  >
    {props.journalId && recordRef && <Breadcrumbs className="ecos-journals-content__breadcrumbs" stateId={props.stateId} />}
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
      isViewNewJournal,
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
    const { groupBy } = _grid || {};
    const recordRef = get(searchParams, 'recordRef');
    const breadcrumbsHeight = get(document.querySelector('.ecos-journals-content__breadcrumbs'), 'offsetHeight') || HEIGHT_BREADCRUMBS;

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
        isViewNewJournal={isViewNewJournal}
        breadcrumbsHeight={breadcrumbsHeight}
      />
    );
  }
}

export default connect(mapStateToProps)(JournalsContent);
