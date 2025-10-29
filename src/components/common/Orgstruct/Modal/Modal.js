import React, { useContext } from 'react';

import { t } from '../../../../helpers/util';
import EcosModal from '../../EcosModal';
import Pagination from '../../Pagination';
import { Btn } from '../../btns';
import { OrgstructContext } from '../OrgstructContext';
import { PAGINATION_SIZES, TabTypes } from '../constants';

import Body from './Body';
import Search from './Search';
import Tabs from './Tabs';

import './Modal.scss';

const Labels = {
  TITLE: 'select-orgstruct.select-modal.title',
  BUTTON_CANCEL: 'select-orgstruct.select-modal.cancel-button',
  BUTTON_OK: 'select-orgstruct.select-modal.ok-button'
};

const Modal = () => {
  const context = useContext(OrgstructContext);
  const {
    isSelectModalOpen,
    toggleSelectModal,
    onCancelSelect,
    onSelect,
    modalTitle,
    currentTab,
    pagination,
    hideTabSwitcher,
    onChangePage,
    parent
  } = context;

  let title = modalTitle || t(Labels.TITLE);

  if (parent) {
    title += ` (${parent.label})`;
  }

  return (
    <EcosModal
      title={title}
      isOpen={isSelectModalOpen}
      hideModal={toggleSelectModal}
      className="select-orgstruct-select-modal ecos-modal_width-sm"
    >
      {!hideTabSwitcher && (
        <div className="select-orgstruct__tabs">
          <Tabs />
        </div>
      )}

      <div className="select-orgstruct__content">
        <div className="select-orgstruct-control-panel">
          <Search />
        </div>
        <Body />
      </div>

      {currentTab === TabTypes.USERS && (
        <Pagination
          page={pagination.page}
          maxItems={pagination.count}
          total={pagination.maxCount}
          hasPageSize
          sizes={PAGINATION_SIZES}
          onChange={onChangePage}
          className="select-orgstruct-select-modal__paginations"
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

Modal.propTypes = {};

export default Modal;
