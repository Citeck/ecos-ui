import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsDashletToolbar from '../JournalsDashletToolbar';
import JournalsDashletEditor from '../JournalsDashletEditor';
import JournalsDashletFooter from '../JournalsDashletFooter';
import { getDashletConfig, setEditorMode, reloadGrid } from '../../../actions/journals';
import Dashlet from '../../Dashlet/Dashlet';
import { goToJournalsPage } from '../urlManager';
import classNames from 'classnames';

import './JournalsDashlet.scss';

const mapStateToProps = state => ({
  editorMode: state.journals.editorMode,
  journalConfig: state.journals.journalConfig,
  config: state.journals.config
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  setEditorMode: visible => dispatch(setEditorMode(visible)),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class JournalsDashlet extends Component {
  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  showEditor = () => this.props.setEditorMode(true);

  goToJournalsPage = () => {
    const {
      config: { journalsListId = '', journalSettingId = '' },
      journalConfig: {
        id = '',
        meta: { nodeRef = '' }
      }
    } = this.props;

    goToJournalsPage({ journalsListId, journalId: id, journalSettingId, nodeRef });
  };

  render() {
    const { journalConfig, className, id, editorMode, reloadGrid } = this.props;

    return (
      <Dashlet
        {...this.props}
        className={classNames('ecos-journal-dashlet', className)}
        bodyClassName={'ecos-journal-dashlet__body'}
        title={journalConfig.meta.title || ''}
        onReload={reloadGrid}
        onEdit={this.showEditor}
        onGoTo={this.goToJournalsPage}
      >
        {editorMode ? (
          <JournalsDashletEditor id={id} />
        ) : (
          <Fragment>
            <JournalsDashletToolbar />

            <JournalsDashletGrid />

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
