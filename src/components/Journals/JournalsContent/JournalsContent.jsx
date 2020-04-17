import React, { Component } from 'react';

import { Well } from '../../common/form';
import Columns from '../../common/templates/Columns/Columns';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsPreview from '../JournalsPreview';
import JournalsUrlManager from '../JournalsUrlManager';

import './JournalsContent.scss';

const Grid = ({ stateId, showPreview, onRowClick, maxHeight }) => (
  <Well className="ecos-journals-content__grid-well_overflow_hidden">
    <JournalsDashletGrid
      stateId={stateId}
      onRowClick={onRowClick}
      doInlineToolsOnRowClick={showPreview}
      noTopBorder
      maxHeight={maxHeight}
      toolsClassName={'grid-tools_r_12'}
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

  onRowClick = row => {
    this.setState({ recordId: row.id });
  };

  render() {
    const { stateId, showPreview, showPie, maxHeight } = this.props;
    const { recordId } = this.state;

    let cols = [<Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} maxHeight={maxHeight} />];

    if (showPreview) {
      cols = [
        <Grid stateId={stateId} showPreview={showPreview} onRowClick={this.onRowClick} maxHeight={maxHeight} />,
        <Preview stateId={stateId} recordId={recordId} />
      ];
    }

    if (showPie) {
      cols = [<Pie />];
    }

    return (
      <JournalsUrlManager stateId={stateId} params={{ showPreview }}>
        <Columns
          classNamesColumn="columns_height_full columns__column_margin_0"
          cols={cols}
          cfgs={[{}, { className: 'ecos-journals-content_col-step' }]}
        />
      </JournalsUrlManager>
    );
  }
}

export default JournalsContent;
