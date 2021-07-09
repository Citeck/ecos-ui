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

class SettingsModal extends Component {
  handleSetPredicate = predicate => {
    console.warn('handleSetPredicate => ', predicate);
  };

  render() {
    const { filtersData, columns, meta, stateId, sourceId, journalId, isOpen, isReset, onClose, onApply, onCreate, onReset } = this.props;

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
                <JournalsFilters {...filtersData} needUpdate={isReset} setPredicate={this.handleSetPredicate} />
                <JournalsColumnsSetup stateId={stateId} columns={columns} />
                <JournalsGrouping stateId={stateId} columns={columns} />
              </Scrollbars>
            )}
          </EcosModalHeight>

          <JournalsSettingsFooter
            parentClass="ecos-journal__settings"
            stateId={stateId}
            journalId={journalId}
            onApply={onApply}
            onCreate={onCreate}
            onReset={onReset}
          />
        </Well>
      </EcosModal>
    );
  }
}

export default SettingsModal;
