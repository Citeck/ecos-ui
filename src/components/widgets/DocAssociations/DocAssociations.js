import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import get from 'lodash/get';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';
import isArray from 'lodash/isArray';

import BaseWidget, { EVENTS } from '../BaseWidget';
import { getAdaptiveNumberStr, t, isMobileDevice } from '../../../helpers/util';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants/index';
import {
  addAssociations,
  getAssociations,
  getMenu,
  removeAssociations,
  resetStore,
  viewAssociation
} from '../../../actions/docAssociations';
import { selectStateByKey } from '../../../selectors/docAssociations';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import DAction from '../../../services/DashletActionService';
import { EcosDropdownMenu, Icon, Loader, Tooltip } from '../../common';
import { RemoveDialog } from '../../common/dialogs';
import SelectJournal from '../../common/form/SelectJournal';
import Dashlet from '../../Dashlet';
import AssociationGrid from './AssociationGrid';
import FormManager from '../../EcosForm/FormManager';

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
    associations: PropTypes.array,
    isLoading: PropTypes.bool,
    isLoadingMenu: PropTypes.bool,
    menu: PropTypes.array,
    associationsTotalCount: PropTypes.number,
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

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      isMenuOpen: false,
      isConfirmRemoveDialogOpen: false,
      journalId: '',
      associationId: '',
      selectedDocument: null
    };

    this.watcherAssoc = null;
    this.instanceRecord.events.on(EVENTS.UPDATE_ASSOCIATIONS, this.props.getAssociations);
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

    if (!isEqualWith(prevTrackedAssoc, newTrackedAssoc, isEqual)) {
      this.watcherAssoc && this.instanceRecord.unwatch(prevTrackedAssoc);
      newTrackedAssoc && (this.watcherAssoc = this.instanceRecord.watch(newTrackedAssoc, () => this.reload()));
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

  handleToggleMenu = () => {
    const { menu, getMenu, isLoadingMenu } = this.props;
    const { isMenuOpen } = this.state;

    if (!menu.length && !isMenuOpen && !isLoadingMenu) {
      getMenu();
    }

    this.setState(state => ({
      isMenuOpen: !state.isMenuOpen
    }));
  };

  handleSelectMenuItem = item => {
    const { isLoading, record } = this.props;
    const createVariants = item.createVariants;

    if (isLoading) {
      return;
    }

    if (isArray(createVariants) && createVariants.length === 1) {
      const variant = createVariants[0];

      return FormManager.createRecordByVariant(
        {
          ...variant,
          attributes: {
            ...(variant.attributes || {}),
            _parent: record,
            _parentAtt: item.attribute
          }
        },
        {
          onSubmit: () => {
            this.handleReloadData();
            this.instanceRecord.events.emit(EVENTS.ASSOC_UPDATE);
          }
        }
      );
    }

    this.setState({
      journalId: item.id,
      associationId: item.associationId,
      isMenuOpen: false
    });
  };

  handleSelectJournal = associations => {
    const { associationId } = this.state;

    this.props.addAssociations(associationId, associations);

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

    if (selectedDocument) {
      const { record } = selectedDocument;

      viewAssociation(record);
    }
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
    const tooltipId = `tooltip-plus-${id}`;

    return (
      <Dropdown isOpen={isMenuOpen} toggle={this.handleToggleMenu} key="add-button" className="ecos-doc-associations__button-add">
        <DropdownToggle tag="button" className="ecos-btn ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue">
          <Tooltip placement="top" target={tooltipId} text={t(LABELS.TOOLTIP_ADD_LINK)} trigger="hover" off={isMobileDevice()}>
            <Icon id={tooltipId} className="icon-small-plus" />
          </Tooltip>
        </DropdownToggle>
        <DropdownMenu
          className="ecos-dropdown__menu ecos-dropdown__menu_links ecos-dropdown__menu_cascade ecos-doc-associations__menu"
          modifiers={{
            computeStyle: {
              fn: data => {
                const { popper } = data.instance;
                const style = popper.getAttribute('style');

                popper.setAttribute('style', `${style} left: unset !important; right: 0;`);

                return data;
              }
            }
          }}
        >
          <EcosDropdownMenu
            emptyMessage={t(LABELS.EMPTY_ALLOWED_ASSOCIATIONS_MESSAGE)}
            items={menu}
            mode="cascade"
            isLoading={isLoadingMenu}
            modifiers={{
              preventOverflow: {
                escapeWithReference: true,
                boundariesElement: 'viewport'
              },
              onlyFirstParent: true
            }}
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
        onCancel={() => this.setState({ journalId: '' })}
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
    const { canDragging, dragHandleProps, associationsTotalCount, isLoading, isMobile } = this.props;
    const actionRules = { orderedVisible: [DAction.Actions.RELOAD, 'addLink'] };

    return (
      <Dashlet
        className={classNames('ecos-doc-associations', { 'ecos-doc-associations_small': this.isSmallWidget })}
        title={t(LABELS.TITLE)}
        needGoTo={false}
        actionConfig={{
          [DAction.Actions.RELOAD]: {
            onClick: this.handleReloadData
          }
        }}
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
        isCollapsed={this.isCollapsed}
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
  getAssociations: () => dispatch(getAssociations(record)),
  getMenu: () => dispatch(getMenu(record)),
  viewAssociation: associationRef => dispatch(viewAssociation(associationRef)),
  addAssociations: (associationId, associations) =>
    dispatch(
      addAssociations({
        record,
        associationId,
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
