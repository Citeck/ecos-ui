import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import set from 'lodash/set';

import { extractLabel, packInLabel, t } from '../../helpers/util';
import { decodeLink } from '../../helpers/urls';
import { TMP_ICON_EMPTY } from '../../constants';
import { MenuSettings as MS } from '../../constants/menu';
import MenuSettingsService from '../../services/MenuSettingsService';
import IconSelect from '../IconSelect';
import { EcosIcon, EcosModal } from '../common';
import { Checkbox, Input, MLText } from '../common/form';
import { Btn } from '../common/btns';
import { Field } from './Field';

import './style.scss';

const Labels = {
  FIELD_NAME_LABEL: 'menu-settings.editor-item.field.name.label',
  FIELD_HIDE_NAME_LABEL: 'menu-settings.editor-item.field.checkbox.hide-name',
  FIELD_URL_LABEL: 'menu-settings.editor-item.field.url.label',
  FIELD_URL_DESC: 'menu-settings.editor-item.field.url.desc',
  FIELD_ICON_LABEL: 'menu-settings.editor-item.field.icon.label',
  FIELD_ICON_BTN_CANCEL: 'menu-settings.editor-item.field.icon.btn.cancel',
  FIELD_ICON_BTN_SELECT: 'menu-settings.editor-item.field.icon.btn.select',
  FIELD_ICON_DESC: 'icon-select.custom.tip',
  MODAL_TITLE_ADD: 'menu-settings.editor-item.title.add',
  MODAL_TITLE_EDIT: 'menu-settings.editor-item.title.edit',
  MODAL_BTN_CANCEL: 'menu-settings.editor-item.btn.cancel',
  MODAL_BTN_ADD: 'menu-settings.editor-item.btn.add',
  MODAL_BTN_EDIT: 'menu-settings.editor-item.btn.edit'
};

function EditorItemModal({ item, type, onClose, onSave, action, params, fontIcons }) {
  const defaultIcon = { value: TMP_ICON_EMPTY, type: 'icon' };
  const { hasUrl, hasIcon, hideableLabel } = MenuSettingsService.getActionPermissions({ ...item, type: type.key }, params);
  const [label, setLabel] = useState({});
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState(defaultIcon);
  const [hiddenLabel, setHiddenLabel] = useState(false);
  const [isOpenSelectIcon, setOpenSelectIcon] = useState(false);

  useEffect(() => {
    if (action === MS.ActionTypes.EDIT) {
      setLabel(item.label);
      hasUrl && setUrl(get(item, 'config.url'));
      hasIcon && setIcon(item.icon);
      hideableLabel && setHiddenLabel(get(item, 'config.hiddenLabel'));
    }
  }, [item]);

  const handleCancel = () => {
    onClose();
  };

  const handleApply = () => {
    const data = {};

    data.label = label;
    !get(item, 'type') && (data.type = type.key);
    hasUrl && set(data, 'config.url', url);
    hasIcon && (data.icon = icon);
    hideableLabel && set(data, 'config.hiddenLabel', hiddenLabel);

    onSave(data);
  };

  const handleApplyIcon = newIcon => {
    setIcon(newIcon);
    setOpenSelectIcon(false);
  };

  const isNotValid = () => {
    const _label = packInLabel(label);

    return Object.values(_label).every(val => !val) || (hasUrl && !url);
  };

  const title =
    action === MS.ActionTypes.CREATE
      ? t(Labels.MODAL_TITLE_ADD, { type: t(type.label) })
      : t(Labels.MODAL_TITLE_EDIT, { type: t(type.label), name: extractLabel(item.label) });

  const urlDesc = decodeLink(t(Labels.FIELD_URL_DESC, { origin: window.location.origin, pathname: window.location.pathname, value: url }));

  return (
    <EcosModal className="ecos-menu-editor-item__modal ecos-modal_width-xs" isOpen hideModal={onClose} title={title}>
      <Field label={t(Labels.FIELD_NAME_LABEL)} required>
        <MLText onChange={setLabel} value={label} disabled={hiddenLabel} />
      </Field>
      {hideableLabel && (
        <Field>
          <Checkbox checked={hiddenLabel} onChange={f => setHiddenLabel(f.checked)} className="ecos-checkbox_flex">
            {t(Labels.FIELD_HIDE_NAME_LABEL)}
          </Checkbox>
        </Field>
      )}
      {hasUrl && (
        <Field label={t(Labels.FIELD_URL_LABEL)} required description={urlDesc}>
          <Input onChange={e => setUrl(e.target.value)} value={url} />
        </Field>
      )}
      {hasIcon && (
        <Field label={t(Labels.FIELD_ICON_LABEL)} description={t(Labels.FIELD_ICON_DESC)}>
          <div className="ecos-menu-editor-item__field-icon">
            <EcosIcon data={icon} />
            <div className="ecos--flex-space" />
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => setIcon(defaultIcon)}>
              {t(Labels.FIELD_ICON_BTN_CANCEL)}
            </Btn>
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => setOpenSelectIcon(true)}>
              {t(Labels.FIELD_ICON_BTN_SELECT)}
            </Btn>
          </div>
          {isOpenSelectIcon && (
            <IconSelect
              family="menu-items"
              selectedIcon={icon}
              onClose={() => setOpenSelectIcon(false)}
              onSave={handleApplyIcon}
              myFontIcons={fontIcons}
            />
          )}
        </Field>
      )}

      <div className="ecos-menu-editor-item__buttons">
        <Btn onClick={handleCancel}>{t(Labels.MODAL_BTN_CANCEL)}</Btn>
        <Btn onClick={handleApply} className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={isNotValid()}>
          {!!item ? t(Labels.MODAL_BTN_EDIT) : t(Labels.MODAL_BTN_ADD)}
        </Btn>
      </div>
    </EcosModal>
  );
}

EditorItemModal.propTypes = {
  fontIcons: PropTypes.array,
  type: PropTypes.object,
  item: PropTypes.object,
  onClose: PropTypes.func,
  onSave: PropTypes.func
};

export default EditorItemModal;
