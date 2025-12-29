import cn from 'classnames';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { Collapse, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

import { ViewTypes } from '../../../constants/commonDesigner';
import { getMLValue, t } from '../../../helpers/util';
import actionsService from '../../Records/actions/recordActions';
import { Input, MLText } from '../../common/form';

import styles from './Category.module.scss';

import { NotificationManager } from '@/services/notifications';

import './Category.scss';

const EDIT_PERMISSIONS_ACTION_REF = 'uiserv/action@edit-permissions';

class DesignerCategory extends PureComponent {
  static propTypes = {
    viewType: PropTypes.oneOf([ViewTypes.CARDS, ViewTypes.LIST, ViewTypes.TABLE]),
    searchText: PropTypes.string,
    label: PropTypes.object,
    sectionCode: PropTypes.string,
    level: PropTypes.number,
    isEditable: PropTypes.bool,
    canWrite: PropTypes.bool,
    isOpen: PropTypes.bool,
    isUserAdmin: PropTypes.bool,

    setIsEditable: PropTypes.func,
    toggleCollapse: PropTypes.func,
    setCollapse: PropTypes.func,
    showDeleteCategoryModal: PropTypes.func,
    createCategory: PropTypes.func,
    createModel: PropTypes.func,
    saveEditableCategory: PropTypes.func,
    cancelEditCategory: PropTypes.func
  };

  static getDerivedStateFromProps(props, state) {
    if (props.searchText && !props.isOpen) {
      props.setCollapse(true);
    }

    return null;
  }

  constructor(props) {
    super();

    this.state = {
      dropdownOpen: false,
      code: props.sectionCode,
      nameMl: props.label
    };
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

  doEditPermissionsAction = async () => {
    const recordId = this._getCategoryRef();
    const action = (await actionsService.getActionsForRecord(recordId, [EDIT_PERMISSIONS_ACTION_REF]))[0];
    if (!action) {
      NotificationManager.error('action is not available', t('error'));
      return;
    }
    await actionsService.execForRecord(recordId, action);
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

  editCategoryAction = () => {
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

  _getCategoryRef() {
    return this.props.categoryId || this.props.itemId || '';
  }

  render() {
    let {
      label,
      level,
      isEditable,
      viewType,
      saveEditableCategory,
      cancelEditCategory,
      searchText,
      canWrite,
      isOpen,
      toggleCollapse,
      isUserAdmin,
      canCreateDef,
      canCreateSubSection
    } = this.props;

    const categoryId = this._getCategoryRef() || '';
    const isRootSection = categoryId.endsWith('@ROOT');

    if (isRootSection) {
      viewType = 'NONE';
      isOpen = false;
      isEditable = false;
    }

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

    const mainContainerClasses = cn(`category`, level >= 1 ? `category_level_${level % 2 === 0 ? 'odd' : 'even'}` : 'category_level_root', {
      [styles.categoryLevelRoot]: isRootSection || level < 1,
      [styles.categoryLevelOdd]: level >= 1 && level % 2 === 0,
      [styles.categoryLevelEven]: level >= 1 && level % 2 !== 0,
      categoryLevelOpen: isOpen,
      categoryListViewType: viewType === ViewTypes.LIST && level !== 0
    });

    const whiteContainerClasses = cn(styles.category, {
      [styles.categoryLevelRoot]: isRootSection || level < 1,
      [styles.categoryLevelOdd]: level >= 1 && level % 2 === 0,
      [styles.categoryLevelEven]: level >= 1 && level % 2 !== 0
    });

    const labelClasses = cn(styles.label, {
      [styles.labelForCollapsed]: isOpen
    });

    // action buttons
    const actions = [];

    if (!isRootSection) {
      actions.push({
        label: t('designer.category-action.create-model'),
        onClick: this.doAddModelAction,
        hidden: !canCreateDef
      });
      if (canWrite) {
        actions.unshift({
          label: t('designer.category-action.edit'),
          onClick: this.editCategoryAction
        });
        actions.push({
          label: t('designer.category-action.delete'),
          onClick: this.doDeleteCategoryAction
        });
      }
      actions.push({
        label: t('designer.category-action.add-subcategory'),
        onClick: this.doAddSubcategoryAction,
        hidden: !canCreateSubSection
      });
    }
    if (isUserAdmin) {
      actions.push({
        label: t('designer.category-action.edit-permissions'),
        onClick: this.doEditPermissionsAction
      });
    }

    let actionButtons = (
      <Fragment>
        <Dropdown className={styles.dropdown} isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
          <DropdownToggle tag="div">
            <span className={dropdownActionsIconClasses} />
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu} container="body" right>
            {actions
              .filter(action => !action.hidden)
              .map(action => {
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

    if (isEditable) {
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

              const { code, nameMl } = this.state;

              saveEditableCategory(code, nameMl);
            }}
          />
        </Fragment>
      );
    }

    const shownActions = actions.filter(action => !action.hidden);

    if (searchText || !shownActions.length) {
      actionButtons = null;
    }

    const { nameMl, code } = this.state;

    return (
      <div className={mainContainerClasses}>
        <div className={whiteContainerClasses}>
          <div className={styles.categoryHeader} onClick={() => !isEditable && toggleCollapse()}>
            <h3 className={labelClasses}>
              {isEditable ? (
                <div className={styles.labelEditable}>
                  <Input
                    placeholder={t('menu-item.admin.in-section.code')}
                    value={code}
                    onChange={e => this.setState({ code: e.target.value })}
                  />
                  <MLText
                    className={styles.labelEditableName}
                    placeholder={t('menu-item.admin.in-section.label')}
                    value={nameMl}
                    onChange={value => this.setState({ nameMl: value })}
                  />
                </div>
              ) : (
                <>
                  <span className={styles.labelText}>{getMLValue(label)}</span>
                  {code && <span className={styles.labelCode}>{`(${code})`}</span>}
                </>
              )}
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
