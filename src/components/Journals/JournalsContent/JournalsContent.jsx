import React, { Component } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import classnames from 'classnames';

import { ResizeBoxes } from '../../common';
import { Wall } from '../../common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsPreview from '../JournalsPreview';
import { selectIsViewNewJournal } from '../../../selectors/view';

import './JournalsContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    journalId: get(newState, 'journalConfig.id', ''),
    gridData: get(newState, 'grid.data', []),
    isViewNewJournal
  };
};

const Content = React.memo(({ showPreview, isViewNewJournal, maxHeight, ...props }) => (
  <Wall
    isViewNewJournal={isViewNewJournal}
    className={classnames('ecos-journals-content__grid-well ecos-journals-content__grid-well_overflow_hidden', {
      'ecos-journals-content__grid-well_preview': showPreview
    })}
    maxHeight={maxHeight}
  >
    <JournalsDashletGrid
      noTopBorder
      doInlineToolsOnRowClick={showPreview}
      toolsClassName={'grid-tools_r_12'}
      selectorContainer={'.ecos-journal-page'}
      maxHeight={maxHeight}
      {...props}
    />
  </Wall>
));

const Preview = ({ stateId, recordId, isViewNewJournal }) => (
  <Wall isViewNewJournal={isViewNewJournal} className="ecos-well_full ecos-journals-content__preview-well">
    <JournalsPreview stateId={stateId} recordId={recordId} />
  </Wall>
);

class JournalsContent extends Component {
  state = {};

  constructor(props) {
    super(props);

    this.state = {
      recordId: props.gridData.length === 1 ? props.gridData[0].id : ''
    };
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return nextProps.isActivePage || !isEqual(nextProps.gridData, this.props.gridData);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { journalId, gridData } = this.props;
    const { recordId } = this.state;

    if (gridData.length === 1 && prevState.recordId !== gridData[0].id) {
      this.setState({ recordId: gridData[0].id });
    } else if (prevProps.journalId !== journalId && recordId) {
      this.setState({ recordId: '' });
    }
  }

  onRowClick = row => {
    this.setState({ recordId: row.id });
  };

  render() {
    const {
      stateId,
      isViewNewJournal,
      showPreview,
      maxHeight,
      minHeight = 450,
      onOpenSettings,
      isResetGridSettings,
      journalId
    } = this.props;
    const { recordId } = this.state;

    const grid = (
      <Content
        stateId={stateId}
        showPreview={showPreview}
        onRowClick={this.onRowClick}
        onOpenSettings={onOpenSettings}
        maxHeight={maxHeight}
        minHeight={minHeight}
        isResetGridSettings={isResetGridSettings}
        autoHeight
        journalId={journalId}
        isViewNewJournal={isViewNewJournal}
      />
    );

    if (!showPreview) {
      return grid;
    }

    const leftId = `_${stateId}-grid`;
    const rightId = `_${stateId}-preview`;

    return (
      <div className="ecos-journals-content__sides">
        <div id={leftId} className="ecos-journals-content__sides-left">
          {grid}
        </div>
        <div id={rightId} className="ecos-journals-content__sides-right">
          <ResizeBoxes leftId={leftId} rightId={rightId} className="ecos-journals-content__resizer" autoRightSide />
          <Preview isViewNewJournal={isViewNewJournal} stateId={stateId} recordId={recordId} />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsContent);
