import React, { useContext } from 'react';
import { Btn } from '../../../../btns';
import EcosModal from '../../../../EcosModal';
import Tabs from '../../../../Tabs';
import Search from './Search';
import { SelectModalContext } from './SelectModalContext';
import { t } from '../../../../../../helpers/util';
import './SelectModal.scss';

const SelectModal = () => {
  const context = useContext(SelectModalContext);
  const { isSelectModalOpen, toggleSelectModal, onCancelSelect, tabs } = context;

  return (
    <EcosModal
      title={t('select-orgstruct.select-modal.title')}
      isOpen={isSelectModalOpen}
      hideModal={toggleSelectModal}
      className={'select-orgstruct-select-modal'}
    >
      <div className={'select-orgstruct-control-panel'}>
        <Search />
        <Tabs items={tabs} className={'ecos-tabs_mt-10 ecos-tabs_width-full'} />
      </div>
      <div className="select-orgstruct-select-modal__buttons">
        <Btn onClick={onCancelSelect}>{t('select-orgstruct.select-modal.cancel-button')}</Btn>
        <Btn
          className={'ecos-btn_blue'}
          onClick={() => {
            console.log('onSelect');
          }}
        >
          {t('select-orgstruct.select-modal.ok-button')}
        </Btn>
      </div>
    </EcosModal>
  );
};

SelectModal.propTypes = {};

export default SelectModal;
