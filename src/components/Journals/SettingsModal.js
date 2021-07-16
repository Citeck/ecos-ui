import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../helpers/export/util';
import { Well } from '../common/form';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import JournalsFilters from './JournalsFilters/JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup/JournalsColumnsSetup';
import JournalsGrouping from './JournalsGrouping/JournalsGrouping';
import JournalsSettingsFooter from './JournalsSettingsFooter/JournalsSettingsFooter';
import EcosModal from '../common/EcosModal';
import { JOURNAL_SETTING_ID_FIELD } from './constants';

class SettingsModal extends Component {
  static propTypes = {
    journalSetting: PropTypes.array,
    columnsSetup: PropTypes.object,
    grouping: PropTypes.object,
    originGridSettings: PropTypes.object,
    filtersData: PropTypes.object,
    columnsData: PropTypes.object,
    groupingData: PropTypes.object,
    isReset: PropTypes.bool,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onApply: PropTypes.func,
    onCreate: PropTypes.func,
    onSave: PropTypes.func
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      predicate: cloneDeep(get(props, 'filtersData.predicate', [])),
      columns: cloneDeep(get(props, 'columnsData.columns', [])),
      sortBy: cloneDeep(get(props, 'columnsData.sortBy', [])),
      grouping: cloneDeep(get(props, 'groupingData', {})),
      needUpdate: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.setState({
        predicate: cloneDeep(get(this.props, 'filtersData.predicate', [])),
        columns: cloneDeep(get(this.props, 'columnsData.columns', [])),
        sortBy: cloneDeep(get(this.props, 'columnsData.sortBy', [])),
        grouping: cloneDeep(get(this.props, 'groupingData', {}))
      });
    }
  }

  getSetting = title => {
    const { journalSetting } = this.props;
    const { predicate, columns, sortBy, grouping } = this.state;

    return {
      ...journalSetting,
      sortBy,
      groupBy: grouping.groupBy,
      columns,
      predicate,
      title: title || journalSetting.title,
      grouping
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

  handleApply = () => {
    const { filtersData, onApply } = this.props;
    const { predicate } = this.state;

    if (typeof onApply === 'function') {
      onApply(!isEqual(predicate, get(filtersData, 'predicate')), this.getSetting());
    }
  };

  handleCreate = settingsName => {
    const { onCreate } = this.props;

    if (typeof onCreate === 'function') {
      onCreate(this.getSetting(settingsName));
    }
  };

  handleSave = () => {
    const { onSave } = this.props;

    if (typeof onSave === 'function') {
      const settings = this.getSetting();

      onSave(settings[[JOURNAL_SETTING_ID_FIELD]], settings);
    }
  };

  handleReset = () => {
    const { originGridSettings } = this.props;

    this.setState(
      {
        predicate: cloneDeep(get(originGridSettings, 'predicate')),
        sortBy: cloneDeep(get(originGridSettings, 'columnsSetup.sortBy')),
        columns: cloneDeep(get(originGridSettings, 'columnsSetup.columns')),
        grouping: cloneDeep(get(originGridSettings, 'grouping')),
        needUpdate: true
      },
      () => this.setState({ needUpdate: false })
    );
  };

  render() {
    const { filtersData, journalSetting, isOpen, isReset, onClose } = this.props;
    const { predicate, needUpdate, columns, sortBy, grouping } = this.state;

    return (
      <EcosModal
        title={t('journals.action.setting-dialog-msg')}
        isOpen={isOpen}
        hideModal={onClose}
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
                <JournalsColumnsSetup columns={columns} sortBy={sortBy} onChange={this.handleChangeColumns} />
                <JournalsGrouping grouping={grouping} allowedColumns={columns} onChange={this.handleChangeGrouping} />
              </Scrollbars>
            )}
          </EcosModalHeight>

          <JournalsSettingsFooter
            parentClass="ecos-journal__settings"
            canSave={!isEmpty(journalSetting[JOURNAL_SETTING_ID_FIELD])}
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
