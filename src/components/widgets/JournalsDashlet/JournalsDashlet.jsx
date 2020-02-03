import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { goToJournalsPage } from '../../../helpers/urls';
import { wrapArgs } from '../../../helpers/redux';
import { t } from '../../../helpers/util';
import { MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../../constants/index';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import { getDashletConfig, initState, reloadGrid, setDashletConfigByParams, setEditorMode, setRecordRef } from '../../../actions/journals';

import Measurer from '../../Measurer/Measurer';
import Dashlet, { BaseActions } from '../../Dashlet';
import JournalsDashletGrid from '../../Journals/JournalsDashletGrid';
import JournalsDashletToolbar from '../../Journals/JournalsDashletToolbar';
import JournalsDashletEditor from '../../Journals/JournalsDashletEditor';
import JournalsDashletFooter from '../../Journals/JournalsDashletFooter';
import BaseWidget from '../BaseWidget';

import './JournalsDashlet.scss';

const mapStateToProps = (state, ownProps) => {
  const newState = state.journals[ownProps.stateId || ownProps.id] || {};

  return {
    editorMode: newState.editorMode,
    journalConfig: newState.journalConfig,
    config: newState.config
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const w = wrapArgs(ownProps.stateId || ownProps.id);

  return {
    initState: stateId => dispatch(initState(stateId)),
    getDashletConfig: id => dispatch(getDashletConfig(w(id))),
    setRecordRef: recordRef => dispatch(setRecordRef(w(recordRef))),
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setDashletConfigByParams: (id, config) => dispatch(setDashletConfigByParams(w({ id, config })))
  };
};

function mergeProps(stateProps, dispatchProps, ownProps) {
  const newState = get(stateProps, ['journals', ownProps.stateId || ownProps.id], {});

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    config: ownProps.onSave ? ownProps.config : newState.config
  };
}

class JournalsDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string,
    stateId: PropTypes.string,
    dragHandleProps: PropTypes.object,
    config: PropTypes.object,
    onSave: PropTypes.func,

    editorMode: PropTypes.bool,
    journalConfig: PropTypes.object
  };

  static defaultProps = {
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this._stateId = props.stateId || props.id;
    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      isCollapsed: UserLocalSettingsService.getDashletProperty(props.id, DashletProps.IS_COLLAPSED)
    };

    this.props.initState(this._stateId);

    this.recordRef = queryString.parse(window.location.search).recordRef;
  }

  componentDidMount() {
    const { setRecordRef, getDashletConfig, setDashletConfigByParams, id, config, onSave } = this.props;

    setRecordRef(this.recordRef);

    if (onSave) {
      setDashletConfigByParams(id, config);
    } else {
      getDashletConfig(id);
    }
  }

  handleResize = width => {
    this.setState({ width });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setDashletProperty(this.props.id, { isCollapsed });
  };

  showEditor = () => this.props.setEditorMode(true);

  handleReload = () => {
    this.props.reloadGrid && this.props.reloadGrid();
  };

  goToJournalsPage = () => {
    const {
      config: { journalsListId = '', journalSettingId = '' },
      journalConfig: {
        meta: { nodeRef = '' }
      }
    } = this.props;

    goToJournalsPage({ journalsListId, journalId: nodeRef, journalSettingId, nodeRef });
  };

  renderEditor() {
    const { editorMode, id, config, onSave } = this.props;

    let addProps = {};

    if (onSave) {
      addProps = { onSave, config };
    }

    if (!editorMode) {
      return null;
    }

    return (
      <Measurer>
        <JournalsDashletEditor id={id} stateId={this._stateId} recordRef={this.recordRef} {...addProps} />
      </Measurer>
    );
  }

  renderJournal() {
    const { editorMode } = this.props;
    const { width } = this.state;

    if (editorMode) {
      return null;
    }

    return (
      <>
        <Measurer>
          <JournalsDashletToolbar stateId={this._stateId} isSmall={width < MIN_WIDTH_DASHLET_LARGE} />
        </Measurer>

        <JournalsDashletGrid stateId={this._stateId} isWidget />

        <JournalsDashletFooter stateId={this._stateId} />
      </>
    );
  }

  render() {
    const { journalConfig, className, dragHandleProps, editorMode } = this.props;
    const { width, isCollapsed } = this.state;

    if (!journalConfig) {
      return null;
    }

    const actions = {
      [BaseActions.HELP]: {
        onClick: () => null
      }
    };

    if (!editorMode) {
      actions[BaseActions.SETTINGS] = {
        onClick: this.showEditor
      };
      actions[BaseActions.RELOAD] = {
        onClick: this.handleReload
      };
    }

    return (
      <Dashlet
        {...this.props}
        className={classNames('ecos-journal-dashlet', className)}
        bodyClassName={'ecos-journal-dashlet__body'}
        style={{ minWidth: `${MIN_WIDTH_DASHLET_SMALL}px` }}
        title={journalConfig.meta.title || t('journal.title')}
        onGoTo={this.goToJournalsPage}
        needGoTo={width >= MIN_WIDTH_DASHLET_LARGE}
        actionConfig={actions}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        {this.renderEditor()}
        {this.renderJournal()}
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(JournalsDashlet);
