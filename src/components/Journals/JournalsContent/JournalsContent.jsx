import React, { Component } from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import classnames from 'classnames';

import { ResizeBoxes } from '../../common';
import { Wall } from '../../common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsPreview from '../JournalsPreview';

import './JournalsContent.scss';

const mapStateToProps = (state, props) => {
  const newState = get(state, ['journals', props.stateId]) || {};

  return {
    journalId: get(newState, 'journalConfig.id', '')
  };
};

const Content = React.memo(({ showPreview, ...props }) => (
  <Wall
    className={classnames('ecos-journals-content__grid-well ecos-journals-content__grid-well_overflow_hidden', {
      'ecos-journals-content__grid-well_preview': showPreview
    })}
  >
    <JournalsDashletGrid
      noTopBorder
      doInlineToolsOnRowClick={showPreview}
      toolsClassName={'grid-tools_r_12'}
      selectorContainer={'.ecos-journal-page'}
      {...props}
    />
  </Wall>
));

const Preview = ({ stateId, recordId }) => (
  <Wall className="ecos-well_full ecos-journals-content__preview-well">
    <JournalsPreview stateId={stateId} recordId={recordId} />
  </Wall>
);

class JournalsContent extends Component {
  state = {};

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return nextProps.isActivePage;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.journalId !== this.props.journalId && this.state.recordId) {
      this.setState({ recordId: '' });
    }
  }

  onRowClick = row => {
    this.setState({ recordId: row.id });
  };

  render() {
    const { stateId, showPreview, maxHeight, minHeight = 450, onOpenSettings, isResetGridSettings } = this.props;
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
          <Preview stateId={stateId} recordId={recordId} />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(JournalsContent);
