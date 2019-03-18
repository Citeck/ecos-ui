import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import { PROXY_URI } from '../../../constants/alfresco';
import Dashlet from '../../Dashlet/Dashlet';
import JournalsDashletToolbar from '../JournalsDashletToolbar';
import JournalsDashletEditor from '../JournalsDashletEditor';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsDashletTreeGrid from '../JournalsDashletTreeGrid';
import JournalsDashletFooter from '../JournalsDashletFooter';
import { getDashletConfig, setEditorMode, reloadGrid, setPage } from '../../../actions/journals';

import './JournalsDashlet.scss';

const mapStateToProps = state => ({
  editorMode: state.journals.editorMode,
  journalsListName: state.journals.journalsListName
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  setEditorMode: visible => dispatch(setEditorMode(visible)),
  reloadGrid: ({ journalId, pagination, columns, criteria }) => dispatch(reloadGrid({ journalId, pagination, columns, criteria })),
  setPage: page => dispatch(setPage(page))
});

class JournalsDashlet extends Component {
  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  showEditor = () => {
    this.props.setEditorMode(true);
  };

  goToJournalsPage = () => {
    window.location = `${PROXY_URI}journals`;
  };

  onReloadDashlet = () => {
    const props = this.props;
    props.setPage(1);
    props.reloadGrid({});
  };

  render() {
    const props = this.props;
    const cssClasses = classNames('journal-dashlet', props.className);

    return (
      <Dashlet
        {...props}
        className={cssClasses}
        title={props.journalsListName}
        onEdit={this.showEditor}
        onReload={this.onReloadDashlet}
        onGoTo={this.goToJournalsPage}
      >
        {props.editorMode ? (
          <JournalsDashletEditor id={props.id} />
        ) : (
          <Fragment>
            <JournalsDashletToolbar />

            <JournalsDashletTreeGrid />

            <JournalsDashletFooter />
          </Fragment>
        )}
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashlet);
