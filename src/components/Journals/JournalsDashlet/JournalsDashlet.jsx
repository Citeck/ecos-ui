import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsDashletToolbar from '../JournalsDashletToolbar';
import JournalsDashletEditor from '../JournalsDashletEditor';
import JournalsDashletFooter from '../JournalsDashletFooter';
import { getDashletConfig, setEditorMode, reloadGrid, initState } from '../../../actions/journals';
import Dashlet from '../../Dashlet/Dashlet';
import { goToJournalsPage } from '../../../helpers/urls';
import { wrapArgs } from '../../../helpers/redux';
import classNames from 'classnames';

import './JournalsDashlet.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId || props.id] || {};

  return {
    editorMode: newState.editorMode,
    journalConfig: newState.journalConfig,
    config: newState.config
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId || props.id);

  return {
    initState: stateId => dispatch(initState(stateId)),

    getDashletConfig: id => dispatch(getDashletConfig(w(id))),
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    reloadGrid: options => dispatch(reloadGrid(w(options)))
  };
};

class JournalsDashlet extends Component {
  constructor(props) {
    super(props);
    this.props.initState(props.stateId);
  }

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
    const { journalConfig, className, id, editorMode, reloadGrid, stateId } = this.props;

    if (!journalConfig) {
      return null;
    }

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
          <JournalsDashletEditor id={id} stateId={stateId} />
        ) : (
          <Fragment>
            <JournalsDashletToolbar stateId={stateId} />

            <JournalsDashletGrid stateId={stateId} />

            <JournalsDashletFooter stateId={stateId} />
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
