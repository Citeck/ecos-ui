import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Records from '../Records';
import EcosForm from '../EcosForm';
import EcosModal from '../common/EcosModal';

function PropertiesEditModal(props) {
  const { record, isOpen, onFormSubmit, onFormCancel } = props;
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    Records.get(record)
      .load('.disp')
      .then(disp => setDisplayName(disp));
  }, [record, setDisplayName]);

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
    >
      <EcosForm record={record} onSubmit={onFormSubmit} onFormCancel={onFormCancel} />
    </EcosModal>
  );
}

PropertiesEditModal.propTypes = {
  record: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onFormCancel: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired
};

PropertiesEditModal.defaultProps = {};

export default PropertiesEditModal;
