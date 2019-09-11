import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

import Dashlet from '../Dashlet/Dashlet';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { DefineHeight, Icon } from '../common';
import { t } from '../../helpers/util';

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
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
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

  renderTable(data = []) {
    if (!data.length) {
      return this.renderEmptyMessage();
    }

    return (
      <div className="ecos-doc-associations__table">
        <div className="ecos-doc-associations__table-header">
          <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-header-cell">{t(LABELS.TABLE_CELL_HEADLINE)}</div>
          <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-header-cell">
            {t(LABELS.TABLE_CELL_DATE_OF_CREATION)}
          </div>
        </div>

        <div className="ecos-doc-associations__table-body">
          {data.map(item => (
            <div className="ecos-doc-associations__table-row surfbug_highlight" key={item.id}>
              <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-body-cell">
                <a href="/v2/dashboard" target="_blank">
                  {item.name}
                </a>
              </div>
              <div className="ecos-doc-associations__table-cell ecos-doc-associations__table-body-cell">{item.date}</div>
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

  renderAssociatedWith() {
    const docs = [
      {
        id: '1',
        name: 'Акт №4 ОАО Северсталь',
        date: '23.02.2019  17:48'
      },
      {
        id: '2',
        name: 'Договор №9',
        date: '23.03.2019  17:46'
      }
    ];

    return (
      <>
        <div className="ecos-doc-associations__headline">
          <div className="ecos-doc-associations__headline-text">{t(LABELS.HEADLINE_ASSOCIATED_WITH_DOCS)}</div>
          <div className="ecos-doc-associations__headline-actions">
            <Icon
              id="associated-with-docs"
              // onClick={}
              className="icon-plus ecos-doc-associations__icon-plus"
            />
            <UncontrolledTooltip
              placement="top"
              boundariesElement="window"
              className="ecos-base-tooltip"
              innerClassName="ecos-base-tooltip-inner"
              arrowClassName="ecos-base-tooltip-arrow"
              target="associated-with-docs"
            >
              {t(LABELS.TOOLTIP_ADD_LINK)}
            </UncontrolledTooltip>
          </div>
        </div>

        {this.renderTable(docs)}
      </>
    );
  }

  renderBaseDocument() {
    const docs = [];

    return (
      <>
        <div className="ecos-doc-associations__headline">
          <div className="ecos-doc-associations__headline-text">{t(LABELS.HEADLINE_BASE_DOCUMENT)}</div>
          <div className="ecos-doc-associations__headline-actions">
            <Icon
              id="base-document"
              // onClick={}
              className="icon-plus ecos-doc-associations__icon-plus"
            />
            <UncontrolledTooltip
              placement="top"
              boundariesElement="window"
              className="ecos-base-tooltip"
              innerClassName="ecos-base-tooltip-inner"
              arrowClassName="ecos-base-tooltip-arrow"
              target="base-document"
            >
              {t(LABELS.TOOLTIP_ADD_LINK)}
            </UncontrolledTooltip>
          </div>
        </div>

        {this.renderTable(docs)}
      </>
    );
  }

  renderAccountingDocuments() {
    const docs = [];

    return (
      <>
        <div className="ecos-doc-associations__headline">
          <div className="ecos-doc-associations__headline-text">{t(LABELS.HEADLINE_ACCOUNTING_DOCS)}</div>
          <div className="ecos-doc-associations__headline-actions">
            <Icon
              id="accounting-docs"
              // onClick={}
              className="icon-plus ecos-doc-associations__icon-plus"
            />
            <UncontrolledTooltip
              placement="top"
              boundariesElement="window"
              className="ecos-base-tooltip"
              innerClassName="ecos-base-tooltip-inner"
              arrowClassName="ecos-base-tooltip-arrow"
              target="accounting-docs"
            >
              {t(LABELS.TOOLTIP_ADD_LINK)}
            </UncontrolledTooltip>
          </div>
        </div>

        {this.renderTable(docs)}
      </>
    );
  }

  render() {
    const { canDragging, dragHandleProps, isCollapsed } = this.props;
    const { userHeight = 0, fitHeights } = this.state;
    const fixHeight = userHeight || null;

    return (
      <Dashlet
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
      >
        <DefineHeight fixHeight={fixHeight} maxHeight={fitHeights.max} minHeight={1} getOptimalHeight={this.setContentHeight}>
          {this.renderAssociatedWith()}
          {this.renderBaseDocument()}
          {this.renderAccountingDocuments()}
        </DefineHeight>
      </Dashlet>
    );
  }
}

export default DocAssociations;
