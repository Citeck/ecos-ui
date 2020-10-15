import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { goToJournalsPage } from '../../../helpers/urls';
import { getStateId, wrapArgs } from '../../../helpers/redux';
import { arrayCompare, t } from '../../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET, MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../../constants/index';
import DAction from '../../../services/DashletActionService';
import {
  execRecordsAction,
  getDashletConfig,
  initState,
  reloadGrid,
  setDashletConfigByParams,
  setEditorMode,
  setRecordRef,
  setSelectAllRecords,
  setSelectedRecords
} from '../../../actions/journals';

import Measurer from '../../Measurer/Measurer';
import Dashlet from '../../Dashlet';
import JournalsDashletGrid from '../../Journals/JournalsDashletGrid';
import JournalsDashletToolbar from '../../Journals/JournalsDashletToolbar';
import JournalsDashletEditor from '../../Journals/JournalsDashletEditor';
import JournalsDashletFooter from '../../Journals/JournalsDashletFooter';
import { JournalsGroupActionsTools } from '../../Journals/JournalsTools';
import BaseWidget from '../BaseWidget';

import './JournalsDashlet.scss';

const getKey = ({ tabId = '', stateId, id }) =>
  (stateId || '').includes(tabId) && stateId === tabId ? stateId : getStateId({ tabId, id: stateId || id });

const mapStateToProps = (state, ownProps) => {
  const newState = state.journals[getKey(ownProps)] || {};

  return {
    stateId: getKey(ownProps),
    editorMode: newState.editorMode,
    journalConfig: newState.journalConfig,
    config: newState.config,
    isMobile: state.view.isMobile,
    grid: newState.grid,
    selectedRecords: newState.selectedRecords,
    selectAllRecords: newState.selectAllRecords,
    selectAllRecordsVisible: newState.selectAllRecordsVisible
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const w = wrapArgs(getKey(ownProps));

  return {
    initState: () => dispatch(initState(getKey(ownProps))),
    getDashletConfig: id => dispatch(getDashletConfig(w(id))),
    setRecordRef: recordRef => dispatch(setRecordRef(w(recordRef))),
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    setDashletConfigByParams: (id, config, recordRef) => dispatch(setDashletConfigByParams(w({ id, config, recordRef }))),
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
    selectAllRecords: PropTypes.array,
    selectAllRecordsVisible: PropTypes.array
  };

  static defaultProps = {
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this.props.initState();

    this.recordRef = queryString.parse(window.location.search).recordRef;
  }

  componentDidMount() {
    super.componentDidMount();

    const { setRecordRef, getDashletConfig, setDashletConfigByParams, id, config, onSave } = this.props;

    setRecordRef(this.recordRef);

    if (onSave) {
      setDashletConfigByParams(id, config, this.recordRef);
    } else {
      getDashletConfig(id);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    const { config: prevConfig } = prevProps;
    const { id, config, setDashletConfigByParams, onSave, reloadGrid, isActiveLayout } = this.props;

    if (!arrayCompare(config, prevConfig) && !!onSave) {
      setDashletConfigByParams(id, config);
      !isActiveLayout && this.setState({ runUpdate: true });
    }

    if (isActiveLayout && this.state.runUpdate) {
      this.setState({ runUpdate: false });
      reloadGrid();
    }
  }

  get toolbarHeight() {
    return get(this._toolbarRef, 'offsetHeight', 0);
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

    if (!selectAllRecords) {
      setSelectedRecords([]);
    }
  };

  handleExecuteGroupAction(action) {
    const { selectAllRecords } = this.props;

    if (!selectAllRecords) {
      const records = get(this.props, 'selectedRecords', []);

      this.props.execRecordsAction(records, action);
    } else {
      const query = get(this.props, 'grid.query');

      this.props.execRecordsAction(query, action);
    }
  }

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
    const { editorMode, id, config, onSave, stateId } = this.props;
    const { isCollapsed } = this.state;

    let addProps = {};

    if (onSave) {
      addProps = { onSave, config };
    }

    if (!editorMode || isCollapsed) {
      return null;
    }

    return (
      <Measurer>
        <JournalsDashletEditor id={id} stateId={stateId} recordRef={this.recordRef} {...addProps} />
      </Measurer>
    );
  }

  renderJournal() {
    const { editorMode, stateId } = this.props;
    const { width, isCollapsed } = this.state;

    if (editorMode || isCollapsed) {
      return null;
    }

    const { grid, isMobile, selectedRecords, selectAllRecords, selectAllRecordsVisible } = this.props;
    const extraIndents = this.toolbarHeight + this.footerHeight + this.dashletOtherHeight;

    return (
      <>
        <Measurer>
          <JournalsDashletToolbar forwardRef={this.setToolbarRef} stateId={stateId} isSmall={width < MIN_WIDTH_DASHLET_LARGE} />
        </Measurer>

        <JournalsGroupActionsTools
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
    const { journalConfig, className, dragHandleProps, editorMode, config } = this.props;
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

    return (
      <Dashlet
        {...this.props}
        className={classNames('ecos-journal-dashlet', className)}
        bodyClassName="ecos-journal-dashlet__body"
        style={{ minWidth: `${MIN_WIDTH_DASHLET_SMALL}px` }}
        title={journalConfig.meta.title || t('journal.title')}
        onGoTo={this.goToJournalsPage}
        needGoTo={width >= MIN_WIDTH_DASHLET_LARGE && !isEmpty(config)}
        actionConfig={actions}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        setRef={this.setDashletRef}
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
