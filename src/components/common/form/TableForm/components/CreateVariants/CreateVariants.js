import React, { useContext } from 'react';
import classNames from 'classnames';
import { Btn, IcoBtn } from '../../../../../common/btns';
import Dropdown from '../../../Dropdown/Dropdown';
import { TableFormContext } from '../../TableFormContext';
import { t } from '../../../../../../helpers/util';

const CreateVariants = () => {
  const context = useContext(TableFormContext);

  const { isCompact, disabled, multiple } = context.controlProps;
  const { showCreateForm, createVariants, selectedRows } = context;

  const buttonClasses = classNames('ecos-btn_blue', {
    'ecos-btn_narrow': isCompact
  });

  let createButton = null;
  let isButtonDisabled = disabled;
  if (!multiple && selectedRows.length > 0) {
    isButtonDisabled = true;
  }
  if (Array.isArray(createVariants) && createVariants.length > 0) {
    if (createVariants.length === 1) {
      const onClick = () => {
        showCreateForm(createVariants[0]['type']);
      };

      createButton = (
        <Btn className={buttonClasses} onClick={onClick} disabled={isButtonDisabled}>
          {t('ecos-table-form.create-button')}
        </Btn>
      );
    } else {
      const onSelect = selected => {
        showCreateForm(selected.type);
      };

      createButton = (
        <Dropdown source={createVariants} valueField={'type'} titleField={'title'} isStatic onChange={onSelect}>
          <IcoBtn
            invert={'true'}
            icon="icon-down"
            className={classNames('btn_drop-down btn_r_8 btn_blue', buttonClasses)}
            disabled={isButtonDisabled}
          >
            {t('ecos-table-form.create-button')}
          </IcoBtn>
        </Dropdown>
      );
    }
  }

  return createButton;
};

CreateVariants.propTypes = {};

export default CreateVariants;
