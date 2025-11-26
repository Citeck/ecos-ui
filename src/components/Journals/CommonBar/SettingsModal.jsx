import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import EcosModal from '../../common/EcosModal';
import EcosModalHeight from '../../common/EcosModal/EcosModalHeight';
import { Well } from '../../common/form';
import JournalsColumnsSetup from '../JournalsColumnsSetup/JournalsColumnsSetup';
import JournalsFilters from '../JournalsFilters/JournalsFilters';
import JournalsGrouping from '../JournalsGrouping/JournalsGrouping';
import JournalsSettingsFooter from '../JournalsSettingsFooter/JournalsSettingsFooter';
import KanbanColumnsSettings from '../KanbanColumnsSettings/KanbanColumnsSettings';
import { JOURNAL_VIEW_MODE } from '../constants';

import { t } from '@/helpers/export/util';
import { initialStateGrouping } from '@/reducers/journals';

class SettingsModal extends Component {
  static propTypes = {
    journalSetting: PropTypes.object,
    columnsSetup: PropTypes.object,
    grouping: PropTypes.object,
    originGridSettings: PropTypes.object,
    originKanbanSettings: PropTypes.object,
    kanbanSettings: PropTypes.object,
    filtersData: PropTypes.object,
    columnsData: PropTypes.object,
    groupingData: PropTypes.object,
    isReset: PropTypes.bool,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onApply: PropTypes.func,
    onCreate: PropTypes.func,
    noCreateBtn: PropTypes.bool,
    onSave: PropTypes.func
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    const { originGridSettings, originKanbanSettings } = props;

    this.state = {
      predicate: cloneDeep(get(props, 'filtersData.predicate', get(originGridSettings, 'predicate'))),
      columns: cloneDeep(get(props, 'columnsData.columns', get(originGridSettings, 'columnsSetup.columns'))),
      sortBy: cloneDeep(get(props, 'columnsData.sortBy', get(originGridSettings, 'columnsSetup.sortBy'))),
      grouping: cloneDeep(get(props, 'groupingData', get(originGridSettings, 'grouping'))),
      kanbanColumns: cloneDeep(get(props, 'kanbanSettings.columns', get(originKanbanSettings, 'statuses'))),
      needUpdate: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { originGridSettings, originKanbanSettings } = this.props;

    if (!prevProps.isOpen && this.props.isOpen) {
      this.setState({
        predicate: cloneDeep(get(this.props, 'filtersData.predicate', get(originGridSettings, 'predicate'))),
        columns: cloneDeep(get(this.props, 'columnsData.columns', get(originGridSettings, 'columnsSetup.columns'))),
        sortBy: cloneDeep(get(this.props, 'columnsData.sortBy', get(originGridSettings, 'columnsSetup.sortBy'))),
        grouping: cloneDeep(get(this.props, 'groupingData', get(originGridSettings, 'grouping'))),
        kanbanColumns: cloneDeep(get(this.props, 'kanbanSettings.columns', get(originKanbanSettings, 'statuses')))
      });
    }
  }

  getSetting = () => {
    const { journalSetting } = this.props;
    const { predicate, columns, sortBy, grouping, kanbanColumns } = this.state;

    return {
      sortBy,
      groupBy: get(grouping, 'groupBy', []),
      columns,
      predicate,
      grouping: grouping && !isEmpty(grouping) ? grouping : initialStateGrouping,
      journalSetting,
      kanban: {
        columns: kanbanColumns
      }
    };
  };

  getCreateSetting = () => {
    const { predicate, columns: _columns, sortBy, grouping: _grouping, kanbanColumns } = this.state;
    const { journalSetting } = this.props;

    const isGrouping = _grouping && !isEmpty(_grouping);

    const columns = _columns.map(col => ({ ...col, width: null }));
    const groupingColumns = isGrouping ? get(_grouping, 'columns', []).map(col => ({ ...col, width: null })) : [];

    const grouping = isGrouping ? { ..._grouping, columns: groupingColumns } : initialStateGrouping;

    return {
      sortBy,
      groupBy: get(grouping, 'groupBy', []),
      columns,
      predicate,
      grouping,
      journalSetting,
      kanban: {
        columns: kanbanColumns
      }
    };
  };

  handleSetPredicate = predicate => {
    if (!isEqual(predicate, this.state.predicate)) {
      this.setState({ predicate });
    }
  };

  handleChangeColumns = ({ columns, sortBy }) => {
    this.setState({ columns, sortBy });
  };

  handleChangeGrouping = grouping => {
    this.setState({ grouping });
  };

  handleChangeKanbanColumns = kanbanColumns => {
    this.setState({ kanbanColumns });
  };

  handleApply = isError => {
    if (isError) {
      this.props.onClose();
      return;
    }
    const { filtersData, onApply } = this.props;
    const { predicate } = this.state;

    if (isFunction(onApply)) {
      onApply(!isEqual(predicate, get(filtersData, 'predicate')), this.getSetting());
    }
  };

  handleCreate = () => {
    const { onCreate } = this.props;
    isFunction(onCreate) && onCreate(this.getCreateSetting());
  };

  handleSave = () => {
    const { onSave } = this.props;

    if (isFunction(onSave)) {
      const setting = this.getSetting();

      onSave(setting.id, setting, this.handleApply);
    }
  };

  handleReset = () => {
    const { originGridSettings, originKanbanSettings } = this.props;

    this.setState(
      {
        predicate: cloneDeep(get(originGridSettings, 'predicate')),
        sortBy: cloneDeep(get(originGridSettings, 'columnsSetup.sortBy')),
        columns: cloneDeep(get(originGridSettings, 'columnsSetup.columns')),
        grouping: cloneDeep(get(originGridSettings, 'grouping')),
        kanbanColumns: cloneDeep(get(originKanbanSettings, 'statuses')),
        needUpdate: true
      },
      () => this.setState({ needUpdate: false })
    );
  };

  render() {
    const { filtersData, journalSetting, isOpen, isReset, onClose, noCreateBtn, viewMode } = this.props;
    const { predicate, needUpdate, columns, sortBy, grouping, kanbanColumns } = this.state;

    return (
      <EcosModal
        title={t('journals.action.setting-dialog-msg')}
        isOpen={isOpen}
        hideModal={onClose}
        reactstrapProps={{ searchZIndexModalClassName: 'ecos-modal-container' }}
        isBigHeader
        className={'ecos-modal_width-m ecos-modal_zero-padding ecos-modal_shadow'}
      >
        <Well className="ecos-journal__settings">
          <EcosModalHeight>
            {height => (
              <Scrollbars style={{ height }}>
                <JournalsFilters
                  {...filtersData}
                  predicate={predicate}
                  needUpdate={isReset || needUpdate}
                  setPredicate={this.handleSetPredicate}
                />
                {this.props.columnsData && <JournalsColumnsSetup columns={columns} sortBy={sortBy} onChange={this.handleChangeColumns} />}
                {this.props.groupingData && (
                  <JournalsGrouping
                    metaRecord={filtersData.metaRecord}
                    grouping={grouping}
                    allowedColumns={columns}
                    onChange={this.handleChangeGrouping}
                  />
                )}
                {viewMode === JOURNAL_VIEW_MODE.KANBAN && (
                  <KanbanColumnsSettings columns={kanbanColumns} onChange={this.handleChangeKanbanColumns} />
                )}
              </Scrollbars>
            )}
          </EcosModalHeight>

          <JournalsSettingsFooter
            parentClass="ecos-journal__settings"
            noCreateBtn={noCreateBtn}
            canSave={!noCreateBtn && !isEmpty(journalSetting.id)}
            onApply={this.handleApply}
            onCreate={this.handleCreate}
            onReset={this.handleReset}
            onSave={this.handleSave}
          />
        </Well>
      </EcosModal>
    );
  }
}

export default SettingsModal;
