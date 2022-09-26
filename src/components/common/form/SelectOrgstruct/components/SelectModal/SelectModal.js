import React, { useContext } from 'react';

import { t } from '../../../../../../helpers/util';
import { Btn } from '../../../../btns';
import EcosModal from '../../../../EcosModal';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import Search from './Search';
import Tabs from './Tabs';
import Body from './Body';

import './SelectModal.scss';
import Pagination from '../../../../Pagination/Pagination';
import { PAGINATION_SIZES, TabTypes } from '../../constants';

const Labels = {
  TITLE: 'select-orgstruct.select-modal.title',
  BUTTON_CANCEL: 'select-orgstruct.select-modal.cancel-button',
  BUTTON_OK: 'select-orgstruct.select-modal.ok-button'
};

const SelectModal = () => {
  const context = useContext(SelectOrgstructContext);
  const {
    isSelectModalOpen,
    toggleSelectModal,
    onCancelSelect,
    onSelect,
    modalTitle,
    hideTabSwitcher,
    currentTab,
    pagination,
    onChangePage
  } = context;

  return (
    <EcosModal
      title={modalTitle || t(Labels.TITLE)}
      isOpen={isSelectModalOpen}
      hideModal={toggleSelectModal}
      className="select-orgstruct-select-modal ecos-modal_width-sm"
    >
      <div className="select-orgstruct-control-panel">
        <Search />
        {!hideTabSwitcher && <Tabs />}
      </div>

      <Body />

      {currentTab === TabTypes.USERS && (
        <Pagination
          page={pagination.page}
          maxItems={pagination.count}
          total={pagination.maxCount}
          hasPageSize
          sizes={PAGINATION_SIZES}
          onChange={onChangePage}
        />
      )}

      <div className="select-orgstruct-select-modal__buttons">
        <Btn onClick={onCancelSelect} className="fitnesse-select-orgstruct-select-modal__buttons-cancel">
          {t(Labels.BUTTON_CANCEL)}
        </Btn>
        <Btn onClick={onSelect} className="ecos-btn_blue fitnesse-select-orgstruct-select-modal__buttons-ok">
          {t(Labels.BUTTON_OK)}
        </Btn>
      </div>
    </EcosModal>
  );
};

SelectModal.propTypes = {};

export default SelectModal;
