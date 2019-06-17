import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { push } from 'connected-react-router';
import { withRouter } from 'react-router';
import { Well } from '../../common/form';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsPreview from '../JournalsPreview';
//import JournalsTasks from '../JournalsTasks';
import Columns from '../../common/templates/Columns/Columns';
import { initPreview } from '../../../actions/journals';
import { setPreview } from '../urlManager';

import './JournalsContent.scss';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  initPreview: nodeRef => dispatch(initPreview(nodeRef)),
  push: url => dispatch(push(url))
});

const Grid = ({ showPreview, onRowClick }) => (
  <Well>
    <JournalsDashletGrid
      onRowClick={onRowClick}
      doInlineToolsOnRowClick={showPreview}
      className={'ecos-grid_no-top-border'}
      notGoToJournalPageWithFilter
    />
  </Well>
);

const Preview = () => (
  <Well className={'ecos-well_full ecos-journals-content__preview-well'}>
    {/*<JournalsTasks className={'ecos-journals-content__preview-y-step'} />*/}
    <JournalsPreview />
  </Well>
);

const Pie = () => (
  <Fragment>
    <div>{'showPie'}</div>
  </Fragment>
);

class JournalsContent extends Component {
  onRowClick = row => {
    this.props.initPreview(row.id);
  };

  render() {
    let { showPreview, showPie } = this.props;

    this.props.push(setPreview(this.props.history.location, showPreview));

    showPie = false; //delete when you need a pie

    let cols = [<Grid showPreview={showPreview} onRowClick={this.onRowClick} />];
    if (showPreview) cols = [<Grid showPreview={showPreview} onRowClick={this.onRowClick} />, <Preview />];
    if (showPie) cols = [<Pie />];

    return (
      <Columns
        classNamesColumn={'columns_height_full columns__column_margin_0'}
        cols={cols}
        cfgs={[{}, { className: 'ecos-journals-content_col-step' }]}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(JournalsContent));
