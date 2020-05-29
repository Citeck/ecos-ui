import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../helpers/util';
import { BtnUpload, EcosIcon, EcosModal } from '../../components/common';
import { Btn } from '../../components/common/btns';
import './style.scss';

const Labels = {
  TITLE: 'icon-select.title',
  BTN_DELETE_ICON: 'icon-select.btn.delete-custom',
  BTN_UPLOAD_ICON: 'icon-select.btn.upload-custom',
  BTN_CANCEL: 'icon-select.btn.cancel',
  BTN_DONE: 'icon-select.btn.done',
  ICON_CUSTOM_TITLE: 'icon-select.custom.title',
  ICON_CUSTOM_TIP: 'icon-select.custom.tip'
};

function IconSelect({ selectedIcon, onClose, onSave, prefixIcon, useFontIcons, customIcons: original }) {
  const defaultIcon = { value: 'icon-empty-icon', type: 'icon' };
  const [icon, setIcon] = useState(defaultIcon);
  const [fontIcons, setFontIcons] = useState([]);
  const [isLoadingIcon, setLoadingIcon] = useState(false);
  const [customIcons, setCustomItems] = useState([]);

  useEffect(() => {
    setIcon(selectedIcon);
  }, [selectedIcon]);

  useEffect(() => {
    setCustomItems(original);
  }, [original]);

  useEffect(() => {
    if (useFontIcons) {
      import('../../fonts/citeck/config.json')
        .then(module => (module.glyphs || []).map(item => ({ value: `icon-${item.css}`, type: 'icon' })))
        .then(icons => {
          if (prefixIcon) {
            setFontIcons(icons.filter(item => item.value.startsWith(prefixIcon)));
          } else {
            setFontIcons(icons);
          }
        });
    }
  }, [prefixIcon, useFontIcons]);

  const onCancel = () => {
    onClose();
  };

  const onApply = () => {
    onSave(icon);
  };

  const onUpload = files => {
    //todo result
    if (files && files.length) {
      setLoadingIcon(true);
      const reader = new FileReader();
      reader.onload = e => {
        const img = { url: e.target.result, type: 'img' };
        setCustomItems([...customIcons, img]);
        setIcon(img);
      };
      reader.readAsDataURL(files[0]);

      let p = new Promise(resolve => {
        setTimeout(resolve, 3000);
      });
      p.then(r => setLoadingIcon(false));
    }
  };

  const onDelete = () => {
    //todo del icon
  };

  const selected = item => !!item.value && item.value === icon.value;
  const prev = item => !!item.value && item.value === selectedIcon.value;

  const renderIcons = items => {
    return (
      <div className="ecos-icon-select__option-list">
        {items &&
          items.map((item, i) => (
            <div
              key={`${item.value}-${i}`}
              className={classNames('ecos-icon-select__option-block', { 'ecos-icon-select__option-block_selected': selected(item) })}
              onClick={() => setIcon(item)}
            >
              <EcosIcon
                data={item}
                className={classNames('ecos-icon-select__option-value', {
                  'ecos-icon-select__option-value_selected': selected(item),
                  'ecos-icon-select__option-value_prev': prev(item)
                })}
              />
            </div>
          ))}
      </div>
    );
  };

  return (
    <EcosModal className="ecos-icon-select__modal ecos-modal_width-xs" isOpen hideModal={onClose} title={t(Labels.TITLE)}>
      {renderIcons(fontIcons)}
      <div className="ecos-icon-select__custom-title">{t(Labels.ICON_CUSTOM_TITLE)}</div>
      {renderIcons(customIcons)}
      <div className="ecos-icon-select__custom-buttons">
        <BtnUpload
          label={t(Labels.BTN_UPLOAD_ICON)}
          loading={isLoadingIcon}
          onSelected={onUpload}
          accept="image/*"
          className="ecos-icon-select__custom-btn-upload"
        />
        <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={onDelete}>
          {t(Labels.BTN_DELETE_ICON)}
        </Btn>
      </div>
      <div className="ecos-icon-select__custom-tip">{t(Labels.ICON_CUSTOM_TIP)}</div>
      <div className="ecos-menu-editor-item__buttons">
        <Btn onClick={onCancel}>{t(Labels.BTN_CANCEL)}</Btn>
        <Btn onClick={onApply} className="ecos-btn_blue ecos-btn_hover_light-blue">
          {t(Labels.BTN_DONE)}
        </Btn>
      </div>
    </EcosModal>
  );
}

IconSelect.propTypes = {
  className: PropTypes.string,
  source: PropTypes.string,
  type: PropTypes.object,
  onClick: PropTypes.func,
  useFontIcons: PropTypes.bool,
  prefixIcon: PropTypes.string,
  customIcons: PropTypes.array
};

IconSelect.defaultProps = {
  className: '',
  customIcons: []
};

export default IconSelect;
