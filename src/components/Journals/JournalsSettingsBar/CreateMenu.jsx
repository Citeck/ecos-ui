import classNames from 'classnames';
import head from 'lodash/head';
import React, { useState } from 'react';

import { t } from '../../../helpers/export/util';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import Create from '../../common/icons/Create';
import { getCreateVariantKeyField } from '../service/util';

const CreateMenu = ({ createVariants, createIsLoading, onAddRecord, className, isViewNewJournal }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (createVariants.length === 1) {
    return (
      <IcoBtn
        loading={createIsLoading}
        icon={!isViewNewJournal ? 'icon-small-plus' : null}
        className={classNames('ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2', className, {
          'ecos-journal__btn_new shape': isViewNewJournal
        })}
        onClick={() => onAddRecord(head(createVariants))}
      >
        {isViewNewJournal && <Create />}
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
      isViewNewJournal={isViewNewJournal}
    >
      <TwoIcoBtn
        icons={[isViewNewJournal ? null : 'icon-small-plus', 'icon-small-down']}
        className={classNames('ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2', className, {
          'ecos-btn_mi_new ecos-journal__icon-small-down ecos-journal__btn_new create': isViewNewJournal,
          'ecos-journal__btn_new_focus': isViewNewJournal && isOpen
        })}
        title={t('journals.create-record-btn')}
      >
        {isViewNewJournal && <Create />}
      </TwoIcoBtn>
    </Dropdown>
  );
};

export default CreateMenu;
