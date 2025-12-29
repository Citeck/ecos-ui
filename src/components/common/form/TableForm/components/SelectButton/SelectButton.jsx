import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';

import { t } from '../../../../../../helpers/util';
import { Btn } from '../../../../../common/btns';
import { TableFormContext } from '../../TableFormContext';
import SelectJournal from '../../../SelectJournal';

const SelectButton = () => {
  const context = useContext(TableFormContext);
  const { disabled, multiple, viewOnly, displayElements, enableSelectButton, selectJournalId } = context.controlProps;
  const { gridRows, createVariants, runCloneRecord } = context;

  if (!enableSelectButton || viewOnly) {
    return null;
  }

  const shouldShowSelectButton = isBoolean(get(displayElements, 'select')) ? displayElements.select : true;
  if (!shouldShowSelectButton) {
    return null;
  }

  let isButtonDisabled = disabled;
  if (!multiple && gridRows.length > 0) {
    isButtonDisabled = true;
  }

  if (!createVariants || !createVariants.length) {
    return null;
  }

  const handleSelect = async selectedItems => {
    if (!selectedItems) {
      return;
    }

    let selectedItem;

    if (Array.isArray(selectedItems)) {
      if (selectedItems.length === 0) {
        return;
      }
      selectedItem = selectedItems[0];
    } else {
      selectedItem = selectedItems;
    }

    runCloneRecord(selectedItem);
  };

  const openSelectJournal = () => {
    let journalId = selectJournalId || '';
    if (!journalId) {
      console.warn('SelectButton: Unable to determine journalId. The select dialog will not be opened.');
      return;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const handleClose = () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    };

    ReactDOM.render(
      <SelectJournal
        journalId={journalId}
        multiple={false}
        hideCreateButton={true}
        isSelectModalOpen={true}
        title={t('ecos-table-form.select-modal-title')}
        onChange={selectedItems => {
          handleSelect(selectedItems);
          handleClose();
        }}
        onCancel={handleClose}
      />,
      container
    );
  };

  return (
    <Btn
      className={classNames('ecos-btn_blue ecos-btn_narrow ecos-table-form__select-button')}
      onClick={openSelectJournal}
      disabled={isButtonDisabled}
    >
      {t('ecos-table-form.select-button')}
    </Btn>
  );
};

export default SelectButton;
