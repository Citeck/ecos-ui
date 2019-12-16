import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ContentEditable from 'react-contenteditable';
import { sortableHandle } from 'react-sortable-hoc';

import { commonOneTabDefaultProps, commonOneTabPropTypes } from './utils';
import { placeCaretAtEnd, t } from '../../../helpers/util';
import ClickOutside from '../../ClickOutside/ClickOutside';
import { Icon } from '../index';

const EMPTY_STR = '';
const DragHandle = sortableHandle(() => <Icon className="icon-drag ecos-tab-actions__icon ecos-tab-actions__icon_paler" />);

class Tab extends React.Component {
  static propTypes = {
    ...commonOneTabPropTypes,
    disabled: PropTypes.bool,
    isNew: PropTypes.bool,
    index: PropTypes.number,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func,
    onStartEdit: PropTypes.func
  };

  static defaultProps = {
    ...commonOneTabDefaultProps,
    disabled: false,
    isNew: false,
    index: 0
  };

  constructor(props) {
    super(props);

    this.labelRef = React.createRef();

    this.state = {
      editing: props.isNew,
      text: props.isNew ? EMPTY_STR : props.label,
      defText: `${t('page-tabs.tab-name-default')} ${props.index + 1}`
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { index, isActive, hasHover, label, hasHint, disabled, isNew } = this.props;
    const { editing, text } = this.state;
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
      nextState.text !== text
    ) {
      needUpdate = true;
    }

    return needUpdate;
  }

  componentDidUpdate(prevProps) {
    if (this.props.isNew && prevProps.isNew) {
      this.setFocus();
    }
  }

  get isEditable() {
    const { disabled } = this.props;
    const { editing } = this.state;

    return !disabled && editing;
  }

  setFocus(scrollLeft) {
    const elm = this.labelRef.current || {};

    elm.focus();
    elm.scrollLeft = scrollLeft ? 0 : elm.scrollWidth;
    placeCaretAtEnd(elm);
  }

  startEdit = e => {
    if (!this.isEditable) {
      this.setState({ editing: true }, this.setFocus);

      this.props.onStartEdit && this.props.onStartEdit(this.props.index);
    }

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

    this.setState(state, () => {
      const elm = this.labelRef.current || {};
      elm.scrollLeft = 0;
    });

    this.props.onEdit && this.props.onEdit(state.text);
  };

  onChange = ({ target: { value: text } }) => {
    this.setState({ text });
  };

  onKeyPress = e => {
    switch (e.key) {
      case 'Enter':
        this.endEdit();
        e.preventDefault();
        break;
      case 'Escape':
        this.onReset();
        e.preventDefault();
        break;
      default:
        break;
    }

    e.stopPropagation();
  };

  onClear = e => {
    this.setState({ text: EMPTY_STR }, this.setFocus.bind(this, true));
    e.stopPropagation();
  };

  onReset = () => {
    const { label, isNew } = this.props;

    if (this.isEditable) {
      if (isNew) {
        this.props.onEdit && this.props.onEdit(label);
      }

      this.setState({ editing: false, text: label }, this.setFocus.bind(this, true));
    }
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

  render() {
    const { isActive, onClick, hasHover, hasHint, disabled, className, isNew } = this.props;
    const { text, defText } = this.state;
    const isEdit = this.isEditable;
    const tabClassNames = classNames('ecos-tab', 'ecos-tab_editable', className, {
      'ecos-tab_active': isActive,
      'ecos-tab_hover': hasHover,
      'ecos-tab_disabled': disabled,
      'ecos-tab_editing': isEdit
    });
    const placeholder = isNew ? defText : '';

    return (
      <ClickOutside className={tabClassNames} onClick={onClick} handleClickOutside={this.endEdit}>
        <ContentEditable
          tagName="div"
          html={text}
          placeholder={placeholder}
          title={hasHint ? text : EMPTY_STR}
          disabled={!isEdit}
          className={classNames('ecos-tab-label', { 'ecos-tab-label_editing': isEdit })}
          innerRef={this.labelRef}
          onChange={this.onChange}
          onKeyPress={this.onKeyPress}
          onClick={this.onClick}
        />
        <div className="ecos-tab-actions">
          {!isEdit && <Icon className="icon-edit ecos-tab-actions__icon ecos-tab-actions__icon_hidden" onClick={this.startEdit} />}
          {!isEdit && <Icon className="icon-delete ecos-tab-actions__icon ecos-tab-actions__icon_hidden" onClick={this.onDelete} />}
          {isEdit && text && <Icon className="icon-close ecos-tab-actions__icon" onClick={this.onClear} />}
          {isEdit && !text && <Icon className="icon-close ecos-tab-actions__icon" onClick={this.onDelete} />}
          {!isEdit && <DragHandle />}
        </div>
      </ClickOutside>
    );
  }
}

export default Tab;
