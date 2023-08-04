import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';
import { Collapse, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import cn from 'classnames';

import { ViewTypes } from '../../../constants/commonDesigner';
import { placeCaretAtEnd, t } from '../../../helpers/util';

import styles from './Category.module.scss';
import './Category.scss';

class DesignerCategory extends React.Component {
  static propTypes = {
    viewType: PropTypes.oneOf([ViewTypes.CARDS, ViewTypes.LIST, ViewTypes.TABLE]),
    searchText: PropTypes.string,
    label: PropTypes.string,
    level: PropTypes.number,
    isEditable: PropTypes.bool,
    canWrite: PropTypes.bool,
    isOpen: PropTypes.bool,

    setIsEditable: PropTypes.func,
    toggleCollapse: PropTypes.func,
    setCollapse: PropTypes.func,
    showDeleteCategoryModal: PropTypes.func,
    createCategory: PropTypes.func,
    createModel: PropTypes.func,
    saveEditableCategory: PropTypes.func,
    cancelEditCategory: PropTypes.func
  };

  state = {
    dropdownOpen: false
  };

  static getDerivedStateFromProps(props, state) {
    if (props.searchText && !props.isOpen) {
      props.setCollapse(true);
    }

    return null;
  }

  constructor() {
    super();
    this.labelRef = React.createRef();
  }

  toggleDropdown = e => {
    e.stopPropagation();

    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  doAddSubcategoryAction = () => {
    this.setState(
      {
        dropdownOpen: false
      },
      () => {
        this.props.setCollapse(true);
        this.props.createCategory();
      }
    );
  };

  doAddModelAction = () => {
    this.setState(
      {
        dropdownOpen: false
      },
      () => {
        this.props.setCollapse(true);
        this.props.createModel();
      }
    );
  };

  doRenameCategoryAction = () => {
    this.setState(
      {
        dropdownOpen: false
      },
      () => {
        this.props.setCollapse(false);
        this.props.setIsEditable();
      }
    );
  };

  doDeleteCategoryAction = () => {
    this.setState(
      {
        dropdownOpen: false
      },
      () => {
        this.props.showDeleteCategoryModal();
      }
    );
  };

  componentDidMount() {
    if (this.props.isEditable) {
      this.labelRef.current.focus();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isEditable && this.props.isEditable) {
      this.labelRef.current.focus();
    }
  }
  render() {
    const {
      label,
      level,
      isEditable,
      viewType,
      saveEditableCategory,
      cancelEditCategory,
      searchText,
      canWrite,
      isOpen,
      toggleCollapse
    } = this.props;

    // classes
    const dropdownActionsIconClasses = cn(styles.categoryActionIcon, styles.categoryActionIcon2, {
      [styles.categoryActionIconPressed]: this.state.dropdownOpen,
      'icon-custom-more-big-normal': level === 0 && !this.state.dropdownOpen,
      'icon-custom-more-big-pressed': level === 0 && this.state.dropdownOpen,
      'icon-custom-more-small-normal': level !== 0 && !this.state.dropdownOpen,
      'icon-custom-more-small-pressed': level !== 0 && this.state.dropdownOpen
    });

    const dragNDropIconClasses = cn('icon-custom-drag-big', styles.categoryActionIcon, styles.hiddenIcon);
    const saveIconClasses = cn('icon-small-check', styles.categoryActionIcon);
    const cancelIconClasses = cn('icon-small-close', styles.categoryActionIcon);

    const mainContainerClasses = cn(`category`, `category_level${level}`, {
      [styles.categoryLevel1]: level === 1,
      [styles.categoryLevel2]: level === 2,
      categoryLevelOpen: isOpen,
      categoryListViewType: viewType === ViewTypes.LIST && level !== 0
    });

    const whiteContainerClasses = cn(styles.category, {
      [styles.categoryLevel1]: level === 1,
      [styles.categoryLevel2]: level === 2
    });

    const labelClasses = cn(styles.label, {
      [styles.labelForCollapsed]: isOpen
    });

    const labelTextClasses = cn(styles.labelText, {
      [styles.labelTextEditable]: isEditable
    });

    // action buttons
    let onClickLabel = toggleCollapse;

    const actions = [
      {
        label: t('designer.category-action.create-model'),
        onClick: this.doAddModelAction
      }
    ];
    if (canWrite) {
      actions.unshift({
        label: t('designer.category-action.rename'),
        onClick: this.doRenameCategoryAction
      });
      actions.push({
        label: t('designer.category-action.delete'),
        onClick: this.doDeleteCategoryAction
      });
    }
    if (level < 2) {
      actions.unshift({
        label: t('designer.category-action.add-subcategory'),
        onClick: this.doAddSubcategoryAction
      });
    }

    let actionButtons = (
      <Fragment>
        <Dropdown className={styles.dropdown} isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
          <DropdownToggle tag="div">
            <span className={dropdownActionsIconClasses} />
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu} container="body" right>
            {actions.map(action => {
              return (
                <DropdownItem key={action.label} onClick={action.onClick}>
                  {action.label}
                </DropdownItem>
              );
            })}
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
        this.labelRef.current.focus();
      };
      onKeyPressLabel = e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveEditableCategory(this.labelRef.current.innerText);
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEditCategory();
        }
      };
      actionButtons = (
        <Fragment>
          <span
            className={cancelIconClasses}
            onClick={e => {
              e.stopPropagation();
              cancelEditCategory();
            }}
          />
          <span
            className={saveIconClasses}
            onClick={e => {
              e.stopPropagation();
              saveEditableCategory(this.labelRef.current.innerText);
            }}
          />
        </Fragment>
      );
    }

    if (searchText) {
      actionButtons = null;
    }

    return (
      <div className={mainContainerClasses}>
        <div className={whiteContainerClasses}>
          <div className={styles.categoryHeader}>
            <h3 className={labelClasses} onClick={onClickLabel}>
              <ContentEditable
                onKeyDown={onKeyPressLabel}
                className={labelTextClasses}
                innerRef={this.labelRef}
                html={label}
                disabled={!isEditable}
                tagName="span"
                onFocus={() => {
                  placeCaretAtEnd(this.labelRef.current);
                }}
              />
            </h3>

            <div className={styles.categoryActions}>{actionButtons}</div>
          </div>
          {viewType === ViewTypes.CARDS ? (
            <Collapse isOpen={isOpen}>
              <div className={styles.content}>{this.props.children}</div>
            </Collapse>
          ) : null}
        </div>

        {viewType === ViewTypes.LIST ? (
          <Collapse isOpen={isOpen}>
            <div className={styles.contentNested}>{this.props.children}</div>
          </Collapse>
        ) : null}
      </div>
    );
  }
}

export default DesignerCategory;
