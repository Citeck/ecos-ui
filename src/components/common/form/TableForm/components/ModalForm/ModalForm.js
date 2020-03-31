import React, { useContext, useEffect, useState } from 'react';
import { TableFormContext } from '../../TableFormContext';
import EcosForm, { FORM_MODE_CREATE } from '../../../../../EcosForm/EcosForm';
import EcosModal from '../../../../EcosModal';
import { t } from '../../../../../../helpers/util';
import Records from '../../../../../Records';

const ModalForm = () => {
  const context = useContext(TableFormContext);
  const {
    record,
    createVariant,
    formMode,
    isViewOnlyForm,
    isModalFormOpen,
    toggleModal,
    onCreateFormSubmit,
    onEditFormSubmit,
    controlProps,
    computed
  } = context;
  const { parentForm, isStaticModalTitle, customStringForConcatWithStaticTitle } = controlProps;

  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    if (isStaticModalTitle) {
      if (!!customStringForConcatWithStaticTitle) {
        setDisplayName(customStringForConcatWithStaticTitle);
      }
      return;
    }
    Records.get(record)
      .load('.disp')
      .then(disp => setDisplayName(disp));
  }, [record, setDisplayName, customStringForConcatWithStaticTitle]);

  let title = '';
  if (isViewOnlyForm) {
    title = t('ecos-table-form.view-modal.title');
  } else {
    title = formMode === FORM_MODE_CREATE ? t('ecos-table-form.create-modal.title') : t('ecos-table-form.edit-modal.title');
  }
  if (displayName) {
    title = `${title}: ${displayName}`;
  }

  let { recordRef, attributes, formKey, type } = createVariant || {};

  if (record && computed && computed.valueFormKey) {
    formKey = computed.valueFormKey(record);
  }

  if (!recordRef && type) {
    recordRef = 'dict@' + type;
  }

  let recordForForm = recordRef || record;

  const formOptions = {
    parentForm,
    formMode
  };

  if (isViewOnlyForm) {
    formOptions.readOnly = true;
    formOptions.viewAsHtml = true;
    formOptions.disableInlineEdit = true;
  }

  return (
    <div>
      {recordForForm ? (
        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-lg ecos-form-modal"
          isBigHeader
          title={title}
          isOpen={isModalFormOpen}
          hideModal={toggleModal}
        >
          <EcosForm
            record={recordForForm}
            formKey={formKey}
            attributes={attributes}
            onSubmit={formMode === FORM_MODE_CREATE ? onCreateFormSubmit : onEditFormSubmit}
            onFormCancel={toggleModal}
            saveOnSubmit={false}
            options={formOptions}
          />
        </EcosModal>
      ) : null}
    </div>
  );
};

export default ModalForm;
