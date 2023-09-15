import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

import { TMP_ICON_EMPTY } from '../../../constants';
import { MenuSettings as MS } from '../../../constants/menu';
import { t } from '../../../helpers/export/util';
import { extractLabel, isFilledLabelWeak } from '../../../helpers/util';
import MenuSettingsService from '../../../services/MenuSettingsService';
import { EcosModal } from '../../common';
import { Btn } from '../../common/btns';
import EcosIcon from '../../common/EcosIcon';
import IconSelect from '../../IconSelect';
import { Labels } from '../utils';
import { Field } from '../Field';

import '../style.scss';

class Base extends React.Component {
  state = {
    defaultIcon: { value: TMP_ICON_EMPTY, type: 'icon' },
    isOpenSelectIcon: false,
    isLoading: false
  };
  type = undefined;
  data = {};

  constructor(props) {
    super(props);

    this.handleApplyIcon = this.handleApplyIcon.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleApply = this.handleApply.bind(this);
    this.isInvalidForm = this.isInvalidForm.bind(this);
    this.toggleIsloading = this.toggleIsloading.bind(this);
  }

  componentDidMount() {
    const { defaultIcon } = this.state;
    const { icon = defaultIcon } = this.props.item || {};
    this.setState({ icon });

    if (!this.type) {
      console.warn('Yon should define type of menu item');
    }
  }

  get title() {
    const { item, type, action } = this.props;

    return action === MS.ActionTypes.CREATE
      ? t(Labels.MODAL_TITLE_ADD, { type: t(type.label) })
      : t(Labels.MODAL_TITLE_EDIT, { type: t(type.label), name: extractLabel(get(item, 'label')) });
  }

  get permissions() {
    const { item, type, params } = this.props;
    return MenuSettingsService.getPowers({ ...item, type: type.key }, params);
  }

  handleCancel() {
    this.props.onClose();
  }

  handleApply() {
    const { icon } = this.state;
    const { hasIcon } = this.permissions;

    this.data.type = this.type;
    hasIcon && (this.data.icon = icon);
  }

  handleApplyIcon(icon) {
    this.setState({ icon, isOpenSelectIcon: false });
  }

  isInvalidForm() {
    return false;
  }

  toggleIsloading = isLoading => this.setState({ isLoading });

  get isInvalidLabel() {
    const { label } = this.state;
    return !isFilledLabelWeak(label);
  }

  wrapperModal = React.memo((props, context) => {
    const { defaultIcon = {}, icon = defaultIcon, isOpenSelectIcon, isLoading } = this.state;
    const { item, fontIcons, onClose } = this.props;
    const { hasIcon } = this.permissions;

    return (
      <EcosModal
        className="ecos-menu-editor-item__modal ecos-modal_width-sm"
        isOpen
        isLoading={isLoading}
        hideModal={onClose}
        title={this.title}
      >
        {props.children}
        {hasIcon && (
          <Field label={t(Labels.FIELD_ICON_LABEL)} description={t(Labels.FIELD_ICON_DESC)}>
            <div className="ecos-menu-editor-item__field-icon">
              <EcosIcon data={icon} defaultVal={defaultIcon.value} />
              <div className="ecos--flex-space" />
              {!isEqual(icon, defaultIcon) && (
                <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => this.handleApplyIcon(defaultIcon)}>
                  {t(Labels.FIELD_ICON_BTN_CANCEL)}
                </Btn>
              )}
              <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => this.setState({ isOpenSelectIcon: true })}>
                {t(Labels.FIELD_ICON_BTN_SELECT)}
              </Btn>
            </div>
            {isOpenSelectIcon && (
              <IconSelect
                family="menu-items"
                selectedIcon={icon}
                onClose={() => this.setState({ isOpenSelectIcon: false })}
                onSave={this.handleApplyIcon}
                myFontIcons={fontIcons}
              />
            )}
          </Field>
        )}
        <div className="ecos-menu-editor-item__buttons">
          <Btn onClick={this.handleCancel}>{t(Labels.MODAL_BTN_CANCEL)}</Btn>
          <Btn onClick={this.handleApply} className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={this.isInvalidForm()}>
            {!!item ? t(Labels.MODAL_BTN_EDIT) : t(Labels.MODAL_BTN_ADD)}
          </Btn>
        </div>
      </EcosModal>
    );
  });
}

Base.propTypes = {
  fontIcons: PropTypes.array,
  type: PropTypes.object,
  item: PropTypes.object,
  onClose: PropTypes.func,
  onSave: PropTypes.func
};

export default Base;
