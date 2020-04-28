import React, { useContext } from 'react';
import { Btn } from '../../../../btns';
import EcosModal from '../../../../EcosModal';
import Search from './Search';
import Tabs from './Tabs';
import Body from './Body';
import { SelectOrgstructContext } from '../../SelectOrgstructContext';
import { t } from '../../../../../../helpers/util';
import './SelectModal.scss';

const SelectModal = () => {
  const context = useContext(SelectOrgstructContext);
  const { isSelectModalOpen, toggleSelectModal, onCancelSelect, onSelect, modalTitle, hideTabSwitcher } = context;

  return (
    <EcosModal
      title={modalTitle || t('select-orgstruct.select-modal.title')}
      isOpen={isSelectModalOpen}
      hideModal={toggleSelectModal}
      className={'select-orgstruct-select-modal ecos-modal_width-sm'}
    >
      <div className={'select-orgstruct-control-panel'}>
        <Search />
        {!hideTabSwitcher && <Tabs />}
      </div>

      <Body />

      <div className="select-orgstruct-select-modal__buttons">
        <Btn onClick={onCancelSelect} className={'fitnesse-select-orgstruct-select-modal__buttons-cancel'}>
          {t('select-orgstruct.select-modal.cancel-button')}
        </Btn>
        <Btn onClick={onSelect} className={'ecos-btn_blue fitnesse-select-orgstruct-select-modal__buttons-ok'}>
          {t('select-orgstruct.select-modal.ok-button')}
        </Btn>
      </div>
    </EcosModal>
  );
};

SelectModal.propTypes = {};

export default SelectModal;
