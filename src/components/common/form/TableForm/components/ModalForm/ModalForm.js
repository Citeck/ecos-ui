import React, { useContext } from 'react';
import { TableFormContext, FORM_MODE_CREATE } from '../../TableFormContext';
import EcosForm from '../../../../../EcosForm/EcosForm';
import EcosModal from '../../../../EcosModal';
import { t } from '../../../../../../helpers/util';

const ModalForm = () => {
  const context = useContext(TableFormContext);
  const { record, formMode, isModalFormOpen, toggleModal, onCreateFormSubmit, onEditFormSubmit } = context;

  return (
    <div>
      {record ? (
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-lg"
          isBigHeader={true}
          title={t('select-journal.create-modal.title')}
          isOpen={isModalFormOpen}
          hideModal={toggleModal}
        >
          <EcosForm
            record={record}
            onSubmit={formMode === FORM_MODE_CREATE ? onCreateFormSubmit : onEditFormSubmit}
            onFormCancel={toggleModal}
            saveOnSubmit={false}
          />
        </EcosModal>
      ) : null}
    </div>
  );
};

export default ModalForm;
