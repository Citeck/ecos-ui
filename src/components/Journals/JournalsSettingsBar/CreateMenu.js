import React from 'react';
import head from 'lodash/head';
import classNames from 'classnames';

import { t } from '../../../helpers/export/util';
import { IcoBtn, TwoIcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { getCreateVariantKeyField } from '../service/util';

const CreateMenu = ({ createVariants, createIsLoading, onAddRecord, className, isViewNewJournal }) => {
  if (createVariants.length === 1) {
    return (
      <IcoBtn
        loading={createIsLoading}
        colorLoader="light-blue"
        icon={'icon-small-plus'}
        className={classNames('ecos-journal__add-record ecos-btn_i ecos-btn_white ecos-btn_hover_blue2', className, {
          'ecos-journal__btn_new shape': isViewNewJournal
        })}
        onClick={() => onAddRecord(head(createVariants))}
      />
    );
  }

  const keyFields = getCreateVariantKeyField(head(createVariants));

  return (
    <Dropdown
      hasEmpty
      isButton
      source={createVariants}
      keyFields={keyFields}
      valueField="destination"
      titleField="title"
      onChange={onAddRecord}
    >
      <TwoIcoBtn
        icons={['icon-small-plus', 'icon-small-down']}
        className={classNames('ecos-journal__add-record ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2', className, {
          'ecos-btn_mi_new ecos-journal__icon-small-down ecos-journal__btn_new create': isViewNewJournal
        })}
        title={t('journals.create-record-btn')}
      />
    </Dropdown>
  );
};

export default CreateMenu;
