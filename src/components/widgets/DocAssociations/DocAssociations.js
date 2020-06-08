import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { Dropdown, DropdownMenu, DropdownToggle, UncontrolledTooltip } from 'reactstrap';
import get from 'lodash/get';
import moment from 'moment';

import BaseWidget from '../BaseWidget';
import { getAdaptiveNumberStr, t } from '../../../helpers/util';
import { MIN_WIDTH_DASHLET_SMALL, URL } from '../../../constants/index';
import {
  addAssociations,
  getAssociations,
  getMenu,
  getSectionList,
  removeAssociations,
  resetStore
} from '../../../actions/docAssociations';
import { selectStateByKey } from '../../../selectors/docAssociations';
import UserLocalSettingsService from '../../../services/userLocalSettings';

import { DefineHeight, DropdownMenu as Menu, Icon, Loader } from '../../common/index';
import { RemoveDialog } from '../../common/dialogs/index';
import SelectJournal from '../../common/form/SelectJournal/index';
import Dashlet, { BaseActions } from '../../Dashlet';

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

    this.watcher = this.instanceRecord.watch('cm:modified', this.reload);
  }

  componentDidMount() {
    super.componentDidMount();

    this.props.getAssociations();
    this.checkHeight();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.runUpdate && !prevState.runUpdate) {
      this.props.getAssociations();
    }
  }

  componentWillUnmount() {
    this.props.resetStore();
    this.instanceRecord.unwatch(this.watcher);
  }

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

    if (selectedDocument) {
      label += ` "${selectedDocument.name}"`;
    }

    return `${label}?`;
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

  renderRow = (item, columns, key) => (
    <div className="ecos-doc-associations__table-row surfbug_highlight" key={`${key}-${item.record}`}>
      {columns.map(column => this.renderCell(column, item))}
    </div>
  );

  renderCell = (column, row) => {
    const { isMobile } = this.props;
    let data = row[column.name];
    let Wrapper;

    if (column.type === 'datetime') {
      data = moment(data || moment()).format('DD.MM.YYYY h:mm');
    }

    switch (column.name) {
      case 'displayName': {
        Wrapper = ({ children }) => (
          <a
            href={`${URL.DASHBOARD}?recordRef=${row.record}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ecos-doc-associations__link"
          >
            {children}
          </a>
        );
        break;
      }
      case 'modifier': {
        Wrapper = ({ children }) => (
          <a
            href={`${URL.DASHBOARD}?recordRef=people@${row.modifierId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ecos-doc-associations__link"
          >
            {children}
          </a>
        );
        break;
      }
      default:
        Wrapper = ({ children }) => children;
    }

    return (
      <React.Fragment key={column.name}>
        <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-body-cell">{data && <Wrapper>{data}</Wrapper>}</div>

        {!isMobile && (
          <span className="ecos-doc-associations__table-actions">
            <Icon
              onClick={() => this.handleClickDeleteDocument(row)}
              className="icon-delete ecos-doc-associations__icon-delete ecos-doc-associations__icon ecos-doc-associations__icon_hidden"
            />
          </span>
        )}
      </React.Fragment>
    );
  };

  renderTable(data = [], key) {
    if (!data.length) {
      return this.renderEmptyMessage();
    }

    const { allowedAssociations } = this.props;
    const columns = get(allowedAssociations.find(item => item.name === key), 'columnsConfig.columns', []);

    return (
      <div
        className={classNames('ecos-doc-associations__table', {
          'ecos-doc-associations__table_small': this.isSmallWidget
        })}
      >
        {this.renderHeader(columns)}

        <div className="ecos-doc-associations__table-body">{data.map(item => this.renderRow(item, columns, key))}</div>
      </div>
    );
  }

  renderEmptyMessage = (message = LABELS.MESSAGE_NOT_ADDED) => (
    <div className="ecos-doc-associations__empty">
      <span className="ecos-doc-associations__empty-message">{t(message)}</span>
    </div>
  );

  renderAssociationsItem = (data = {}, position) => {
    const { id } = this.props;
    const { associations, title, key } = data;

    if (!associations || !associations.length) {
      return null;
    }

    return (
      <React.Fragment key={`document-list-${position}-${title}-${id}`}>
        <div className="ecos-doc-associations__headline">
          <div className="ecos-doc-associations__headline-text">{t(title)}</div>
        </div>

        {this.renderTable(associations, key)}
      </React.Fragment>
    );
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
      [BaseActions.RELOAD]: {
        onClick: this.handleReloadData
      }
    };
    const actionRules = { orderedVisible: [BaseActions.RELOAD, 'addLink'] };

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
          <Scrollbars style={{ height: contentHeight || '100%' }}>
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
