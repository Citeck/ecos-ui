import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
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
  constructor(props) {
    super(props);

    this.state = {
      predicate: get(props, 'filtersData.predicate', []),
      columns: get(props, 'columnsData.columns', []),
      sortBy: get(props, 'columnsData.sortBy', []),
      needUpdate: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.setState({
        predicate: get(this.props, 'filtersData.predicate', []),
        columns: get(this.props, 'columnsData.columns', []),
        sortBy: get(this.props, 'columnsData.sortBy', [])
      });
    }
  }

  getSetting = title => {
    const { journalSetting, grouping, columnsSetup } = this.props;
    const { predicate, columns, sortBy } = this.state;

    console.warn(grouping.groupBy.length);

    return {
      ...journalSetting,
      sortBy,
      groupBy: grouping.groupBy,
      columns, //  TODO: check this with groupBy => : grouping.groupBy.length ? columns : columnsSetup.columns,
      predicate,
      title: title || journalSetting.title
    };
  };

  handleSetPredicate = predicate => {
    if (!isEqual(predicate, this.state.predicate)) {
      this.setState({ predicate });
    }
  };

  handleChangeColumns = ({ columns, sortBy }) => {
    const newState = {};

    if (!isEqual(columns, this.state.columns)) {
      newState.columns = columns;
    }

    if (!isEqual(sortBy, this.state.sortBy)) {
      newState.sortBy = sortBy;
    }

    if (!isEmpty(newState)) {
      this.setState({ ...newState });
    }
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
        predicate: get(originGridSettings, 'predicate'),
        sortBy: get(originGridSettings, 'columnsSetup.sortBy'),
        columns: get(originGridSettings, 'columnsSetup.columns'),
        needUpdate: true
      },
      () => this.setState({ needUpdate: false })
    );
  };

  render() {
    const {
      filtersData,
      columns: propsColumns,
      meta,
      stateId,
      sourceId,
      journalId,
      isOpen,
      isReset,
      onClose,
      onApply,
      onCreate,
      onReset,
      columnsData
    } = this.props;
    const { predicate, needUpdate, columns, sortBy } = this.state;

    // if (!isOpen) {
    //   return null;
    // }

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
                <JournalsGrouping stateId={stateId} columns={propsColumns} />
              </Scrollbars>
            )}
          </EcosModalHeight>

          <JournalsSettingsFooter
            parentClass="ecos-journal__settings"
            stateId={stateId}
            journalId={journalId}
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
