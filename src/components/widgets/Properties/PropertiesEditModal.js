import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Records from '../../Records/index';
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
  const { record, isOpen, onFormSubmit, onFormCancel, formIsChanged, formId } = props;
  const [displayName, setDisplayName] = useState('');
  const prev = usePrevious({ formIsChanged });
  const formRef = useRef();

  useEffect(() => {
    Records.get(record)
      .load('.disp')
      .then(disp => setDisplayName(disp));

    if (formRef.current && prev && prev.formIsChanged !== formIsChanged && formIsChanged) {
      formRef.current.onReload();
    }
  }, [record, setDisplayName, formIsChanged]);

  return (
    <EcosFormModal
      formId={formId}
      record={record}
      onFormCancel={onFormCancel}
      onSubmit={onFormSubmit}
      title={`${displayName}`}
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
  formId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onFormCancel: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired
};

export default PropertiesEditModal;
