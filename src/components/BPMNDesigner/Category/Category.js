import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import ContentEditable from 'react-contenteditable';
import { Collapse, Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import cn from 'classnames';
import { VIEW_TYPE_CARDS, VIEW_TYPE_LIST } from '../../../constants/bpmn';
import { createCategory, cancelEditCategory, setIsEditable, saveCategoryRequest, deleteCategoryRequest } from '../../../actions/bpmn';
import { hideModal, showModal } from '../../../actions/modal';
import { t, placeCaretAtEnd } from '../../../helpers/util';
import styles from './Category.module.scss';
import './Category.scss';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType
});

const mapDispatchToProps = (dispatch, props) => ({
  setIsEditable: () => {
    dispatch(setIsEditable(props.itemId));
  },
  showDeleteCategoryModal: () => {
    dispatch(
      // TODO translation messages
      showModal({
        title: 'Удаление категории',
        content: 'Удалить категорию?',
        buttons: [
          {
            label: 'Отмена',
            isCloseButton: true
          },
          {
            label: 'Удалить',
            onClick: () => {
              dispatch(deleteCategoryRequest(props.itemId));
              dispatch(hideModal());
            },
            bsStyle: 'danger'
          }
        ]
      })
    );
  },
  createCategory: () => {
    dispatch(createCategory({ parentId: props.itemId }));
  },
  saveEditableCategory: text => {
    dispatch(saveCategoryRequest({ id: props.itemId, label: text }));
  },
  cancelEditCategory: text => {
    dispatch(cancelEditCategory(props.itemId));
  }
});

class Category extends React.Component {
  state = {
    collapseIsOpen: false,
    dropdownOpen: false
  };

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

  toggleCollapse = () => {
    this.setState(prevState => ({
      collapseIsOpen: !prevState.collapseIsOpen
    }));
  };

  doAddSubcategoryAction = () => {
    this.setState(
      {
        collapseIsOpen: true,
        dropdownOpen: false
      },
      () => {
        this.props.createCategory();
      }
    );
  };

  doRenameCategoryAction = () => {
    this.setState(
      {
        collapseIsOpen: false,
        dropdownOpen: false
      },
      () => {
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
    const { label, level, isEditable, viewType, saveEditableCategory, cancelEditCategory } = this.props;

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
      bpmnCategoryListViewType: viewType === VIEW_TYPE_LIST && level !== 0
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
        onClick: this.doRenameCategoryAction
      },
      {
        label: t('bpmn-designer.category-action.delete'),
        onClick: this.doDeleteCategoryAction
      }
    ];

    if (level < 2) {
      actions.unshift({
        label: t('bpmn-designer.category-action.add-subcategory'),
        onClick: this.doAddSubcategoryAction
      });
    }

    let actionButtons = (
      <Fragment>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
          <DropdownToggle tag="div">
            <span className={dropdownActionsIconClasses} />
          </DropdownToggle>
          <DropdownMenu className={styles.dropdownMenu} right>
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
          {viewType === VIEW_TYPE_CARDS ? (
            <Collapse isOpen={this.state.collapseIsOpen}>
              <div className={styles.content}>{this.props.children}</div>
            </Collapse>
          ) : null}
        </div>

        {viewType === VIEW_TYPE_LIST ? (
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
