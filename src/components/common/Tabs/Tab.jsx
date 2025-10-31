import classNames from 'classnames';
import isString from 'lodash/isString';
import PropTypes from 'prop-types';
import React from 'react';
import uuidV4 from 'uuidv4';

import { getCurrentLocale, getMLValue, t } from '../../../helpers/util';

import { Actions } from './Actions';
import EditTabForm from './EditTabForm';
import { commonOneTabDefaultProps, commonOneTabPropTypes } from './utils';

class Tab extends React.Component {
  static propTypes = {
    ...commonOneTabPropTypes,
    classNameTooltip: PropTypes.string,
    disabled: PropTypes.bool,
    isNew: PropTypes.bool,
    index: PropTypes.number,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func,
    onStartEdit: PropTypes.func
  };

  static defaultProps = {
    ...commonOneTabDefaultProps,
    classNameTooltip: '',
    disabled: false,
    isNew: false,
    index: 0
  };

  constructor(props) {
    super(props);

    this.state = {
      id: `tab-${uuidV4()}`,
      editing: false,
      isOpenMenu: false,
      isValidText: !!getMLValue(props.label).trim(),
      text: props.label,
      defText: `${t('page-tabs.tab-name-default')} ${props.index + 1}`
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.onCloseMenu);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { index, isActive, hasHover, label, hasHint, disabled, isNew } = this.props;
    const { editing, text, isOpenMenu, isOpenEditModal } = this.state;
    let needUpdate = false;

    if (
      nextProps.index !== index ||
      nextProps.isActive !== isActive ||
      nextProps.hasHover !== hasHover ||
      nextProps.label !== label ||
      nextProps.hasHint !== hasHint ||
      nextProps.disabled !== disabled ||
      nextProps.isNew !== isNew ||
      nextState.editing !== editing ||
      nextState.text !== text ||
      nextState.isOpenMenu !== isOpenMenu ||
      nextState.isOpenEditModal !== isOpenEditModal
    ) {
      needUpdate = true;
    }

    return needUpdate;
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onCloseMenu);
  }

  get isEditable() {
    const { disabled } = this.props;
    const { editing } = this.state;

    return !disabled && editing;
  }

  showEditModal = () => {
    this.setState({ isOpenEditModal: true });
  };

  hideEditModal = () => {
    this.setState({ isOpenEditModal: false });
  };

  startEdit = e => {
    if (!this.isEditable) {
      this.setState({ editing: true });

      this.props.onStartEdit && this.props.onStartEdit(this.props.index);
    }

    this.showEditModal();
    e.stopPropagation();
  };

  endEdit = () => {
    const state = {};
    const { text, defText, editing } = this.state;

    if (!editing) {
      return;
    }

    state.text = text || this.props.label || defText;
    state.editing = false;
    this.setState(state);
    this.props.onEdit && this.props.onEdit(state.text);
    this.hideEditModal();
  };

  onChange = text => {
    this.setState({ text, isValidText: !!getMLValue(text).trim() });
  };

  onClose = e => {
    const { text } = this.state;

    e.persist();

    text ? this.onClear(e) : this.onDelete(e);
  };

  onClear = e => {
    this.setState({ text: '' });
    e.stopPropagation();
  };

  onReset = () => {
    const { label, isNew } = this.props;

    if (this.isEditable) {
      if (isNew) {
        this.props.onEdit && this.props.onEdit(label);
      }
    }

    this.setState({ editing: false, text: label });
    this.hideEditModal();
  };

  onDelete = e => {
    this.props.onDelete && this.props.onDelete();
    e.stopPropagation();
  };

  onClick = e => {
    if (this.isEditable) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  onCloseMenu = () => {
    if (!this.state.isOpenMenu) {
      return;
    }

    this.setState({ isOpenMenu: false });
  };

  onToggleMenu = e => {
    this.setState({ isOpenMenu: !this.state.isOpenMenu });
    e.preventDefault();
    e.stopPropagation();
  };

  renderLocaleText = () => {
    const { text } = this.state;

    if (isString(text)) {
      return text;
    }

    return text[getCurrentLocale()];
  };

  render() {
    const { isActive, hasHover, hasHint, disabled, className, isNew, onClick, classNameTooltip } = this.props;
    const { id, isOpenMenu, text, defText, isValidText, isOpenEditModal } = this.state;
    const isEdit = this.isEditable;
    const tabClassNames = classNames('ecos-tab ecos-tab_editable', className, {
      'ecos-tab_active': isActive,
      'ecos-tab_hover': hasHover,
      'ecos-tab_editing': isEdit
    });
    const addProps = {};

    if (isNew) {
      addProps.placeholder = defText;
    }

    if (hasHint) {
      addProps.title = text;
    }

    return (
      <div className={tabClassNames} onClick={onClick}>
        <div className={classNames('ecos-tab-label', { 'ecos-tab-label_editing': isEdit })}>{this.renderLocaleText()}</div>
        <Actions
          id={id}
          isActive={isActive}
          isEditable={this.isEditable}
          isOpenMenu={isOpenMenu}
          classNameTooltip={classNameTooltip}
          disabled={disabled}
          startEdit={this.startEdit}
          onClose={this.onClose}
          onDelete={this.onDelete}
          onToggleMenu={this.onToggleMenu}
        />
        <EditTabForm
          isOpen={isOpenEditModal}
          hideModal={this.onReset}
          label={text}
          isValidText={isValidText}
          onChangeLabel={this.onChange}
          onSave={this.endEdit}
        />
      </div>
    );
  }
}

export default Tab;
