import classnames from 'classnames';
import get from 'lodash/get';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Well } from '../../common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';

import { selectIsViewNewJournal } from '@/selectors/view';

import './JournalsContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    grid: get(newState, 'grid', {}),
    gridData: get(newState, 'grid.data', []),
    isViewNewJournal
  };
};

const Content = React.memo(({ showWidgets, isViewNewJournal, maxHeight, isNotGrouping, ...props }) => (
  <Well
    isViewNewJournal={isViewNewJournal}
    className={classnames('ecos-journals-content__grid-well ecos-journals-content__grid-well_overflow_hidden', {
      'ecos-journals-content__grid-well_preview': showWidgets,
      'ecos-journal__not-grouping': isNotGrouping
    })}
    maxHeight={maxHeight}
  >
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
      grid: _grid
    } = this.props;
    const { groupBy } = _grid || {};

    return (
      <Content
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
      />
    );
  }
}

export default connect(mapStateToProps)(JournalsContent);
