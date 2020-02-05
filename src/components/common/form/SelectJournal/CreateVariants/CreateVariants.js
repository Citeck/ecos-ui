import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Btn } from '../../../../common/btns';
import EcosForm, { FORM_MODE_CREATE } from '../../../../EcosForm/EcosForm';
import EcosModal from '../../../EcosModal';
import Records from '../../../../Records';
import Dropdown from '../../Dropdown/Dropdown';
import { IcoBtn } from '../../../btns';
import { t } from '../../../../../helpers/util';

const CreateVariants = ({ items, toggleCreateModal, isCreateModalOpen, onCreateFormSubmit }) => {
  if (!items || !items.length) {
    return null;
  }

  const [record, setRecord] = useState(null);
  const [formKey, setFormKey] = useState(null);
  const [displayName, setDisplayName] = useState();
  useEffect(() => {
    Records.get(record)
      .load('.disp')
      .then(disp => setDisplayName(disp));
  }, [record, setDisplayName]);

  let title = t('select-journal.create-modal.title');
  if (displayName) {
    title = `${title}: ${displayName}`;
  }

  let createButton;
  if (items.length === 1) {
    const onClick = () => {
      const variant = items[0];
      setRecord(variant.recordRef || `dict@${variant.type}`);
      setFormKey(variant.formKey);
      toggleCreateModal();
    };

    createButton = (
      <Btn className={'ecos-btn_blue'} onClick={onClick}>
        {t('select-journal.select-modal.create-button')}
      </Btn>
    );
  } else {
    const onSelect = variant => {
      setRecord(variant.recordRef || `dict@${variant.type}`);
      setFormKey(variant.formKey);
      toggleCreateModal();
    };

    createButton = (
      <Dropdown source={items} valueField={'type'} titleField={'title'} isStatic onChange={onSelect}>
        <IcoBtn invert icon="icon-down" className="btn_drop-down btn_r_8 btn_blue">
          {t('select-journal.select-modal.create-button')}
        </IcoBtn>
      </Dropdown>
    );
  }

  const modal = record ? (
    <EcosModal
      reactstrapProps={{
        backdrop: 'static'
      }}
      className="ecos-modal_width-lg ecos-form-modal"
      isBigHeader={true}
      title={title}
      isOpen={isCreateModalOpen}
      hideModal={toggleCreateModal}
      options={{
        formMode: FORM_MODE_CREATE
      }}
    >
      <EcosForm record={record} formKey={formKey} onSubmit={onCreateFormSubmit} onFormCancel={toggleCreateModal} />
    </EcosModal>
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
