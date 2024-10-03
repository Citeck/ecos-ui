import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { goToJournalsPage } from '../../../helpers/urls';
import { getStateId, wrapArgs } from '../../../helpers/redux';
import { extractLabel, getDOMElementMeasurer, getTextByLocale, t } from '../../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import DAction from '../../../services/DashletActionService';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import {
  execRecordsAction,
  getDashletConfig,
  initState,
  reloadGrid,
  resetState,
  setDashletConfigByParams,
  setEditorMode,
  setRecordRef,
  setSelectAllPageRecords,
  setSelectedRecords
} from '../../../actions/journals';
import { selectJournalDashletProps } from '../../../selectors/dashletJournals';
import Dashlet from '../../Dashlet';
import JournalsDashletGrid from '../../Journals/JournalsDashletGrid';
import JournalsDashletToolbar from '../../Journals/JournalsDashletToolbar';
import JournalsDashletEditor from '../../Journals/JournalsDashletEditor';
import JournalsDashletFooter from '../../Journals/JournalsDashletFooter';
import BaseWidget from '../BaseWidget';

import './JournalsDashlet.scss';
import { JOURNAL_DASHLET_CONFIG_VERSION } from '../../Journals/constants';

const Labels = {
  J_TITLE: 'journal.title',
  J_NOT_EXISTED: 'journal.not-exists.warning',
  J_NO_COLS: 'journal.no-config-columns.warning'
};

const getKey = ({ tabId = '', stateId, id }) =>
  (stateId || '').includes(tabId) && stateId === tabId ? stateId : getStateId({ tabId, id: stateId || id });

const mapStateToProps = (state, ownProps) => {
  const stateId = getKey(ownProps);
  const ownState = selectJournalDashletProps(state, stateId);

  return {
    stateId,
    isMobile: !!get(state, 'view.isMobile'),
    ...ownState
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const w = wrapArgs(getKey(ownProps));

  return {
    initState: () => dispatch(initState(getKey(ownProps))),
    resetState: () => dispatch(resetState(getKey(ownProps))),
    getDashletConfig: id => dispatch(getDashletConfig(w(id))),
    setRecordRef: recordRef => dispatch(setRecordRef(w(recordRef))),
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setDashletConfigByParams: (id, config, recordRef, lsJournalId) =>
      dispatch(setDashletConfigByParams(w({ id, config, recordRef, lsJournalId }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllPageRecords: need => dispatch(setSelectAllPageRecords(w(need))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context })))
  };
};

function mergeProps(stateProps, dispatchProps, ownProps) {
  const newState = get(stateProps, ['journals', getKey(ownProps)], {});

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    config: ownProps.onSave ? ownProps.config : newState.config
  };
}

class JournalsDashlet extends BaseWidget {
  _toolbarRef = null;
  _footerRef = null;
  _groupActionsRef = null;
  _editorRef = null;

  static propTypes = {
    id: PropTypes.string,
    stateId: PropTypes.string,
    dragHandleProps: PropTypes.object,
    config: PropTypes.object,
    onSave: PropTypes.func,

    editorMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    journalConfig: PropTypes.object,
    selectedRecords: PropTypes.array,
    selectAllPageRecords: PropTypes.bool,
    selectAllRecordsVisible: PropTypes.bool
  };

  static defaultProps = {
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      journalId: UserLocalSettingsService.getDashletProperty(this.state.lsId, 'journalId')
    };

    this.props.initState();

    this.recordRef = queryString.parse(window.location.search).recordRef;
  }

  componentDidMount() {
    super.componentDidMount();

    const { setRecordRef, getDashletConfig, setDashletConfigByParams, id, config, onSave } = this.props;
    const { journalId } = this.state;

    setRecordRef(this.recordRef);

    if (isFunction(onSave)) {
      setDashletConfigByParams(id, config, this.recordRef, journalId);
    } else {
      getDashletConfig(id);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    const { config: prevConfig } = prevProps;
    const { id, config, setDashletConfigByParams, setRecordRef, onSave } = this.props;
    const { journalId } = this.state;

    if (!isEqual(config, prevConfig) && isFunction(onSave)) {
      setRecordRef(this.recordRef);
      setDashletConfigByParams(id, config, this.recordRef, journalId);
    }
  }

  get toolbarHeight() {
    return get(this._toolbarRef, 'offsetHeight', 0);
  }

  get footerHeight() {
    return get(this._footerRef, 'offsetHeight', 0);
  }

  setToolbarRef = ref => !!ref && (this._toolbarRef = ref);

  setFooterRef = ref => !!ref && (this._footerRef = ref);

  setGroupActionsRef = ref => !!ref && (this._groupActionsRef = ref);

  setEditorRef = ref => {
    if (ref) {
      this._editorRef = ref;
    }
  };

  handleResize = width => !!width && this.setState({ width });

  showEditor = () => this.props.setEditorMode(true);

  handleReload = () => this.props.reloadGrid();

  handleUpdate() {
    super.handleUpdate();
    this.handleReload();
  }

  goToJournalsPage = () => {
    const journalSettingId = get(this.props, 'config.journalSettingId', '');
    const nodeRef = get(this.props, 'journalConfig.meta.nodeRef', '');

    goToJournalsPage({ journalId: nodeRef, journalSettingId, nodeRef });
  };

  handleChangeSelectedJournal = journalId => {
    UserLocalSettingsService.setDashletProperty(this.state.lsId, { journalId });
    this.setState({ journalId });
  };

  handleSaveConfig = (...params) => {
    const { onSave, resetState } = this.props;

    resetState();
    isFunction(onSave) && onSave(...params);
    this.handleChangeSelectedJournal('');
  };

  getMessages() {
    const { editorMode, isExistJournal, isLoading, journalConfig } = this.props;

    if (isNil(isLoading) || isLoading || editorMode) {
      return [];
    }

    const msgs = [];

    !isExistJournal && msgs.push(Labels.J_NOT_EXISTED);
    isExistJournal && isEmpty(get(journalConfig, 'columns')) && msgs.push(Labels.J_NO_COLS);

    return msgs;
  }

  get goToButtonName() {
    const { config } = this.props;

    return getTextByLocale(get(config, [JOURNAL_DASHLET_CONFIG_VERSION, 'goToButtonName']));
  }

  renderEditor() {
    const { editorMode, id, config, stateId } = this.props;

    if (!editorMode || this.isCollapsed) {
      return null;
    }

    return (
      <JournalsDashletEditor
        id={id}
        stateId={stateId}
        recordRef={this.recordRef}
        config={config}
        onSave={this.handleSaveConfig}
        measurer={getDOMElementMeasurer(this._editorRef)}
        forwardRef={this.setEditorRef}
      />
    );
  }

  renderJournal() {
    const { editorMode, stateId } = this.props;
    const { width, journalId } = this.state;

    if (editorMode || this.isCollapsed) {
      return null;
    }

    const extraIndents = this.toolbarHeight + this.footerHeight + this.dashletOtherHeight;
    const isSmall = width < MIN_WIDTH_DASHLET_LARGE;

    return (
      <>
        <JournalsDashletToolbar
          measurer={getDOMElementMeasurer(this._toolbarRef)}
          lsJournalId={journalId}
          forwardRef={this.setToolbarRef}
          stateId={stateId}
          isSmall={isSmall}
          onChangeSelectedJournal={this.handleChangeSelectedJournal}
        />

        <JournalsDashletGrid
          isBlockNewJournalFormatter
          stateId={stateId}
          isWidget
          maxHeight={MAX_DEFAULT_HEIGHT_DASHLET - extraIndents}
          selectorContainer={'.ecos-layout'}
        />

        <JournalsDashletFooter forwardRef={this.setFooterRef} stateId={stateId} isSmall={isSmall} isWidget />
      </>
    );
  }

  render() {
    const { journalConfig, className, dragHandleProps, editorMode, config, configJournalId } = this.props;
    const { width } = this.state;
    const actions = {
      [DAction.Actions.HELP]: {
        onClick: () => null
      }
    };

    if (!editorMode) {
      actions[DAction.Actions.SETTINGS] = {
        onClick: this.showEditor
      };
      actions[DAction.Actions.RELOAD] = {
        onClick: this.handleReload
      };
    }

    const warnings = this.getMessages();
    const journalName = extractLabel(get(journalConfig, 'meta.title') || get(journalConfig, 'name'));

    return (
      <Dashlet
        {...this.props}
        className={classNames('ecos-journal-dashlet', className)}
        bodyClassName={classNames('ecos-journal-dashlet__body', { 'ecos-journal-dashlet__body_warnings': !!warnings && !editorMode })}
        style={{ minWidth: `${MIN_WIDTH_DASHLET_SMALL}px` }}
        title={journalName || t(Labels.J_TITLE)}
        onGoTo={this.goToJournalsPage}
        needGoTo={width >= MIN_WIDTH_DASHLET_LARGE && !isEmpty(config) && !editorMode}
        goToButtonName={this.goToButtonName}
        actionConfig={actions}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        {warnings.map(msg => (
          <div className="alert alert-warning mb-0" key={msg}>
            {t(msg, { configJournalId, journalName }).trim()}
          </div>
        ))}
        {this.renderEditor()}
        {isEmpty(warnings) && this.renderJournal()}
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(JournalsDashlet);
