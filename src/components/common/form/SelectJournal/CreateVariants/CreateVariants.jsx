import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../../../helpers/util';
import FormManager from '../../../../EcosForm/FormManager';
import { Btn, IcoBtn } from '../../../btns';
import Dropdown from '../../Dropdown/Dropdown';

const CreateVariants = ({ items, onCreateFormSubmit }) => {
  if (!items || !items.length) {
    return null;
  }

  const openForm = variant => {
    FormManager.createRecordByVariant(variant, {
      onSubmit: onCreateFormSubmit,
      initiator: {
        type: 'form-component',
        name: 'CreateVariants'
      }
    });
  };

  if (items.length > 1) {
    return (
      <Dropdown source={items} valueField="type" titleField="title" isStatic onChange={openForm}>
        <IcoBtn invert icon="icon-small-down" className="btn_drop-down btn_r_8 btn_blue">
          {t('select-journal.select-modal.create-button')}
        </IcoBtn>
      </Dropdown>
    );
  }

  return (
    <Btn className={'ecos-btn_blue'} onClick={() => openForm(items[0])}>
      {t('select-journal.select-modal.create-button')}
    </Btn>
  );
};

CreateVariants.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      canCreate: PropTypes.bool,
      isDefault: PropTypes.bool,
      type: PropTypes.string,
      formId: PropTypes.string,
      title: PropTypes.string,
      destination: PropTypes.string
      // createArguments: null
    })
  ),
  onCreateFormSubmit: PropTypes.func
};

export default CreateVariants;
