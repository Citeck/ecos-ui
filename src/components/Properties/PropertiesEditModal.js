import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Records from '../Records';
import EcosForm, { FORM_MODE_EDIT } from '../EcosForm';
import EcosModal from '../common/EcosModal';

function usePrevious(value = false) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

function PropertiesEditModal(props) {
  const { record, isOpen, onFormSubmit, onFormCancel, customButtons, formIsChanged } = props;
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
    <EcosModal
      reactstrapProps={{
        backdrop: 'static'
      }}
      className="ecos-modal_width-lg"
      isBigHeader={true}
      title={`${displayName}`}
      isOpen={isOpen}
      hideModal={onFormCancel}
      zIndex={9000}
      customButtons={customButtons}
    >
      <EcosForm ref={formRef} record={record} onSubmit={onFormSubmit} onFormCancel={onFormCancel} formMode={FORM_MODE_EDIT} />
    </EcosModal>
  );
}

PropertiesEditModal.propTypes = {
  record: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onFormCancel: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  customButtons: PropTypes.array
};

PropertiesEditModal.defaultProps = {
  customButtons: []
};

export default PropertiesEditModal;
