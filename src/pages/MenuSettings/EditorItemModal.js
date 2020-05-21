import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { t } from '../../helpers/util';
import { MenuSettings as MS } from '../../constants/menu';
import { EcosModal, Icon } from '../../components/common';
import { Input } from '../../components/common/form';
import { Btn } from '../../components/common/btns';
import { Field } from './Field';

import './style.scss';

//todo consts, dictionary
function EditorItemModal({ type, onClose, onSave }) {
  const defaultIcon = { value: 'icon-empty-icon', type: 'icon' };
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState(defaultIcon);

  const cancel = () => {
    onClose();
  };

  const apply = () => {
    const dndIdx = Date.now();
    const id = `${type.key}-${dndIdx}`;

    onSave({
      name,
      icon,
      id,
      dndIdx,
      type: type.key,
      selected: true,
      editable: true,
      removable: true,
      draggable: true,
      expandable: true,
      items: []
    });
  };

  const isValid = () => {
    return !name;
  };

  return (
    <EcosModal className="ecos-menu-create-section__modal ecos-modal_width-xs" isOpen hideModal={onClose} title={t(type.label)}>
      <Field label={'Название'} required>
        <Input onChange={e => setName(e.target.value)} value={name} />
      </Field>
      {/*todo valid url*/}
      {[MS.OptionKeys.ARBITRARY].includes(type.key) && (
        <Field label={'URL'} required>
          <Input onChange={e => setUrl(e.target.value)} value={url} />
        </Field>
      )}
      {/*todo select*/}
      {![MS.OptionKeys.HEADER_DIVIDER].includes(type.key) && (
        <Field
          label={'Иконка'}
          description={
            'Чтобы иконка выглядела хорошо, используйте png 20x20 px или svg. Старайтесь использовать иконки без мелких деталей.'
          }
        >
          <div className="ecos-menu-create-section__field-icon">
            <Icon className={icon.value} />
            <div className="ecos--flex-space" />
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => setIcon(defaultIcon)}>
              Сбросить
            </Btn>
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => setIcon({ value: 'icon-exit', type: 'icon' })}>
              Выбрать другую
            </Btn>
          </div>
        </Field>
      )}

      <div className="ecos-menu-create-section__buttons">
        <Btn onClick={cancel}>Cancel</Btn>
        <Btn onClick={apply} className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={isValid()}>
          Apply
        </Btn>
      </div>
    </EcosModal>
  );
}

EditorItemModal.propTypes = {
  className: PropTypes.string,
  source: PropTypes.string,
  type: PropTypes.object,
  onClick: PropTypes.func
};

EditorItemModal.defaultProps = {
  className: ''
};

export default EditorItemModal;
