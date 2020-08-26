import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import get from 'lodash/get';

import { Well } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsPreview from '../JournalsPreview';
import JournalsUrlManager from '../JournalsUrlManager';

import './JournalsContent.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    journalId: get(newState, 'journalConfig.id', '')
  };
};

const Grid = ({ showPreview, ...props } /*{ stateId, showPreview, onRowClick, maxHeight, minHeight }*/) => (
  <Well className="ecos-journals-content__grid-well ecos-journals-content__grid-well_overflow_hidden">
    <JournalsDashletGrid
      // stateId={stateId}
      // onRowClick={onRowClick}
      doInlineToolsOnRowClick={showPreview}
      noTopBorder
      // maxHeight={maxHeight}
      // minHeight={minHeight}
      toolsClassName={'grid-tools_r_12'}
      selectorContainer={'.ecos-journal-page'}
      {...props}
    />
  </Well>
);

const Preview = ({ stateId, recordId }) => (
  <Well className="ecos-well_full ecos-journals-content__preview-well">
    <JournalsPreview stateId={stateId} recordId={recordId} />
  </Well>
);

const Pie = () => <div>{'showPie'}</div>;

class JournalsContent extends Component {
  state = {};

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.journalId !== this.props.journalId && this.state.recordId) {
      this.setState({ recordId: '' });
    }
  }

  onRowClick = row => {
    this.setState({ recordId: row.id });
  };

  render() {
    const { stateId, showPreview, showPie, maxHeight, isActivePage } = this.props;
    const { recordId } = this.state;
    let leftColumnClassNames = '';

    let cols = [<Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} maxHeight={maxHeight} />];

    if (showPreview) {
      leftColumnClassNames = 'columns columns__column_half-space';
      cols = [
        <Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} maxHeight={maxHeight} autoHeight minHeight={468} />,
        <Preview stateId={stateId} recordId={recordId} />
      ];
    }

    if (showPie) {
      cols = [<Pie />];
    }

    return (
      <JournalsUrlManager stateId={stateId} params={{ showPreview }} isActivePage={isActivePage}>
        <Columns
          classNamesColumn="columns_height_full columns__column_margin_0"
          cols={cols}
          cfgs={[{ className: leftColumnClassNames }, { className: 'ecos-journals-content_col-step' }]}
        />
      </JournalsUrlManager>
    );
  }
}

export default connect(mapStateToProps)(JournalsContent);
