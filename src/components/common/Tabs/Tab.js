import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ContentEditable from 'react-contenteditable';
import { sortableHandle } from 'react-sortable-hoc';
import { Tooltip } from 'reactstrap';
import uuidV4 from 'uuidv4';

import { commonOneTabDefaultProps, commonOneTabPropTypes } from './utils';
import { placeCaretAtEnd, t } from '../../../helpers/util';
import ClickOutside from '../../ClickOutside/ClickOutside';
import { Icon } from '../';

const EMPTY_STR = '';
const Labels = {
  BUTTON_EDIT: 'dashboard-settings.tabs.button.edit',
  BUTTON_DELETE: 'dashboard-settings.tabs.button.delete',
  LABEL_OPEN_MENU: 'dashboard-settings.tabs.label.menu'
};
const DragHandle = sortableHandle(() => <Icon className="icon-custom-drag-big ecos-tab-actions__icon ecos-tab-actions__icon_paler" />);

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
      id: `tab-${uuidV4()}`,
      editing: props.isNew,
      isOpenMenu: false,
      text: props.isNew ? EMPTY_STR : props.label,
      defText: `${t('page-tabs.tab-name-default')} ${props.index + 1}`
    };
  }

  componentDidMount() {
    document.addEventListener('click', this.onCloseMenu);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { index, isActive, hasHover, label, hasHint, disabled, isNew } = this.props;
    const { editing, text, isOpenMenu } = this.state;
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
      nextState.isOpenMenu !== isOpenMenu
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

  componentWillUnmount() {
    document.removeEventListener('click', this.onCloseMenu);
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

  onClose = e => {
    const { text } = this.state;

    e.persist();

    text ? this.onClear(e) : this.onDelete(e);
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

  renderMenu() {
    const isEdit = this.isEditable;

    if (isEdit) {
      return null;
    }

    const { isActive } = this.props;
    const { isOpenMenu, id } = this.state;
    const menu = [];

    menu.push(
      <div key="edit" onClick={this.startEdit} className="ecos-tab-actions__menu-item">
        <Icon className="icon-edit ecos-tab-actions__menu-item-icon" />
        <span className="ecos-tab-actions__menu-item-title">{t(Labels.BUTTON_EDIT)}</span>
      </div>
    );
    menu.push(
      <div key="delete" onClick={this.onDelete} className="ecos-tab-actions__menu-item ecos-tab-actions__menu-item_warning">
        <Icon className="icon-delete ecos-tab-actions__menu-item-icon" />
        <span className="ecos-tab-actions__menu-item-title">{t(Labels.BUTTON_DELETE)}</span>
      </div>
    );

    return (
      <>
        <Icon
          data-ignore-close-menu
          id={id}
          onClick={this.onToggleMenu}
          title={t(Labels.LABEL_OPEN_MENU)}
          className={classNames('ecos-tab-actions__icon ecos-tab-actions__icon_menu', {
            'icon-custom-more-small-normal': !isOpenMenu,
            'icon-custom-more-small-pressed ecos-tab-actions__icon_menu-opened': isOpenMenu,
            'ecos-tab-actions__icon_menu-active-tab': isActive
          })}
        />
        <Tooltip
          placement="bottom-start"
          target={id}
          trigger="click"
          boundariesElement="window"
          isOpen={isOpenMenu}
          toggle={this.onToggleMenu}
          hideArrow
          className="ecos-base-tooltip ecos-base-tooltip_opaque"
          innerClassName="ecos-base-tooltip-inner ecos-tab-actions__menu"
        >
          {menu}
        </Tooltip>
      </>
    );
  }

  renderActions() {
    const isEdit = this.isEditable;
    const actions = [];

    if (isEdit) {
      actions.push(<Icon key="close" className="icon-small-close ecos-tab-actions__icon" onClick={this.onClose} />);
    } else {
      actions.push(<React.Fragment key="menu">{this.renderMenu()}</React.Fragment>);
      actions.push(<DragHandle key="drag" />);
    }

    return <div className="ecos-tab-actions">{actions}</div>;
  }

  render() {
    const { isActive, onClick, hasHover, hasHint, disabled, className, isNew } = this.props;
    const { text, defText } = this.state;
    const isEdit = this.isEditable;
    const tabClassNames = classNames('ecos-tab ecos-tab_editable', className, {
      'ecos-tab_active': isActive,
      'ecos-tab_hover': hasHover,
      'ecos-tab_disabled': disabled,
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
      <ClickOutside className={tabClassNames} onClick={onClick} handleClickOutside={this.endEdit}>
        <ContentEditable
          tagName="div"
          html={text}
          disabled={!isEdit}
          className={classNames('ecos-tab-label', { 'ecos-tab-label_editing': isEdit })}
          innerRef={this.labelRef}
          onChange={this.onChange}
          onKeyPress={this.onKeyPress}
          onClick={this.onClick}
          onDoubleClick={this.startEdit}
          {...addProps}
        />
        {!disabled && this.renderActions()}
      </ClickOutside>
    );
  }
}

export default Tab;
