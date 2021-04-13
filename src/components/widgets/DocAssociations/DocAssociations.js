import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { Dropdown, DropdownMenu, DropdownToggle, UncontrolledTooltip } from 'reactstrap';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import uuidV4 from 'uuid/v4';

import BaseWidget from '../BaseWidget';
import { arrayCompare, getAdaptiveNumberStr, prepareTooltipId, t } from '../../../helpers/util';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants/index';
import {
  addAssociations,
  getAssociations,
  getMenu,
  getSectionList,
  removeAssociations,
  resetStore,
  viewAssociation
} from '../../../actions/docAssociations';
import { selectStateByKey } from '../../../selectors/docAssociations';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import DAction from '../../../services/DashletActionService';
import { DropdownMenu as Menu, Icon, Loader } from '../../common/index';
import { RemoveDialog } from '../../common/dialogs/index';
import SelectJournal from '../../common/form/SelectJournal/index';
import Dashlet from '../../Dashlet';
import AssociationGrid from './AssociationGrid';

import './style.scss';

const LABELS = {
  TITLE: 'doc-associations-widget.title',
  HEADLINE_ASSOCIATED_WITH_DOCS: 'doc-associations-widget.assoc-with-docs',
  TABLE_CELL_HEADLINE: 'doc-associations-widget.table-cell.headline',
  TABLE_CELL_DATE_OF_CREATION: 'doc-associations-widget.table-cell.creation-date',
  HEADLINE_BASE_DOCUMENT: 'doc-associations-widget.basis-document',
  HEADLINE_ACCOUNTING_DOCS: 'doc-associations-widget.closing-document',
  MESSAGE_NOT_ADDED: 'doc-associations-widget.not-added',
  TOOLTIP_ADD_LINK: 'doc-associations-widget.add-association',
  TITLE_CONFIRM_REMOVE_MODAL: 'doc-associations-widget.confirm-remove-modal.title',
  CONFIRM_REMOVE_MODAL_TEXT: 'doc-associations-widget.confirm-remove-modal.text',
  EMPTY_ALLOWED_ASSOCIATIONS_MESSAGE: 'doc-associations-widget.empty-allowed-associations.message'
};

class DocAssociations extends BaseWidget {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    canDragging: PropTypes.bool,
    dragHandleProps: PropTypes.object,
    sectionList: PropTypes.array,
    associations: PropTypes.array,
    isLoading: PropTypes.bool,
    isLoadingMenu: PropTypes.bool,
    menu: PropTypes.array,
    associationsTotalCount: PropTypes.number,
    getSectionList: PropTypes.func,
    getAssociations: PropTypes.func,
    getMenu: PropTypes.func,
    addAssociations: PropTypes.func,
    removeAssociations: PropTypes.func,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    canDragging: false,
    maxHeightByContent: false,
    dragHandleProps: {}
  };

  #addBtnId = prepareTooltipId(`btn-${uuidV4()}`);

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      isMenuOpen: false,
      isConfirmRemoveDialogOpen: false,
      journalId: '',
      journalRef: '',
      associationId: '',
      selectedDocument: null
    };

    this.watcherAssoc = null;
  }

  componentDidMount() {
    super.componentDidMount();

    this.props.getAssociations();
    this.checkHeight();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    const prevTrackedAssoc = this.getTrackedAssoc(prevProps.allowedAssociations);
    const newTrackedAssoc = this.getTrackedAssoc();

    if (!arrayCompare(prevTrackedAssoc, newTrackedAssoc)) {
      this.watcherAssoc && this.instanceRecord.unwatch(prevTrackedAssoc);
      newTrackedAssoc &&
        (this.watcherAssoc = this.instanceRecord.watch(newTrackedAssoc, () => {
          this.reload();
        }));
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.props.resetStore();
    this.watcherAssoc && this.instanceRecord.unwatch(this.watcherAssoc);
  }

  getTrackedAssoc = (associations = this.props.allowedAssociations) => {
    return (associations || []).map(item => `assoc_src_${item.attribute || item.name}`);
  };

  checkHeight = () => {
    if (UserLocalSettingsService.getDashletHeight(this.state.lsId) > this.clientHeight && this.clientHeight) {
      this.handleChangeHeight(this.clientHeight);
    }
  };

  get isSmallWidget() {
    const { isMobile } = this.props;
    const { width } = this.state;

    return isMobile || (!!width && width <= MIN_WIDTH_DASHLET_SMALL);
  }

  get confirmRemoveModalText() {
    const { selectedDocument } = this.state;
    let label = t(LABELS.CONFIRM_REMOVE_MODAL_TEXT);

    if (selectedDocument && selectedDocument.displayName) {
      label += ` "${selectedDocument.displayName}"`;
    }

    return `${label}?`;
  }

  get actions() {
    return [
      {
        name: 'view',
        onClick: this.handleClickViewDocument,
        className: 'icon-small-eye-show'
      },
      {
        name: 'delete',
        onClick: this.handleClickDeleteDocument,
        className: 'icon-delete ecos-doc-associations__icon-delete'
      }
    ];
  }

  get widgetActions() {
    const { isMobile, menu, id, isLoadingMenu } = this.props;
    const { isMenuOpen } = this.state;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.handleReloadData
      }
    };

    // menu, id, isLoadingMenu, isMenuOpen

    if (!isMobile) {
      actions.addLink = {
        component: <this.renderAddButton menu={menu} id={id} isLoadingMenu={isLoadingMenu} isMenuOpen={isMenuOpen} />,
        // component: this.renderAddButton(),
        text: t(LABELS.TOOLTIP_ADD_LINK)
      };
    }

    return actions;
  }

  handleToggleMenu = () => {
    const { menu, getMenu, isLoadingMenu, getSectionList } = this.props;
    const { isMenuOpen } = this.state;

    if (!menu.length && !isMenuOpen && !isLoadingMenu) {
      getSectionList();
      getMenu();
    }

    this.setState(state => ({
      isMenuOpen: !state.isMenuOpen
    }));
  };

  handleSelectMenuItem = item => {
    const { isLoading } = this.props;

    if (isLoading) {
      return;
    }

    this.setState({
      journalId: item.id,
      journalRef: item.nodeRef,
      associationId: item.associationId,
      isMenuOpen: false
    });
  };

  handleSelectJournal = associations => {
    const { associationId, journalRef } = this.state;

    this.props.addAssociations(associationId, journalRef, associations);

    this.setState({ journalId: '' });
  };

  handleReloadData = () => {
    this.props.getAssociations();
  };

  handleClickDeleteDocument = selectedDocument => {
    this.setState({ isConfirmRemoveDialogOpen: true, selectedDocument });
  };

  handleClickViewDocument = selectedDocument => {
    const { viewAssociation } = this.props;
    const { record } = selectedDocument;

    viewAssociation(record);
  };

  closeConfirmRemovingModal = () => {
    this.setState({ isConfirmRemoveDialogOpen: false, selectedDocument: null });
  };

  handleClickConfirmedRemoving = () => {
    const { selectedDocument } = this.state;

    if (!selectedDocument) {
      return;
    }

    const { removeAssociations } = this.props;
    const { record, associationId } = selectedDocument;

    removeAssociations(associationId, record);
    this.closeConfirmRemovingModal();
  };

  handleUpdate() {
    super.handleUpdate();
    this.props.getAssociations();
  }

  renderHeader = columns => {
    return (
      <div className="ecos-doc-associations__table-header">
        {columns.map(column => (
          <div key={column.name} className="ecos-doc-associations__table-cell ecos-doc-associations__table-header-cell">
            {t(column.label)}
          </div>
        ))}
      </div>
    );
  };

  renderEmptyMessage = (message = LABELS.MESSAGE_NOT_ADDED) => (
    <div className="ecos-doc-associations__empty">
      <span className="ecos-doc-associations__empty-message">{t(message)}</span>
    </div>
  );

  renderAssociationsItem = (data = {}) => {
    const { allowedAssociations } = this.props;
    const { associations, title, key } = data;
    const columns = get(allowedAssociations.find(i => i.name === key), 'columnsConfig.columns', []);

    if (!associations || !associations.length) {
      return null;
    }

    return <AssociationGrid key={key} title={title} columns={columns} associations={associations} actions={this.actions} />;
  };

  renderAssociations() {
    const { associations } = this.props;

    return <div ref={this.contentRef}>{associations.map(this.renderAssociationsItem)}</div>;
  }

  // renderAddButton = React.memo((props) => {
  renderAddButton = () => {
    // const { menu, id, isLoadingMenu, isMenuOpen } = props;
    const { menu, id, isLoadingMenu } = this.props;
    const { isMenuOpen } = this.state;

    return (
      <Dropdown isOpen={isMenuOpen} toggle={this.handleToggleMenu} key="add-button" className="ecos-doc-associations__button-add">
        <DropdownToggle tag="button" className="ecos-btn ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue">
          <Icon id={`tooltip-plus-${id}`} className="icon-small-plus" />
          <UncontrolledTooltip
            placement="top"
            boundariesElement="window"
            className="ecos-base-tooltip ecos-base-tooltip_opaque"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
            target={`tooltip-plus-${id}`}
          >
            {t(LABELS.TOOLTIP_ADD_LINK)}
          </UncontrolledTooltip>
        </DropdownToggle>
        <DropdownMenu className="ecos-dropdown__menu ecos-dropdown__menu_links ecos-dropdown__menu_cascade ecos-doc-associations__menu">
          <Menu
            emptyMessage={t(LABELS.EMPTY_ALLOWED_ASSOCIATIONS_MESSAGE)}
            items={menu}
            mode="cascade"
            isLoading={isLoadingMenu}
            modifiers={{
              preventOverflow: {
                // boundariesElement: 'window',
                // escapeWithReference: true,
                // boundariesElement: document.querySelector('.ecos-main-content'),
                // enabled: false
              },
              flip: {
                flipVariations: true,
                // flipVariationsByContent: true,
                fn: (data, options) => {
                  console.warn('flip => ', cloneDeep({ data, options }), data);
                  // data.instance.popper.style.right = data.offsets.popper.width;
                  data.offsets.popper.left = 1 * data.offsets.popper.width;

                  return data;
                }
              },
              computeStyle: {
                enabled: false,
                fn: (data, options) => {
                  const parent = get(data, 'instance.reference');
                  const popperWidth = get(data, 'offsets.popper.width');

                  // console.warn({ parent, popperWidth, data });

                  // if (!parent || !popperWidth) {
                  //   return data;
                  // }

                  const xOffset = -1; // parent.getBoundingClientRect().right + popperWidth < document.body.clientWidth ? 1 : -1;

                  console.warn(
                    'computeStyle => ',
                    cloneDeep({
                      data,
                      options
                      // bound: parent.getBoundingClientRect(),
                      // popperWidth,
                      // bodyWidth: document.body.clientWidth,
                      // xOffset
                    })
                  );

                  // set(data, 'styles.transform', `translate3d(calc(${document.body.getBoundingClientRect().width - parent.getBoundingClientRect().left} - 5px), 0, 100px)`);
                  set(data, 'styles.transform', `translate3d(calc((${xOffset} * 100%) - 5px), 0, 100px)`);
                  // set(data, 'styles.position', 'fixed');
                  // set(data, 'positionFixed', true);

                  return data;
                }
                // gpuAcceleration: false,
                // x: 'top'
              },
              applyStyle: {
                enabled: false,
                fn: (data, options) => {
                  console.warn('applyStyle => ', cloneDeep({ data, options }));

                  return data;
                }
              }
              // positionFixed: true
            }}
            popperProps={
              {
                // onUpdate: console.warn
                // positionFixed: true
              }
            }
            onClick={this.handleSelectMenuItem}
          />
        </DropdownMenu>
      </Dropdown>
    );
  };
  // });

  renderSelectJournalModal() {
    const { journalId } = this.state;

    if (!journalId) {
      return null;
    }

    return (
      <SelectJournal
        journalId={journalId}
        isSelectModalOpen
        multiple
        hideCreateButton
        renderView={() => null}
        onChange={this.handleSelectJournal}
        onCancel={() => {
          this.setState({ journalId: '' });
        }}
      />
    );
  }

  renderLoader() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur rounded />;
  }

  renderConfirmRemoveDialog() {
    const { isConfirmRemoveDialogOpen } = this.state;

    return (
      <RemoveDialog
        isOpen={isConfirmRemoveDialogOpen}
        onClose={this.closeConfirmRemovingModal}
        onCancel={this.closeConfirmRemovingModal}
        onDelete={this.handleClickConfirmedRemoving}
        title={t(LABELS.TITLE_CONFIRM_REMOVE_MODAL)}
        text={this.confirmRemoveModalText}
      />
    );
  }

  dashActions = {
    [DAction.Actions.RELOAD]: {
      onClick: this.handleReloadData
    },
    addLink: {
      component: this.renderAddButton(),
      text: t(LABELS.TOOLTIP_ADD_LINK)
    }
  };

  renderMenu() {
    const { menu, id, isLoadingMenu } = this.props;
    const { isMenuOpen } = this.state;

    return (
      <div className="ecos-dropdown__menu ecos-dropdown__menu_links ecos-dropdown__menu_cascade ecos-doc-associations__menu">
        <Menu
          emptyMessage={t(LABELS.EMPTY_ALLOWED_ASSOCIATIONS_MESSAGE)}
          items={menu}
          mode="cascade"
          isLoading={isLoadingMenu}
          modifiers={{
            preventOverflow: {
              // boundariesElement: 'window',
              escapeWithReference: true
              // boundariesElement: document.querySelector('.ecos-main-content'),
              // enabled: false
            },
            flip: {
              flipVariations: true
            },
            computeStyle: {
              fn: (data, options) => {
                // console.warn({ data, options });

                set(data, 'styles.transform', 'translate3d(calc(-100% - 5px), 0, 100px)');
                // set(data, 'styles.position', 'fixed');
                // set(data, 'positionFixed', true);

                return data;
              },
              gpuAcceleration: false,
              x: 'top'
            }
            // positionFixed: true
          }}
          popperProps={
            {
              // onUpdate: console.warn
              // positionFixed: true
            }
          }
          onClick={this.handleSelectMenuItem}
        />
      </div>
    );
  }

  render() {
    const { canDragging, dragHandleProps, associationsTotalCount, isLoading, isMobile } = this.props;
    const { isCollapsed } = this.state;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.handleReloadData
      }
    };
    const actionRules = { orderedVisible: [DAction.Actions.RELOAD, 'addLink'] };

    if (!isMobile) {
      // actions.addLink = {
      //   component: this.renderAddButton(),
      //   text: t(LABELS.TOOLTIP_ADD_LINK)
      // };
      // actions.addLink = {
      //   id: this.#addBtnId,
      //   onClick: this.handleToggleMenu,
      //   icon: 'icon-small-plus',
      //   text: t(LABELS.TOOLTIP_ADD_LINK)
      // };
    }

    return (
      <Dashlet
        className={classNames('ecos-doc-associations', { 'ecos-doc-associations_small': this.isSmallWidget })}
        title={t(LABELS.TITLE)}
        needGoTo={false}
        actionConfig={actions}
        // actionConfig={this.dashActions}
        // actionConfig={this.widgetActions}
        actionRules={actionRules}
        canDragging={canDragging}
        customActions={this.renderAddButton()}
        resizable
        contentMaxHeight={this.clientHeight}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        badgeText={getAdaptiveNumberStr(associationsTotalCount)}
        noBody={!associationsTotalCount && !isLoading}
        setRef={this.setDashletRef}
      >
        {isMobile ? (
          this.renderAssociations()
        ) : (
          <Scrollbars
            renderTrackVertical={props => <div {...props} className="ecos-doc-associations__scroll ecos-doc-associations__scroll_v" />}
            {...this.scrollbarProps}
          >
            {this.renderAssociations()}
          </Scrollbars>
        )}
        {this.renderLoader()}
        {this.renderSelectJournalModal()}
        {this.renderConfirmRemoveDialog()}
        {/*{!isMobile && this.renderMenu()}*/}
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, { record }) => ({
  ...selectStateByKey(state, record),
  isMobile: state.view.isMobile
});

const mapDispatchToProps = (dispatch, { record }) => ({
  resetStore: () => dispatch(resetStore(record)),
  getSectionList: () => dispatch(getSectionList(record)),
  getAssociations: () => dispatch(getAssociations(record)),
  getMenu: () => dispatch(getMenu(record)),
  viewAssociation: associationRef => dispatch(viewAssociation(associationRef)),
  addAssociations: (associationId, journalRef, associations) =>
    dispatch(
      addAssociations({
        record,
        associationId,
        journalRef,
        associations
      })
    ),
  removeAssociations: (associationId, associationRef) =>
    dispatch(
      removeAssociations({
        record,
        associationId,
        associationRef
      })
    )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocAssociations);
