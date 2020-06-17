import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import set from 'lodash/set';

import { extractLabel, packInLabel, t } from '../../helpers/util';
import { MenuSettings as MS } from '../../constants/menu';
import IconSelect from '../../components/IconSelect';
import { EcosIcon, EcosModal } from '../../components/common';
import { Input } from '../../components/common/form';
import { Btn } from '../../components/common/btns';
import { Field } from './Field';

import './style.scss';

const Labels = {
  FIELD_NAME_LABEL: 'menu-settings.editor-item.field.name.label',
  FIELD_URL_LABEL: 'menu-settings.editor-item.field.url.label',
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

//todo https://citeck.atlassian.net/browse/ECOSCOM-3400 for extractLabel/packInLabel

function EditorItemModal({ item, type, onClose, onSave }) {
  const defaultIcon = { value: 'icon-empty-icon', type: 'icon' };
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState(defaultIcon);
  const [isOpenSelectIcon, setOpenSelectIcon] = useState(false);
  const hasUrl = [MS.ItemTypes.ARBITRARY].includes(type.key);
  const hasIcon = ![MS.ItemTypes.HEADER_DIVIDER].includes(type.key);

  useEffect(() => {
    if (item) {
      setLabel(extractLabel(item.label));
      hasUrl && setUrl(get(item, 'config.url'));
      hasIcon && setIcon(item.icon);
    }
  }, [item]);

  const handleCancel = () => {
    onClose();
  };

  const handleApply = () => {
    const data = {};

    data.edited = !!get(item, 'id');
    data.label = packInLabel(label);
    !get(item, 'type') && (data.type = type.key);
    hasUrl && set(data, 'config.url', url);
    hasIcon && (data.icon = icon);

    onSave(data);
  };

  const handleApplyIcon = newIcon => {
    setIcon(newIcon);
    setOpenSelectIcon(false);
  };

  const isValid = () => {
    return !label;
  };

  const title =
    (!item ? t(Labels.MODAL_TITLE_ADD) : t(Labels.MODAL_TITLE_EDIT)) +
    ': ' +
    t(type.label) +
    (!!item ? ` "${extractLabel(item.label)}"` : '');

  return (
    <EcosModal className="ecos-menu-editor-item__modal ecos-modal_width-xs" isOpen hideModal={onClose} title={title}>
      <Field label={t(Labels.FIELD_NAME_LABEL)} required>
        <Input onChange={e => setLabel(e.target.value)} value={label} />
      </Field>
      {hasUrl && (
        <Field label={t(Labels.FIELD_URL_LABEL)} required>
          <Input onChange={e => setUrl(e.target.value)} value={url} />
        </Field>
      )}
      {hasIcon && (
        <Field label={t(Labels.FIELD_ICON_LABEL)} description={t(Labels.FIELD_ICON_DESC)}>
          <div className="ecos-menu-editor-item__field-icon">
            <EcosIcon data={icon} />
            <div className="ecos--flex-space" />
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => setIcon(item.icon)}>
              {t(Labels.FIELD_ICON_BTN_CANCEL)}
            </Btn>
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => setOpenSelectIcon(true)}>
              {t(Labels.FIELD_ICON_BTN_SELECT)}
            </Btn>
          </div>
          {/*todo prefix */}
          {isOpenSelectIcon && (
            <IconSelect
              prefixIcon="icon-c"
              family="menu-items"
              useFontIcons
              selectedIcon={icon}
              onClose={() => setOpenSelectIcon(false)}
              onSave={handleApplyIcon}
            />
          )}
        </Field>
      )}

      <div className="ecos-menu-editor-item__buttons">
        <Btn onClick={handleCancel}>{t(Labels.MODAL_BTN_CANCEL)}</Btn>
        <Btn onClick={handleApply} className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={isValid()}>
          {!!item ? t(Labels.MODAL_BTN_EDIT) : t(Labels.MODAL_BTN_ADD)}
        </Btn>
      </div>
    </EcosModal>
  );
}

EditorItemModal.propTypes = {
  className: PropTypes.string,
  type: PropTypes.object,
  item: PropTypes.object,
  onClose: PropTypes.func,
  onSave: PropTypes.func
};

EditorItemModal.defaultProps = {
  className: ''
};

export default EditorItemModal;
