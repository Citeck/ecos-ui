import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../../../helpers/util';
import Records from '../../../../Records';
import EcosForm, { FORM_MODE_CREATE } from '../../../../EcosForm/EcosForm';
import EcosModal from '../../../EcosModal';
import { Btn, IcoBtn } from '../../../btns';
import Dropdown from '../../Dropdown/Dropdown';

const CreateVariants = ({ items, toggleCreateModal, isCreateModalOpen, onCreateFormSubmit }) => {
  if (!items || !items.length) {
    return null;
  }

  const [record, setRecord] = useState(null);
  const [formKey, setFormKey] = useState(null);
  const [formId, setFormId] = useState(null);
  const [displayName, setDisplayName] = useState(null);

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
      setFormId(variant.formId);
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
      setFormId(variant.formId);
      toggleCreateModal();
    };

    createButton = (
      <Dropdown source={items} valueField={'type'} titleField={'title'} isStatic onChange={onSelect}>
        <IcoBtn invert icon="icon-small-down" className="btn_drop-down btn_r_8 btn_blue">
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
      isBigHeader
      title={title}
      isOpen={isCreateModalOpen}
      hideModal={toggleCreateModal}
    >
      <EcosForm
        record={record}
        formKey={formKey}
        formId={formId}
        onSubmit={onCreateFormSubmit}
        onFormCancel={toggleCreateModal}
        options={{
          formMode: FORM_MODE_CREATE
        }}
        initiator="form-component:SelectJournal:CreateVariants"
      />
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
