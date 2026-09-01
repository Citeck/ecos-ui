import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import React, { useContext } from 'react';

import { getMLValue, t } from '../../../../../../helpers/util';
import { Btn, IcoBtn } from '../../../../../common/btns';
import DropdownOuter from '../../../Dropdown/DropdownOuter';
import { TableFormContext } from '../../TableFormContext';

const CreateVariants = () => {
  const context = useContext(TableFormContext);

  const { disabled, multiple, viewOnly, displayElements, customButtonName } = context.controlProps;
  const { showCreateForm, createVariants = [], gridRows } = context;

  const shouldShowCreateButton = isBoolean(get(displayElements, 'create')) ? displayElements.create : true;

  if (viewOnly || !shouldShowCreateButton) {
    return null;
  }

  const buttonClasses = classNames('ecos-btn_blue', {
    'ecos-btn_narrow': true
  });

  let createButton = null;
  let isButtonDisabled = disabled;
  if (!multiple && gridRows.length > 0) {
    isButtonDisabled = true;
  }

  const variantsToRender = [];
  if (Array.isArray(createVariants)) {
    for (let variant of createVariants) {
      const variantToRender = Object.assign({}, variant);

      if (!variantToRender.label && variantToRender.title) {
        variantToRender.label = variantToRender.title;
      }

      variantToRender.createVariantKey = `${variantToRender.id}-${variantToRender.recordRef}-${variantToRender.formKey}-${
        variantToRender.type
      }`;
      variantsToRender.push(variantToRender);
    }
  }

  if (variantsToRender.length > 0) {
    if (isButtonDisabled || variantsToRender.length === 1) {
      const onClick = () => {
        showCreateForm(variantsToRender[0]);
      };

      createButton = (
        <Btn className={buttonClasses} onClick={onClick} disabled={isButtonDisabled}>
          {getMLValue(customButtonName) || t('ecos-table-form.create-button')}
        </Btn>
      );
    } else {
      const onSelect = selected => {
        showCreateForm(selected);
      };

      // DropdownOuter, not Dropdown: the in-flow reactstrap menu is cut off by the
      // `overflow: hidden` of the inline-editing wrapper on a view form (COREDEV-369)
      createButton = (
        <DropdownOuter source={variantsToRender} valueField={'createVariantKey'} titleField={'label'} isStatic onChange={onSelect}>
          <IcoBtn invert icon="icon-small-down" className={classNames('btn_drop-down btn_r_8 btn_blue', buttonClasses)}>
            {getMLValue(customButtonName) || t('ecos-table-form.create-button')}
          </IcoBtn>
        </DropdownOuter>
      );
    }
  }

  return createButton;
};

CreateVariants.propTypes = {};

export default CreateVariants;
