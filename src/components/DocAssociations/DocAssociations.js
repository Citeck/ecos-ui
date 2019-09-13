import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle, UncontrolledTooltip } from 'reactstrap';
import classNames from 'classnames';

import Dashlet from '../Dashlet/Dashlet';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { DefineHeight, DropdownMenu as Menu, Icon } from '../common';
import { t } from '../../helpers/util';
import { getSectionList, initStore, getDocuments, getMenu } from '../../actions/docAssociations';
import { selectStateByKey } from '../../selectors/docAssociations';

import './style.scss';

const LABELS = {
  TITLE: 'Связи документа',
  HEADLINE_ASSOCIATED_WITH_DOCS: 'Связан с документами',
  TABLE_CELL_HEADLINE: 'Заголовок',
  TABLE_CELL_DATE_OF_CREATION: 'Дата создания',
  HEADLINE_BASE_DOCUMENT: 'Документ-основание',
  HEADLINE_ACCOUNTING_DOCS: 'Учётные документы',
  MESSAGE_NOT_ADDED: 'Не добавлен',
  TOOLTIP_ADD_LINK: 'Добавить связь'
};

// TODO: recordRef workspace://SpacesStore/e432d1a0-dbfd-47c4-972a-c3eb53aa2cfa
// TODO: recordRef workspace://SpacesStore/b29f6514-aa80-4919-945e-6b4b6066238f
// TODO: recordRef workspace://SpacesStore/b8fd6e1b-b897-4865-96dc-668cf8131358
// TODO: recordRef https://community.ecos24.ru/share/page/card-details?nodeRef=workspace://SpacesStore/d17a1bf7-d77d-4b47-9477-b3d9a7da63ec

class DocAssociations extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    canDragging: PropTypes.bool,
    dragHandleProps: PropTypes.object
  };

  static defaultProps = {
    canDragging: false,
    dragHandleProps: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      fitHeights: {},
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      isMenuOpen: false
    };

    props.initStore();
  }

  componentDidMount() {
    this.props.getSectionList();
    this.props.getDocuments();
    this.props.getMenu();
  }

  get isSmallWidget() {
    const { isMobile } = this.props;
    const { width } = this.state;

    return isMobile || width <= MIN_WIDTH_DASHLET_SMALL;
  }

  handleResize = width => {
    this.setState({ width });
  };

  handleChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ userHeight: height });
  };

  handleSetFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  handleToggleMenu = () => {
    this.setState(state => ({
      isMenuOpen: !state.isMenuOpen
    }));
  };

  renderTable(data = []) {
    const { isMobile } = this.props;

    if (!data.length) {
      return this.renderEmptyMessage();
    }

    return (
      <div
        className={classNames('ecos-doc-associations__table', {
          'ecos-doc-associations__table_small': this.isSmallWidget
        })}
      >
        <div className="ecos-doc-associations__table-header">
          <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-header-cell">{t(LABELS.TABLE_CELL_HEADLINE)}</div>
          <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-header-cell">
            {t(LABELS.TABLE_CELL_DATE_OF_CREATION)}
          </div>
        </div>

        <div className="ecos-doc-associations__table-body">
          {data.map(item => (
            <div className="ecos-doc-associations__table-row surfbug_highlight" key={item.record}>
              <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-body-cell">
                <a href={`/v2/dashboard?recordRef=${item.record}`} target="_blank" className="ecos-doc-associations__link">
                  {item.name}
                </a>
              </div>
              <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-body-cell">{item.date}</div>

              {!isMobile && (
                <span className="ecos-doc-associations__table-actions">
                  <Icon
                    // onClick={}
                    className="icon-delete ecos-doc-associations__icon-delete ecos-doc-associations__icon ecos-doc-associations__icon_hidden"
                  />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderEmptyMessage = (message = LABELS.MESSAGE_NOT_ADDED) => (
    <div className="ecos-doc-associations__empty">
      <span className="ecos-doc-associations__empty-message">{t(message)}</span>
    </div>
  );

  renderDocumentsItem = data => {
    const { id } = this.props;
    const { documents, title } = data;

    if (!documents.length) {
      return null;
    }

    return (
      <React.Fragment key={`document-list-${title}-${id}`}>
        <div className="ecos-doc-associations__headline">
          <div className="ecos-doc-associations__headline-text">{t(title)}</div>
        </div>

        {this.renderTable(documents)}
      </React.Fragment>
    );
  };

  renderDocuments() {
    const { documents } = this.props;

    return documents.map(this.renderDocumentsItem);
  }

  renderAddButton = () => {
    const { menu, id, isMobile } = this.props;
    const { isMenuOpen } = this.state;

    if (isMobile) {
      return null;
    }

    return (
      <Dropdown isOpen={isMenuOpen} toggle={this.handleToggleMenu}>
        <DropdownToggle tag="div">
          <Icon id={`tooltip-plus-${id}`} className="icon-plus ecos-doc-associations__icon-plus" />
          <UncontrolledTooltip
            placement="top"
            boundariesElement="window"
            className="ecos-base-tooltip"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
            target={`tooltip-plus-${id}`}
          >
            {t(LABELS.TOOLTIP_ADD_LINK)}
          </UncontrolledTooltip>
        </DropdownToggle>
        <DropdownMenu className="ecos-dropdown__menu ecos-dropdown__menu_links ecos-dropdown__menu_cascade">
          <Menu items={menu} mode="cascade" onClick={data => console.warn(data)} />
        </DropdownMenu>
      </Dropdown>
    );
  };

  render() {
    const { canDragging, dragHandleProps, isCollapsed } = this.props;
    const { userHeight = 0, fitHeights } = this.state;
    const fixHeight = userHeight || null;

    return (
      <Dashlet
        className={classNames('ecos-doc-associations', {
          'ecos-doc-associations_small': this.isSmallWidget
        })}
        title={LABELS.TITLE}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        resizable
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.handleSetFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        customButtons={[this.renderAddButton()]}
      >
        <DefineHeight fixHeight={fixHeight} maxHeight={fitHeights.max} minHeight={1} getOptimalHeight={this.setContentHeight}>
          {this.renderDocuments()}
        </DefineHeight>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({ ...selectStateByKey(state, ownProps.record) });
const mapDispatchToProps = (dispatch, ownProps) => ({
  initStore: () => dispatch(initStore(ownProps.record)),
  getSectionList: () => dispatch(getSectionList(ownProps.record)),
  getDocuments: () => dispatch(getDocuments(ownProps.record)),
  getMenu: () => dispatch(getMenu(ownProps.record))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocAssociations);
