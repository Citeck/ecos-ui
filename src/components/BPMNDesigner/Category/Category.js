import React, { Fragment } from 'react';
import { Collapse, Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import cn from 'classnames';
import styles from './Category.module.scss';

class Category extends React.Component {
  state = {
    isCollapsed: false,
    dropdownOpen: false
  };

  toggleDropdown = e => {
    e.stopPropagation();

    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  toggleCollapse = () => {
    this.setState(prevState => ({
      isCollapsed: !prevState.isCollapsed
    }));
  };

  render() {
    const { label, level, isEditable } = this.props;

    const dropdownActionsIconClasses = cn(styles.categoryActionIcon, styles.categoryActionIcon2, {
      [styles.categoryActionIconPressed]: this.state.dropdownOpen,
      'icon-menu-normal': level === 0 && !this.state.dropdownOpen,
      'icon-menu-normal-press': level === 0 && this.state.dropdownOpen,
      'icon-menu-small': level !== 0 && !this.state.dropdownOpen,
      'icon-menu-small-press': level !== 0 && this.state.dropdownOpen
    });

    const dragNDropIconClasses = cn('icon-drag', styles.categoryActionIcon);
    const saveIconClasses = cn('icon-check', styles.categoryActionIcon);
    const cancelIconClasses = cn('icon-close', styles.categoryActionIcon);

    const mainContainerClasses = cn(styles.category, {
      [styles.categoryLevel1]: level === 1,
      [styles.categoryLevel2]: level === 2
    });

    const labelClasses = cn(styles.label, {
      [styles.labelForCollapsed]: this.state.isCollapsed
    });

    let onClickLabel = this.toggleCollapse;
    let actionButtons = (
      <Fragment>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
          <DropdownToggle tag="div">
            <span className={dropdownActionsIconClasses} />
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu}>
            <ul>
              <li>Добавить подкатегорию</li>
              <li>Переименовать</li>
              <li>Доступ</li>
              <li>Удалить</li>
            </ul>
          </DropdownMenu>
        </Dropdown>

        <span
          className={dragNDropIconClasses}
          onClick={e => {
            e.stopPropagation();
          }}
        />
      </Fragment>
    );

    let onKeyPressLabel = null;
    if (isEditable) {
      onClickLabel = () => {
        this.labelRef.focus();
      };
      onKeyPressLabel = e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // TODO save action
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          // TODO cancel action
        }
      };
      actionButtons = (
        <Fragment>
          <span
            className={cancelIconClasses}
            onClick={e => {
              e.stopPropagation();
              // TODO cancel action
            }}
          />
          <span
            className={saveIconClasses}
            onClick={e => {
              e.stopPropagation();
              // TODO save action
              // console.log(this.labelRef.innerText);
            }}
          />
        </Fragment>
      );
    }

    const labelTextClasses = cn(styles.labelText, {
      [styles.labelTextEditable]: isEditable
    });

    return (
      <div className={mainContainerClasses}>
        <div className={styles.categoryHeader}>
          <h3 className={labelClasses} onClick={onClickLabel}>
            <span
              onKeyDown={onKeyPressLabel}
              className={labelTextClasses}
              suppressContentEditableWarning
              contentEditable={isEditable}
              ref={el => (this.labelRef = el)}
            >
              {label}
            </span>
          </h3>

          <div className={styles.categoryActions}>{actionButtons}</div>
        </div>

        <Collapse isOpen={this.state.isCollapsed}>
          <div className={styles.content}>{this.props.children}</div>
        </Collapse>
      </div>
    );
  }
}

export default Category;
