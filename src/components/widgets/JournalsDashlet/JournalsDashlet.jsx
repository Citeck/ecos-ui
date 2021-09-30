import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { goToJournalsPage } from '../../../helpers/urls';
import { getStateId, wrapArgs } from '../../../helpers/redux';
import { extractLabel, getDOMElementMeasurer, t } from '../../../helpers/util';
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
  setSelectAllRecords,
  setSelectedRecords
} from '../../../actions/journals';
import { selectDashletConfig, selectDashletConfigJournalId } from '../../../selectors/journals';
import Dashlet from '../../Dashlet';
import JournalsDashletGrid from '../../Journals/JournalsDashletGrid';
import JournalsDashletToolbar from '../../Journals/JournalsDashletToolbar';
import JournalsDashletEditor from '../../Journals/JournalsDashletEditor';
import JournalsDashletFooter from '../../Journals/JournalsDashletFooter';
import { JournalsGroupActionsTools } from '../../Journals/JournalsTools';
import BaseWidget from '../BaseWidget';

import './JournalsDashlet.scss';

const Labels = {
  J_TITLE: 'journal.title',
  J_NOT_EXISTED: 'journal.not-exists.warning',
  J_NO_COLS: 'journal.no-config-columns.warning'
};

const getKey = ({ tabId = '', stateId, id }) =>
  (stateId || '').includes(tabId) && stateId === tabId ? stateId : getStateId({ tabId, id: stateId || id });

const mapStateToProps = (state, ownProps) => {
  const newState = get(state, ['journals', getKey(ownProps)], {});

  return {
    stateId: getKey(ownProps),
    editorMode: newState.editorMode,
    journalConfig: newState.journalConfig,
    config: selectDashletConfig(state, getKey(ownProps)),
    configJournalId: selectDashletConfigJournalId(state, getKey(ownProps)),
    isMobile: get(state, 'view.isMobile') === true,
    grid: newState.grid,
    selectedRecords: newState.selectedRecords,
    selectAllRecords: newState.selectAllRecords,
    selectAllRecordsVisible: newState.selectAllRecordsVisible,
    isLoading: newState.isCheckLoading || newState.loading,
    isExistJournal: newState.isExistJournal
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
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
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
    selectAllRecords: PropTypes.bool,
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
    const { id, config, setDashletConfigByParams, onSave, reloadGrid, isActiveLayout } = this.props;
    const { journalId, runUpdate } = this.state;

    if (!isEqual(config, prevConfig) && isFunction(onSave)) {
      setDashletConfigByParams(id, config, this.recordRef, journalId);
      !isActiveLayout && this.setState({ runUpdate: true });
    }

    if (isActiveLayout && runUpdate) {
      this.setState({ runUpdate: false });
      reloadGrid();
    }
  }

  get toolbarHeight() {
    return get(this._toolbarRef, 'offsetHeight', 0);
  }

  get groupActionsHeight() {
    return get(this._groupActionsRef, 'offsetHeight', 0);
  }

  get footerHeight() {
    return get(this._footerRef, 'offsetHeight', 0);
  }

  setToolbarRef = ref => {
    if (ref) {
      this._toolbarRef = ref;
    }
  };

  setFooterRef = ref => {
    if (ref) {
      this._footerRef = ref;
    }
  };

  setGroupActionsRef = ref => {
    if (ref) {
      this._groupActionsRef = ref;
    }
  };

  setEditorRef = ref => {
    if (ref) {
      this._editorRef = ref;
    }
  };

  handleResize = width => {
    !!width && this.setState({ width });
  };

  showEditor = () => this.props.setEditorMode(true);

  handleReload = () => {
    this.props.reloadGrid();
  };

  handleUpdate() {
    super.handleUpdate();
    this.handleReload();
  }

  handleSelectAllRecords = () => {
    const { setSelectAllRecords, selectAllRecords, setSelectedRecords } = this.props;

    setSelectAllRecords(!selectAllRecords);
    !selectAllRecords && setSelectedRecords([]);
  };

  handleExecuteGroupAction(action) {
    const { selectAllRecords } = this.props;
    const data = selectAllRecords ? get(this.props, 'grid.query') : get(this.props, 'selectedRecords', []);

    this.props.execRecordsAction(data, action);
  }

  goToJournalsPage = () => {
    const {
      config: { journalsListId = '', journalSettingId = '' }
    } = this.props;
    const nodeRef = get(this.props, 'journalConfig.meta.nodeRef', '');

    goToJournalsPage({ journalsListId, journalId: nodeRef, journalSettingId, nodeRef });
  };

  handleChangeSelectedJournal = journalId => {
    UserLocalSettingsService.setDashletProperty(this.state.lsId, { journalId });
    this.setState({ journalId });
  };

  handleSaveConfig = (...params) => {
    const { onSave } = this.props;

    this.props.resetState();
    isFunction(onSave) && onSave(...params);
    this.handleChangeSelectedJournal('');
  };

  getMessages() {
    const { editorMode, isExistJournal, isLoading, journalConfig } = this.props;
    const msgs = [];

    if (isLoading || editorMode) {
      return msgs;
    }

    !isExistJournal && msgs.push(Labels.J_NOT_EXISTED);
    isExistJournal && isEmpty(get(journalConfig, 'columns')) && msgs.push(Labels.J_NO_COLS);

    return msgs;
  }

  renderEditor() {
    const { editorMode, id, config, stateId } = this.props;
    const { isCollapsed } = this.state;

    if (!editorMode || isCollapsed) {
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
    const { width, isCollapsed, journalId } = this.state;

    if (editorMode || isCollapsed) {
      return null;
    }

    const { grid, isMobile, selectedRecords, selectAllRecords, selectAllRecordsVisible } = this.props;
    const extraIndents = this.toolbarHeight + this.footerHeight + this.dashletOtherHeight + this.groupActionsHeight;

    return (
      <>
        <JournalsDashletToolbar
          measurer={getDOMElementMeasurer(this._toolbarRef)}
          lsJournalId={journalId}
          forwardRef={this.setToolbarRef}
          stateId={stateId}
          isSmall={width < MIN_WIDTH_DASHLET_LARGE}
          onChangeSelectedJournal={this.handleChangeSelectedJournal}
        />

        <JournalsGroupActionsTools
          forwardedRef={this.setGroupActionsRef}
          className="ecos-journal-dashlet__group-actions"
          isMobile={isMobile}
          selectAllRecordsVisible={selectAllRecordsVisible}
          selectAllRecords={selectAllRecords}
          grid={grid}
          selectedRecords={selectedRecords}
          onExecuteAction={this.handleExecuteGroupAction.bind(this)}
          onSelectAll={this.handleSelectAllRecords}
        />

        <JournalsDashletGrid
          stateId={stateId}
          isWidget
          maxHeight={MAX_DEFAULT_HEIGHT_DASHLET - extraIndents}
          selectorContainer={'.ecos-layout'}
        />

        <JournalsDashletFooter forwardRef={this.setFooterRef} stateId={stateId} isWidget />
      </>
    );
  }

  render() {
    const { journalConfig, className, dragHandleProps, editorMode, config, configJournalId } = this.props;
    const { width, isCollapsed } = this.state;

    if (!journalConfig) {
      return null;
    }

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
        actionConfig={actions}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
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
