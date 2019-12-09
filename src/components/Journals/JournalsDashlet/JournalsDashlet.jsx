import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { goToJournalsPage } from '../../../helpers/urls';
import { wrapArgs } from '../../../helpers/redux';
import { t } from '../../../helpers/util';
import { MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import { getDashletConfig, initState, reloadGrid, setDashletConfigByParams, setEditorMode, setRecordRef } from '../../../actions/journals';

import Measurer from '../../Measurer/Measurer';
import Dashlet from '../../Dashlet/Dashlet';
import JournalsDashletGrid from '../JournalsDashletGrid';
import JournalsDashletToolbar from '../JournalsDashletToolbar';
import JournalsDashletEditor from '../JournalsDashletEditor';
import JournalsDashletFooter from '../JournalsDashletFooter';

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
    initState: (id, params = {}) => dispatch(initState({ id, params })),
    getDashletConfig: id => dispatch(getDashletConfig(w(id))),
    setRecordRef: recordRef => dispatch(setRecordRef(w(recordRef))),
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setDashletConfigByParams: (id, config) => dispatch(setDashletConfigByParams(w({ id, config })))
  };
};

function mergeProps(state, dispatchProps, props) {
  const newState = get(state, ['journals', props.stateId || props.id], {});

  return {
    ...props,
    ...state,
    ...dispatchProps,
    config: props.isOnDashboard ? props.config : newState.config
  };
}

class JournalsDashlet extends Component {
  static propTypes = {
    id: PropTypes.string,
    stateId: PropTypes.string,
    dragHandleProps: PropTypes.object,
    config: PropTypes.object,
    onSave: PropTypes.func,
    isOnDashboard: PropTypes.bool,

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
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    this.props.initState(this._stateId);

    this.recordRef = queryString.parse(window.location.search).recordRef;
  }

  componentDidMount() {
    const { setRecordRef, getDashletConfig, setDashletConfigByParams, id, config, isOnDashboard } = this.props;

    setRecordRef(this.recordRef);

    if (isOnDashboard) {
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
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  showEditor = () => this.props.setEditorMode(true);

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
    const { editorMode, id, config, onSave, isOnDashboard } = this.props;

    let addProps = {};

    if (isOnDashboard) {
      addProps = { isOnDashboard, onSave, config };
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

        <JournalsDashletGrid stateId={this._stateId} />

        <JournalsDashletFooter stateId={this._stateId} />
      </>
    );
  }

  render() {
    const { journalConfig, className, reloadGrid, dragHandleProps } = this.props;
    const { width, isCollapsed } = this.state;

    if (!journalConfig) {
      return null;
    }

    return (
      <Dashlet
        {...this.props}
        className={classNames('ecos-journal-dashlet', className)}
        bodyClassName={'ecos-journal-dashlet__body'}
        title={journalConfig.meta.title || t('journal.title')}
        onReload={reloadGrid}
        onEdit={this.showEditor}
        onGoTo={this.goToJournalsPage}
        needGoTo={width >= MIN_WIDTH_DASHLET_LARGE}
        style={{
          minWidth: `${MIN_WIDTH_DASHLET_SMALL}px`
        }}
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
