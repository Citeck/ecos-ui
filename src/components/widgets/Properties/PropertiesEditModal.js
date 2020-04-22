import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import EcosFormModal from '../../EcosForm/EcosFormModal';
import { FORM_MODE_EDIT } from '../../EcosForm/index';

function usePrevious(value = false) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

function PropertiesEditModal(props) {
  const { record, isOpen, onFormSubmit, onFormCancel, formIsChanged } = props;
  const prev = usePrevious({ formIsChanged });
  const formRef = useRef();

  useEffect(() => {
    if (formRef.current && prev && prev.formIsChanged !== formIsChanged && formIsChanged) {
      formRef.current.onReload();
    }
  }, [record, formIsChanged]);

  return (
    <EcosFormModal
      record={record}
      onFormCancel={onFormCancel}
      onSubmit={onFormSubmit}
      isModalOpen={isOpen}
      onHideModal={onFormCancel}
      options={{
        formMode: FORM_MODE_EDIT
      }}
    />
  );
}

PropertiesEditModal.propTypes = {
  record: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onFormCancel: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired
};

export default PropertiesEditModal;
