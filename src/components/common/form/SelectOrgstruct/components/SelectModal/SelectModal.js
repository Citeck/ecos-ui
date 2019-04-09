import React, { useContext } from 'react';
import { Btn } from '../../../../btns';
import EcosModal from '../../../../EcosModal';
import Search from './Search';
import Tabs from './Tabs';
import Body from './Body';
import { SelectModalContext } from './SelectModalContext';
import { t } from '../../../../../../helpers/util';
import './SelectModal.scss';

const SelectModal = () => {
  const context = useContext(SelectModalContext);
  const { isSelectModalOpen, toggleSelectModal, onCancelSelect } = context;

  return (
    <EcosModal
      title={t('select-orgstruct.select-modal.title')}
      isOpen={isSelectModalOpen}
      hideModal={toggleSelectModal}
      className={'select-orgstruct-select-modal'}
    >
      <div className={'select-orgstruct-control-panel'}>
        <Search />
        <Tabs />
      </div>

      <Body />

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
