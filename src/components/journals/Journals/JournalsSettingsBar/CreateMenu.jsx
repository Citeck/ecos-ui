import classNames from 'classnames';
import head from 'lodash/head';
import React, { useState } from 'react';

import { t } from '@/helpers/export/util';
import { IcoBtn, TwoIcoBtn } from '@/components/common/btns';
import { Dropdown } from '@/components/common/form';
import Create from '@/components/common/icons/Create';
import { getCreateVariantKeyField } from '../service/util';

const CreateMenu = ({ createVariants, createIsLoading, onAddRecord, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (createVariants.length === 1) {
    return (
      <IcoBtn
        loading={createIsLoading}
        icon={null}
        className={classNames('ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2 ecos-journal__btn_new shape', className)}
        onClick={() => onAddRecord(head(createVariants))}
      >
        <Create />
      </IcoBtn>
    );
  }

  const keyFields = getCreateVariantKeyField(head(createVariants));

  const changeIsOpen = isOpen => setIsOpen(isOpen);

  return (
    <Dropdown
      hasEmpty
      isButton
      source={createVariants}
      keyFields={keyFields}
      valueField="destination"
      titleField="title"
      onChange={onAddRecord}
      getStateOpen={changeIsOpen}
    >
      <TwoIcoBtn
        icons={[null, 'icon-small-down']}
        className={classNames(
          'ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2 ecos-btn_mi_new ecos-journal__icon-small-down ecos-journal__btn_new create',
          className,
          {
            'ecos-journal__btn_new_focus': isOpen
          }
        )}
        title={t('journals.create-record-btn')}
      >
        <Create />
      </TwoIcoBtn>
    </Dropdown>
  );
};

export default CreateMenu;
