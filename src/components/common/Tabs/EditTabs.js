import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import ContentEditable from 'react-contenteditable';
import { deepClone, placeCaretAtEnd, t } from '../../../helpers/util';
import { Icon } from '../';
import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';
import './Tabs.scss';

const EMPTY_STR = '';

const SortableContainer = sortableContainer(({ children }) => {
  return children;
});

const SortableElement = sortableElement(({ children }) => {
  return children;
});

const DragHandle = sortableHandle(() => <Icon className="icon-drag ecos-tab-actions__icon ecos-tab-actions__icon_paler" />);

class Tab extends React.Component {
  static propTypes = {
    ...commonOneTabPropTypes,
    disabled: PropTypes.bool,
    isNew: PropTypes.bool,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func
  };

  static defaultProps = {
    ...commonOneTabDefaultProps,
    disabled: false,
    isNew: false,
    onDelete: () => null,
    onEdit: () => null
  };

  constructor(props) {
    super(props);

    this.labelRef = React.createRef();

    this.state = {
      editing: props.isNew,
      text: props.isNew ? EMPTY_STR : props.label
    };
  }

  get isEditable() {
    const { disabled } = this.props;
    const { editing } = this.state;

    return !disabled && editing;
  }

  setFocus() {
    const elm = this.labelRef.current || {};
    elm.focus();
    placeCaretAtEnd(elm);
  }

  startEdit = e => {
    if (!this.isEditable) {
      this.setState({ editing: true }, this.setFocus);
    }
    e.stopPropagation();
  };

  endEdit = () => {
    this.props.onEdit && this.props.onEdit(this.state.text);
    this.setState({ editing: false });
  };

  onChange = e => {
    this.setState({ text: e.target.value });
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
    e.stopPropagation();
    this.setState({ text: EMPTY_STR }, this.setFocus);
  };

  onReset = () => {
    if (this.isEditable) {
      this.setState({ editing: false, text: this.props.label });
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
    const { label, isActive, onClick, hasHover, hasHint, disabled, isNew, className } = this.props;
    const { text } = this.state;
    const isEdit = this.isEditable;
    const tabClassNames = classNames('ecos-tab', 'ecos-tab_editable', className, {
      'ecos-tab_active': isActive,
      'ecos-tab_hover': hasHover,
      'ecos-tab_disabled': disabled,
      'ecos-tab_editing': isEdit
    });
    const placeholder = isNew ? label : t('page-tabs.tab-name');

    return (
      <div className={tabClassNames} onClick={onClick}>
        <ContentEditable
          tagName="div"
          html={text}
          placeholder={placeholder}
          title={hasHint ? label : EMPTY_STR}
          disabled={!isEdit}
          className={classNames('ecos-tab-label', { 'ecos-tab-label_editing': isEdit })}
          innerRef={this.labelRef}
          onChange={this.onChange}
          onKeyPress={this.onKeyPress}
          onBlur={this.onReset}
          onClick={this.onClick}
        />
        <div className="ecos-tab-actions">
          {!isEdit && <Icon className="icon-edit ecos-tab-actions__icon ecos-tab-actions__icon_hidden" onClick={this.startEdit} />}
          {!isEdit && <Icon className="icon-delete ecos-tab-actions__icon ecos-tab-actions__icon_hidden" onClick={this.onDelete} />}
          {isEdit && text && <Icon className="icon-close ecos-tab-actions__icon" onClick={this.onClear} />}
          {isEdit && !text && <Icon className="icon-close ecos-tab-actions__icon" onClick={this.onDelete} />}
          {!isEdit && <DragHandle />}
        </div>
      </div>
    );
  }
}

class EditTabs extends React.Component {
  static propTypes = {
    ...commonTabsPropTypes,
    disabled: PropTypes.bool,
    onSort: PropTypes.func,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func
  };

  static defaultProps = commonTabsDefaultProps;

  onEditItem = (item, text, index) => {
    item.label = text;

    this.props.onEdit && this.props.onEdit(item, index);
  };

  onDeleteItem = (item, index) => {
    this.props.onDelete && this.props.onDelete(item, index);
  };

  handleSortEnd = ({ oldIndex, newIndex }) => {
    const { items = [], onSort = () => null } = this.props;
    const arr = deepClone(items);
    arr[newIndex] = items[oldIndex];
    arr[oldIndex] = items[newIndex];
    onSort(arr);
  };

  render() {
    const {
      items = [],
      className,
      classNameTab,
      keyField,
      valueField,
      valuePrefix,
      activeTabKey,
      hasHover,
      hasHint,
      disabled,
      onClick
    } = this.props;
    const tabsClassNames = classNames('ecos-tabs', className);

    return (
      <SortableContainer axis="x" lockAxis="x" onSortEnd={this.handleSortEnd} useDragHandle>
        <div className={tabsClassNames}>
          {items.map((item, index) => (
            <SortableElement key={`${item[keyField]}-${index}-editable`} index={index} disabled={disabled}>
              <Tab
                {...item}
                className={classNameTab}
                id={item[keyField]}
                label={classNames(valuePrefix, item[valueField])}
                isActive={item.isActive || item[keyField] === activeTabKey}
                onClick={() => onClick(item, index)}
                onDelete={() => this.onDeleteItem(item, index)}
                onEdit={text => this.onEditItem(item, text, index)}
                hasHover={hasHover}
                hasHint={hasHint}
                disabled={disabled}
              />
            </SortableElement>
          ))}
        </div>
      </SortableContainer>
    );
  }
}

export default EditTabs;
