import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

import Dashlet from '../Dashlet/Dashlet';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import { DefineHeight, Icon } from '../common';
import { t } from '../../helpers/util';
import { IcoBtn } from '../common/btns';

import './style.scss';

const LABELS = {
  TITLE: 'Связи документа',
  ASSOCIATED_WITH_DOCS: 'Связан с документами',
  HEADLINE: 'Заголовок',
  DATE_OF_CREATION: 'Дата создания',
  BASE_DOCUMENT: 'Документ-основание',
  ACCOUNTING_DOCS: 'Учётные документы',
  NOT_ADDED: 'Не добавлен',
  ADD_LINK: 'Добавить связь'
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

  renderEmptyMessage = (message = LABELS.NOT_ADDED) => (
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

    if (!docs.length) {
      return this.renderEmptyMessage();
    }

    return (
      <div className="ecos-doc-associations__headline">
        <div className="ecos-doc-associations__headline-text">{t(LABELS.ASSOCIATED_WITH_DOCS)}</div>
        <div className="ecos-doc-associations__headline-actions">
          <Icon
            id="associated-with"
            // onClick={}
            className="icon-plus ecos-doc-associations__icon-plus"
          />
          <UncontrolledTooltip
            placement="top"
            boundariesElement="window"
            className="ecos-base-tooltip"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
            target="associated-with"
          >
            {t(LABELS.ADD_LINK)}
          </UncontrolledTooltip>
        </div>
      </div>
    );
  }

  renderBaseDocument() {
    const docs = [];

    if (!docs.length) {
      return this.renderEmptyMessage();
    }

    return (
      <div className="ecos-doc-associations__headline">
        <div className="ecos-doc-associations__headline-text">{t(LABELS.BASE_DOCUMENT)}</div>
        <div className="ecos-doc-associations__headline-actions">
          <Icon
            id="associated-with"
            // onClick={}
            className="icon-plus ecos-doc-associations__icon-plus"
          />
          <UncontrolledTooltip
            placement="top"
            boundariesElement="window"
            className="ecos-base-tooltip"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
            target="associated-with"
          >
            {t(LABELS.ADD_LINK)}
          </UncontrolledTooltip>
        </div>
      </div>
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
        </DefineHeight>
      </Dashlet>
    );
  }
}

export default DocAssociations;
