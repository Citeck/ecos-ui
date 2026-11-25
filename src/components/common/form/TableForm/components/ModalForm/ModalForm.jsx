import Records from '@citeck/records-core';
import React, { useContext, useEffect, useState } from 'react';

import { getMLValue, t } from '../../../../../../helpers/util';
import useIsMounted from '../../../../../../hooks/useIsMounted';
import { FORM_MODE_CLONE, FORM_MODE_CREATE, FORM_MODE_EDIT, FORM_MODE_VIEW } from '@/components/forms/EcosForm';
import EcosForm from '@/components/forms/EcosForm/EcosForm';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import EcosModal from '../../../../EcosModal';
import { TableFormContext } from '../../TableFormContext';

const resolveVariantDisplayName = variant => {
  if (!variant) {
    return '';
  }

  for (const candidate of [variant.label, variant.title, variant.name]) {
    const resolved = getMLValue(candidate);
    if (typeof resolved === 'string' && resolved.trim()) {
      return resolved;
    }
  }

  return '';
};

const ModalForm = () => {
  const context = useContext(TableFormContext);
  const {
    record,
    clonedRecord,
    createVariant,
    formMode,
    isViewOnlyForm,
    isModalFormOpen,
    toggleModal,
    onCreateFormSubmit,
    onEditFormSubmit,
    controlProps,
    computed,
    rowPosition
  } = context;

  const isMounted = useIsMounted();

  const { isStaticModalTitle, customStringForConcatWithStaticTitle } = controlProps;
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let active = true;

    if (isStaticModalTitle) {
      if (!!customStringForConcatWithStaticTitle) {
        setDisplayName(customStringForConcatWithStaticTitle);
      }
      return () => {
        active = false;
      };
    }

    if (formMode === FORM_MODE_CREATE && !record) {
      const variantLabel = resolveVariantDisplayName(createVariant);
      if (variantLabel) {
        setDisplayName(variantLabel);
        return () => {
          active = false;
        };
      }

      if (createVariant && createVariant.typeRef) {
        setDisplayName('');
        Records.get(createVariant.typeRef)
          .load('.disp')
          .then(disp => {
            if (active && isMounted()) {
              setDisplayName(getMLValue(disp) || '');
            }
          })
          .catch(() => {
            if (active && isMounted()) {
              setDisplayName('');
            }
          });
        return () => {
          active = false;
        };
      }

      setDisplayName('');
      return () => {
        active = false;
      };
    }

    setDisplayName('');
    Records.get(record)
      .load('.disp')
      .then(disp => {
        if (active && isMounted()) {
          setDisplayName(getMLValue(disp) || '');
        }
      })
      .catch(() => {
        if (active && isMounted()) {
          setDisplayName('');
        }
      });

    return () => {
      active = false;
    };
  }, [record, formMode, createVariant, isStaticModalTitle, setDisplayName, customStringForConcatWithStaticTitle]);

  let title = '';

  switch (formMode) {
    case FORM_MODE_VIEW:
      title = t('ecos-table-form.view-modal.title');
      break;
    case FORM_MODE_CREATE:
      title = t('ecos-table-form.create-modal.title');
      break;
    case FORM_MODE_CLONE:
      title = t('ecos-table-form.clone-modal.title');
      break;
    case FORM_MODE_EDIT:
      title = t('ecos-table-form.edit-modal.title');
      break;
    default:
      break;
  }

  if (displayName) {
    title = `${title}: ${displayName}`;
  }

  let { recordRef, attributes, formKey, type, sourceId, typeRef, formRef } = createVariant || {};

  if (record && computed && computed.valueFormKey) {
    formKey = computed.valueFormKey(record);
  }

  if (!recordRef && type) {
    recordRef = 'dict@' + type;
  }

  if (!recordRef && !record && sourceId) {
    recordRef = `${sourceId}@`;
  }

  let recordForForm = recordRef || record;

  const formOptions = {
    formMode: formMode === FORM_MODE_EDIT ? FORM_MODE_EDIT : FORM_MODE_CREATE,
    rowPosition
  };

  if (typeRef) {
    formOptions.typeRef = typeRef;
  }

  if (isViewOnlyForm) {
    formOptions.readOnly = true;
    formOptions.viewAsHtml = true;
    formOptions.disableInlineEdit = true;
  }

  const getOnSubmit = () => {
    switch (formMode) {
      case FORM_MODE_CREATE:
      case FORM_MODE_CLONE:
        return onCreateFormSubmit;
      case FORM_MODE_EDIT:
        return onEditFormSubmit;
      default:
        return () => null;
    }
  };

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
          <ErrorBoundary>
            <EcosForm
              formId={formRef}
              record={recordForForm}
              clonedRecord={clonedRecord}
              formKey={formKey}
              attributes={attributes}
              onSubmit={getOnSubmit()}
              onFormCancel={toggleModal}
              saveOnSubmit={false}
              options={formOptions}
              initiator={{ type: 'modal' }}
            />
          </ErrorBoundary>
        </EcosModal>
      ) : null}
    </div>
  );
};

export default ModalForm;
