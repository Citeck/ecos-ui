import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Collapse, Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import cn from 'classnames';
import { ViewTypeCards, ViewTypeList } from '../../../constants/bpmn';
import { t } from '../../../helpers/util';
import styles from './Category.module.scss';
import './Category.scss';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType
  // TODO isEditable
  // TODO level
});

const mapDispatchToProps = dispatch => ({
  doRenameCategoryAction: () => {
    console.log('rename'); // TODO
  },
  doAccessCategoryAction: () => {
    console.log('access'); // TODO
  },
  doDeleteCategoryAction: () => {
    console.log('delete'); // TODO
  },
  doAddSubcategoryAction: () => {
    console.log('add subcategory'); // TODO
  },
  saveEditableCategory: text => {
    console.log('save category', text); // TODO
  },
  cancelEditCategory: text => {
    console.log('cancel edit category'); // TODO
  }
});

class Category extends React.Component {
  state = {
    collapseIsOpen: false,
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
      collapseIsOpen: !prevState.collapseIsOpen
    }));
  };

  render() {
    const {
      label,
      level,
      isEditable,
      viewType,
      doRenameCategoryAction,
      doAccessCategoryAction,
      doDeleteCategoryAction,
      doAddSubcategoryAction,
      saveEditableCategory,
      cancelEditCategory
    } = this.props;

    // classes
    const dropdownActionsIconClasses = cn(styles.categoryActionIcon, styles.categoryActionIcon2, {
      [styles.categoryActionIconPressed]: this.state.dropdownOpen,
      'icon-menu-normal': level === 0 && !this.state.dropdownOpen,
      'icon-menu-normal-press': level === 0 && this.state.dropdownOpen,
      'icon-menu-small': level !== 0 && !this.state.dropdownOpen,
      'icon-menu-small-press': level !== 0 && this.state.dropdownOpen
    });

    const dragNDropIconClasses = cn('icon-drag', styles.categoryActionIcon, styles.hiddenIcon);
    const saveIconClasses = cn('icon-check', styles.categoryActionIcon);
    const cancelIconClasses = cn('icon-close', styles.categoryActionIcon);

    const mainContainerClasses = cn({
      [styles.bpmnCategoryLevel1]: level === 1,
      [styles.bpmnCategoryLevel2]: level === 2,
      bpmnCategoryLevelOpen: this.state.collapseIsOpen,
      bpmnCategoryListViewType: viewType === ViewTypeList && level !== 0
    });

    const whiteContainerClasses = cn(styles.category, {
      [styles.categoryLevel1]: level === 1,
      [styles.categoryLevel2]: level === 2
    });

    const labelClasses = cn(styles.label, {
      [styles.labelForCollapsed]: this.state.collapseIsOpen
    });

    const labelTextClasses = cn(styles.labelText, {
      [styles.labelTextEditable]: isEditable
    });

    // action buttons
    let onClickLabel = this.toggleCollapse;
    const actions = [
      {
        label: t('bpmn-designer.category-action.rename'),
        onClick: doRenameCategoryAction
      },
      {
        label: t('bpmn-designer.category-action.access'),
        onClick: doAccessCategoryAction
      },
      {
        label: t('bpmn-designer.category-action.delete'),
        onClick: doDeleteCategoryAction
      }
    ];

    if (level < 2) {
      actions.unshift({
        label: t('bpmn-designer.category-action.add-subcategory'),
        onClick: doAddSubcategoryAction
      });
    }

    let actionButtons = (
      <Fragment>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
          <DropdownToggle tag="div">
            <span className={dropdownActionsIconClasses} />
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu}>
            <ul>
              {actions.map(action => {
                return (
                  <li key={action.label} onClick={action.onClick}>
                    {action.label}
                  </li>
                );
              })}
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
          saveEditableCategory(this.labelRef.innerText);
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
              saveEditableCategory(this.labelRef.innerText);
            }}
          />
        </Fragment>
      );
    }

    return (
      <div className={mainContainerClasses}>
        <div className={whiteContainerClasses}>
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
          {viewType === ViewTypeCards ? (
            <Collapse isOpen={this.state.collapseIsOpen}>
              <div className={styles.content}>{this.props.children}</div>
            </Collapse>
          ) : null}
        </div>

        {viewType === ViewTypeList ? (
          <Collapse isOpen={this.state.collapseIsOpen}>
            <div className={styles.contentNested}>{this.props.children}</div>
          </Collapse>
        ) : null}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Category);
