import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../helpers/export/util';
import { Well } from '../common/form';
import EcosModalHeight from '../common/EcosModal/EcosModalHeight';
import JournalsFilters from './JournalsFilters/JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup/JournalsColumnsSetup';
import JournalsGrouping from './JournalsGrouping/JournalsGrouping';
import JournalsSettingsFooter from './JournalsSettingsFooter/JournalsSettingsFooter';
import EcosModal from '../common/EcosModal';
import isEqual from 'lodash/isEqual';
import { JOURNAL_SETTING_ID_FIELD } from './constants';

class SettingsModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      predicate: get(props, 'filtersData.predicate'),
      needUpdate: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.setState({ predicate: get(this.props, 'filtersData.predicate') });
    }
  }

  getSetting = title => {
    const { journalSetting, grouping, columnsSetup } = this.props;
    const { predicate } = this.state;

    return {
      ...journalSetting,
      sortBy: columnsSetup.sortBy,
      groupBy: grouping.groupBy,
      columns: grouping.groupBy.length ? grouping.columns : columnsSetup.columns,
      predicate,
      title: title || journalSetting.title
    };
  };

  handleSetPredicate = predicate => {
    this.setState({ predicate });
    console.warn('handleSetPredicate => ', predicate);
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
      const journalSetting = this.getSetting();

      onSave(journalSetting[[JOURNAL_SETTING_ID_FIELD]], journalSetting);
    }
  };

  handleReset = () => {
    const { originSettings } = this.props;

    this.setState(
      {
        predicate: get(originSettings, 'predicate'),
        needUpdate: true
      },
      () => this.setState({ needUpdate: false })
    );
  };

  render() {
    const { filtersData, columns, meta, stateId, sourceId, journalId, isOpen, isReset, onClose, onApply, onCreate, onReset } = this.props;
    const { predicate, needUpdate } = this.state;

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
                <JournalsColumnsSetup stateId={stateId} columns={columns} />
                <JournalsGrouping stateId={stateId} columns={columns} />
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
