import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { Dropdown, DropdownMenu, DropdownToggle, UncontrolledTooltip } from 'reactstrap';
import get from 'lodash/get';

import BaseWidget from '../BaseWidget';
import { arrayCompare, getAdaptiveNumberStr, t } from '../../../helpers/util';
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
import { DefineHeight, DropdownMenu as Menu, Icon, Loader } from '../../common/index';
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
    maxHeightByContent: true,
    dragHandleProps: {}
  };

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
        className: 'icon-on'
      },
      {
        name: 'delete',
        onClick: this.handleClickDeleteDocument,
        className: 'icon-delete ecos-doc-associations__icon-delete'
      }
    ];
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

  renderAddButton = () => {
    const { menu, id, isLoadingMenu } = this.props;
    const { isMenuOpen } = this.state;

    return (
      <Dropdown isOpen={isMenuOpen} toggle={this.handleToggleMenu} key="add-button" className="ecos-doc-associations__button-add">
        <DropdownToggle tag="button" className="ecos-btn ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue">
          <Icon id={`tooltip-plus-${id}`} className="icon-big-plus" />
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
            onClick={this.handleSelectMenuItem}
          />
        </DropdownMenu>
      </Dropdown>
    );
  };

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

  render() {
    const { canDragging, dragHandleProps, isCollapsed, associationsTotalCount, isLoading, isMobile } = this.props;
    const { userHeight = 0, fitHeights, contentHeight } = this.state;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.handleReloadData
      }
    };
    const actionRules = { orderedVisible: [DAction.Actions.RELOAD, 'addLink'] };

    if (!isMobile) {
      actions.addLink = {
        component: this.renderAddButton(),
        text: t(LABELS.TOOLTIP_ADD_LINK)
      };
    }

    return (
      <Dashlet
        className={classNames('ecos-doc-associations', { 'ecos-doc-associations_small': this.isSmallWidget })}
        title={t(LABELS.TITLE)}
        needGoTo={false}
        actionConfig={actions}
        actionRules={actionRules}
        canDragging={canDragging}
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
      >
        {isMobile ? (
          this.renderAssociations()
        ) : (
          <Scrollbars
            style={{ height: contentHeight || '100%' }}
            renderTrackVertical={props => <div {...props} className="ecos-doc-associations__scroll ecos-doc-associations__scroll_v" />}
          >
            <DefineHeight
              fixHeight={userHeight || null}
              maxHeight={fitHeights.max}
              minHeight={fitHeights.min}
              getOptimalHeight={this.setContentHeight}
            >
              {this.renderAssociations()}
            </DefineHeight>
          </Scrollbars>
        )}
        {this.renderLoader()}
        {this.renderSelectJournalModal()}
        {this.renderConfirmRemoveDialog()}
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
