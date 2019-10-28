import React, { useContext, useEffect, useState } from 'react';
import { TableFormContext } from '../../TableFormContext';
import EcosForm, { FORM_MODE_CREATE } from '../../../../../EcosForm/EcosForm';
import EcosModal from '../../../../EcosModal';
import { t } from '../../../../../../helpers/util';
import Records from '../../../../../Records';

const ModalForm = () => {
  const context = useContext(TableFormContext);
  const { record, formMode, isModalFormOpen, toggleModal, onCreateFormSubmit, onEditFormSubmit, controlProps } = context;
  const { parentForm, isStaticModalTitle } = controlProps;

  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    if (isStaticModalTitle) {
      return;
    }
    Records.get(record)
      .load('.disp')
      .then(disp => setDisplayName(disp));
  }, [record, setDisplayName]);

  let title = formMode === FORM_MODE_CREATE ? t('ecos-table-form.create-modal.title') : t('ecos-table-form.edit-modal.title');
  if (displayName) {
    title = `${title}: ${displayName}`;
  }

  return (
    <div>
      {record ? (
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-lg"
          isBigHeader={true}
          title={title}
          isOpen={isModalFormOpen}
          hideModal={toggleModal}
        >
          <EcosForm
            record={record}
            onSubmit={formMode === FORM_MODE_CREATE ? onCreateFormSubmit : onEditFormSubmit}
            onFormCancel={toggleModal}
            saveOnSubmit={false}
            options={{
              parentForm,
              formMode
            }}
          />
        </EcosModal>
      ) : null}
    </div>
  );
};

export default ModalForm;
