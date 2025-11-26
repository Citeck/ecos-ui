import PropTypes from 'prop-types';
import React, { useState } from 'react';

import FormManager from '../../../../EcosForm/FormManager';

import ChevronRight from '@/components/common/icons/ChevronRight';
import Subtract from '@/components/common/icons/Subtract';
import { t } from '@/helpers/util';

const MenuCreateVariants = ({ items, onCreateFormSubmit }) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);

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
      <li
        onMouseEnter={() => setIsOpenMenu(true)}
        onMouseLeave={() => setIsOpenMenu(false)}
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
          <Subtract />
          <p>{t('select-journal.select-modal.create-button')}</p>
        </div>
        <ChevronRight />
        {isOpenMenu && (
          <ul className="select-journal__values-list-actions-menu absolute">
            {items.map((item, index) => (
              <li key={item.type || index} onClick={() => openForm(item)}>
                <p>{item.title}</p>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li onClick={() => openForm(items[0])}>
      <Subtract />
      <p>{t('select-journal.select-modal.create-button')}</p>
    </li>
  );
};

MenuCreateVariants.propTypes = {
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

export default MenuCreateVariants;
