import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import EcosFormModal from '../../EcosForm/EcosFormModal';
import { FORM_MODE_EDIT } from '../../EcosForm/constants';

function usePrevious(value = false) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

function PropertiesEditModal(props) {
  const { record, isOpen, onFormSubmit, onFormCancel, formIsChanged, formId, assignmentPanel } = props;
  const prev = usePrevious({ formIsChanged });
  const formRef = useRef();
  const contentBefore = typeof assignmentPanel === 'function' ? assignmentPanel() : null;

  useEffect(() => {
    if (formRef.current && prev && prev.formIsChanged !== formIsChanged && formIsChanged) {
      formRef.current.onReload();
    }
  }, [record, formIsChanged]);

  return (
    <EcosFormModal
      formId={formId}
      record={record}
      onFormCancel={onFormCancel}
      onSubmit={onFormSubmit}
      isModalOpen={isOpen}
      onHideModal={onFormCancel}
      options={{
        formMode: FORM_MODE_EDIT
      }}
      contentBefore={contentBefore}
    />
  );
}

PropertiesEditModal.propTypes = {
  record: PropTypes.string.isRequired,
  formId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onFormCancel: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired
};

export default PropertiesEditModal;
