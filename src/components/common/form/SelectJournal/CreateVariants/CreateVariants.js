import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../buttons/Button/Button';
import EcosForm from '../../../../EcosForm/EcosForm';
import SimpleModal from '../../../SimpleModal/SimpleModal';
import Dropdown from '../../Dropdown/Dropdown';
import { IcoBtn } from '../../../btns';
import { t } from '../../../../../helpers/util';

const CreateVariants = ({ items, toggleCreateModal, isCreateModalOpen, onCreateFormSubmit }) => {
  if (!items || !items.length) {
    return null;
  }

  const [record, setRecord] = useState(null);

  let createButton;
  if (items.length === 1) {
    const onClick = () => {
      setRecord(`dict@${items[0]['type']}`);
      toggleCreateModal();
    };

    createButton = (
      <Button className={'button_blue'} onClick={onClick}>
        {t('select-journal.select-modal.create-button')}
      </Button>
    );
  } else {
    const onSelect = selected => {
      setRecord(`dict@${selected.type}`);
      toggleCreateModal();
    };

    createButton = (
      <Dropdown source={items} valueField={'type'} titleField={'title'} isStatic onChange={onSelect}>
        <IcoBtn invert={'true'} icon="icon-down" className="btn_drop-down btn_r_8 btn_blue">
          {t('select-journal.select-modal.create-button')}
        </IcoBtn>
      </Dropdown>
    );
  }

  const modal = record ? (
    <SimpleModal title={t('select-journal.create-modal.title')} isOpen={isCreateModalOpen} hideModal={toggleCreateModal}>
      <EcosForm record={record} onSubmit={onCreateFormSubmit} onFormCancel={toggleCreateModal} />
    </SimpleModal>
  ) : null;

  return (
    <div>
      {createButton}
      {modal}
    </div>
  );
};

CreateVariants.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      canCreate: PropTypes.bool,
      isDefault: PropTypes.bool,
      type: PropTypes.string,
      formId: PropTypes.string,
      title: PropTypes.string,
      destination: PropTypes.string
      // createArguments: null
    })
  ),
  toggleCreateModal: PropTypes.func,
  onCreateFormSubmit: PropTypes.func,
  isCreateModalOpen: PropTypes.bool
};

export default CreateVariants;
