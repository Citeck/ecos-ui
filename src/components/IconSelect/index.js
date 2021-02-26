import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { deleteCustomIcon, getCustomIcons, getFontIcons, uploadCustomIcon } from '../../actions/iconSelect';
import { TMP_ICON_EMPTY } from '../../constants';
import { t } from '../../helpers/util';
import { BtnUpload, EcosIcon, EcosModal, Loader } from '../../components/common';
import { Btn } from '../../components/common/btns';

import './style.scss';

const Labels = {
  TITLE: 'icon-select.title',
  BTN_DELETE_ICON: 'icon-select.btn.delete-custom',
  BTN_UPLOAD_ICON: 'icon-select.btn.upload-custom',
  BTN_CANCEL: 'icon-select.btn.cancel',
  BTN_DONE: 'icon-select.btn.done',
  ICON_CUSTOM_TITLE: 'icon-select.custom.title',
  ICON_CUSTOM_TIP: 'icon-select.custom.tip',
  ICON_CUSTOM_NONE: 'icon-select.custom.no-icons'
};

class IconSelect extends React.Component {
  state = {
    icon: {}
  };

  componentDidMount() {
    const { getCustomIcons, getFontIcons, selectedIcon, prefixIcon, family, myFontIcons, myCustomIcons } = this.props;

    isEmpty(myCustomIcons) && getCustomIcons({ family });
    isEmpty(myFontIcons) && getFontIcons(prefixIcon);

    this.setState({ icon: selectedIcon });
  }

  onCancel = () => {
    this.props.onClose();
  };

  onApply = () => {
    this.props.onSave(this.state.icon);
  };

  onUpload = files => {
    if (files && files.length) {
      const { uploadCustomIcon, family } = this.props;

      uploadCustomIcon({ file: files[0], family });
    }
  };

  onDelete = () => {
    const { deleteCustomIcon } = this.props;

    this.setState({ icon: {} });
    deleteCustomIcon(this.state.icon);
  };

  selected = item => !!item.value && item.value === get(this.state, 'icon.value');
  prevSelected = item => !!item.value && item.value === get(this.props, 'selectedIcon.value');

  get disabledDelete() {
    const { customIcons } = this.props;
    const { icon = {} } = this.state;

    return !customIcons || icon.value === TMP_ICON_EMPTY || !customIcons.find(i => i.value === icon.value);
  }

  get disabledApply() {
    const prev = get(this.props, 'selectedIcon.value');
    const next = get(this.state, 'icon.value');

    return next === TMP_ICON_EMPTY || next === prev;
  }

  renderIcons = items => {
    return isEmpty(items) ? null : (
      <div className="ecos-icon-select__option-list">
        {items
          .sort((a, b) => this.prevSelected(b) - this.prevSelected(a))
          .map((item, i) => (
            <div
              key={`${item.value}-${i}`}
              className={classNames('ecos-icon-select__option-block', { 'ecos-icon-select__option-block_selected': this.selected(item) })}
              onClick={() => this.setState({ icon: item })}
            >
              <EcosIcon
                data={item}
                family={item.family}
                className={classNames('ecos-icon-select__option-value', {
                  'ecos-icon-select__option-value_selected': this.selected(item),
                  'ecos-icon-select__option-value_prev': this.prevSelected(item)
                })}
              />
            </div>
          ))}
      </div>
    );
  };

  render() {
    const { fontIcons, customIcons, isLoading } = this.props;

    return (
      <EcosModal className="ecos-icon-select__modal ecos-modal_width-xs" isOpen hideModal={this.onCancel} title={t(Labels.TITLE)}>
        {isLoading && <Loader blur className="ecos-icon-select__loader" />}
        {this.renderIcons(fontIcons)}
        <div className="ecos-icon-select__custom-title">{t(Labels.ICON_CUSTOM_TITLE)}</div>
        {this.renderIcons(customIcons)}
        <div className="ecos-icon-select__custom-buttons">
          <BtnUpload
            label={t(Labels.BTN_UPLOAD_ICON)}
            onSelected={this.onUpload}
            accept="image/*"
            className="ecos-icon-select__custom-btn-upload"
          />
          {!this.disabledDelete && (
            <Btn className="ecos-btn_hover_light-blue2 ecos-btn_narrow" onClick={this.onDelete}>
              {t(Labels.BTN_DELETE_ICON)}
            </Btn>
          )}
        </div>
        <div className="ecos-icon-select__custom-tip">{t(Labels.ICON_CUSTOM_TIP)}</div>
        <div className="ecos-menu-editor-item__buttons">
          <Btn onClick={this.onCancel}>{t(Labels.BTN_CANCEL)}</Btn>
          <Btn onClick={this.onApply} disabled={this.disabledApply} className="ecos-btn_blue ecos-btn_hover_light-blue">
            {t(Labels.BTN_DONE)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

IconSelect.propTypes = {
  className: PropTypes.string,
  family: PropTypes.string,
  prefixIcon: PropTypes.string,
  selectedIcon: PropTypes.object,
  myCustomIcons: PropTypes.array,
  myFontIcons: PropTypes.array,
  onClose: PropTypes.func,
  onSave: PropTypes.func
};

IconSelect.defaultProps = {
  className: '',
  customIcons: []
};

const mapStateToProps = (state, props) => ({
  customIcons: isEmpty(props.myCustomIcons) ? get(state, 'iconSelect.customIcons', []) : props.myCustomIcons,
  fontIcons: isEmpty(props.myFontIcons) ? get(state, 'iconSelect.fontIcons', []) : props.myFontIcons,
  isLoading: get(state, 'iconSelect.isLoading', false)
});

const mapDispatchToProps = dispatch => ({
  getCustomIcons: data => dispatch(getCustomIcons(data)),
  getFontIcons: prefixIcon => dispatch(getFontIcons(prefixIcon)),
  uploadCustomIcon: data => dispatch(uploadCustomIcon(data)),
  deleteCustomIcon: data => dispatch(deleteCustomIcon(data))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(IconSelect);
