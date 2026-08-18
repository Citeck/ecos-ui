import { SystemJournals } from '@citeck/constants';
import { MenuSettings } from '@citeck/constants/menu';
import Records from '@citeck/records-core';
import get from 'lodash/get';
import set from 'lodash/set';
import React from 'react';

import { Field } from '../Field';
import { Labels } from '../utils';

import Base from './Base';

import { MLText, SelectJournal } from '@/components/common/form';
import { t } from '@/helpers/export/util';
import { isFilledLabelWeak, packInLabel } from '@/helpers/util';

export default class IncludeMenu extends Base {
  type = MenuSettings.ItemTypes.INCLUDE_MENU;
  state = {
    ...super.state,
    menuRef: '',
    menuLabel: '',
    label: undefined
  };

  componentDidMount() {
    const { item } = this.props;
    const menuRef = get(item, 'config.menuRef');
    // the tree may fall back to the name of the included menu, which is a plain string, while MLText needs a multilingual value
    const label = packInLabel(get(item, 'label'));

    super.componentDidMount();
    this.setState({ menuRef, label });

    // an already saved item may have no label of its own, then the name of the included menu is used
    menuRef && this.loadMenuLabel(menuRef);
  }

  loadMenuLabel(menuRef) {
    Records.get(menuRef)
      .load('?disp')
      .then(disp => this.setState({ menuLabel: disp || '' }))
      .catch(() => this.setState({ menuLabel: '' }));
  }

  isInvalidForm() {
    const { menuRef, menuLabel } = this.state;

    return !Boolean(menuRef) || (this.isInvalidLabel && !menuLabel);
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { menuRef, label, menuLabel } = this.state;

    set(this.data, 'config.menuRef', menuRef);
    set(this.data, 'label', isFilledLabelWeak(label) ? label : menuLabel);

    onSave(this.data);
  }

  setMenu = (menuRef, data) => {
    this.setState({ menuRef, menuLabel: get(data, '[0].disp') || '' });
  };

  setLabel = label => {
    this.setState({ label });
  };

  render() {
    const { menuRef, label, menuLabel } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)} required={!menuLabel}>
          <MLText onChange={this.setLabel} value={label} placeholder={menuLabel ? `${t(Labels.DEFAULT)} ${menuLabel}` : ''} />
        </Field>
        <Field label={t(Labels.FIELD_MENU_REF)} required>
          <SelectJournal defaultValue={menuRef} onChange={this.setMenu} journalId={SystemJournals.MENUS} isSelectedValueAsText />
        </Field>
      </this.wrapperModal>
    );
  }
}
