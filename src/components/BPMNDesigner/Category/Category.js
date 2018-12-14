import React from 'react';
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
    const { label, level } = this.props;

    const dropdownActionsIconClasses = cn(styles.categoryActionIcon, styles.categoryActionIcon2, {
      [styles.categoryActionIconPressed]: this.state.dropdownOpen,
      'icon-menu-normal': level === 0,
      'icon-menu-normal-press': level === 0 && this.state.dropdownOpen,
      'icon-menu-small': level !== 0,
      'icon-menu-small-press': level !== 0 && this.state.dropdownOpen
    });

    const dragNDropIconClasses = cn('icon-drag', styles.categoryActionIcon);

    const mainContainerClasses = cn(styles.category, {
      [styles.categoryLevel1]: level === 1,
      [styles.categoryLevel2]: level === 2
    });

    const labelClasses = cn(styles.label, {
      [styles.labelForCollapsed]: this.state.isCollapsed
    });

    return (
      <div className={mainContainerClasses}>
        <div className={styles.categoryHeader}>
          <h3 className={labelClasses} onClick={this.toggleCollapse}>
            {label}
          </h3>

          <div className={styles.categoryActions}>
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
          </div>
        </div>

        <Collapse isOpen={this.state.isCollapsed}>
          <div className={styles.content}>{this.props.children}</div>
        </Collapse>
      </div>
    );
  }
}

export default Category;
