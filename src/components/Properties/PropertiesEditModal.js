import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Records from '../Records';
import EcosForm from '../EcosForm';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';

function PropertiesEditModal(props) {
  const { record, isOpen, closeModal } = props;
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
      title={`${t('ecos-table-form.edit-modal.title')} ${displayName}`}
      isOpen={isOpen}
      hideModal={closeModal}
    >
      <EcosForm record={record} onSubmit={closeModal} onFormCancel={closeModal} />
    </EcosModal>
  );
}

PropertiesEditModal.propTypes = {
  record: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired
};

PropertiesEditModal.defaultProps = {
  closeModal: () => {}
};

export default PropertiesEditModal;
