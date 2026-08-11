import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../../../helpers/util';
import { Btn, IcoBtn } from '../../../btns';
import Dropdown from '../../Dropdown/Dropdown';

import { openCreateForm } from './openCreateForm';

const CreateVariants = ({ items, onCreateFormSubmit, getCreateWorkspaceId }) => {
  if (!items || !items.length) {
    return null;
  }

  const openForm = variant => openCreateForm(variant, { getCreateWorkspaceId, onSubmit: onCreateFormSubmit });

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
  onCreateFormSubmit: PropTypes.func,
  /** Returns the workspace to create a record in. An empty string means the backend decides. */
  getCreateWorkspaceId: PropTypes.func
};

export default CreateVariants;
