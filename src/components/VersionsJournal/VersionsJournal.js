import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import { Tooltip } from 'reactstrap';

import Dashlet from '../Dashlet/Dashlet';
import { IcoBtn } from '../common/btns';
import Icon from '../common/icons/Icon/Icon';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';

import './style.scss';

const TOOLTIP = {
  ADD_NEW_VERSION: 'ADD_NEW_VERSION',
  SET_ACTUAL_VERSION: 'SET_ACTUAL_VERSION',
  VIEW_VERSION: 'VIEW_VERSION',
  DOWNLOAD_VERSION: 'DOWNLOAD_VERSION'
};

class VersionsJournal extends Component {
  state = {
    width: 290,
    tooltip: Object.keys(TOOLTIP)
      .map(key => ({ [TOOLTIP[key]]: false }))
      .reduce((reducer = {}, current) => ({ ...reducer, ...current })),
    versions: [
      {
        firstName: 'Константин',
        lastName: 'Константинопольский',
        middleName: '',
        comment: '',
        version: '1.2',
        isActual: true,
        date: '8 Сентября, 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg',
        isCurrent: true
      }
    ],
    modalIsShow: false
  };

  handleResize = width => {
    this.setState({ width });
  };

  handleClickShowModal = () => {};

  handleToggleTooltip(type) {
    this.setState(state => ({
      tooltip: {
        ...state.tooltip,
        [type]: !state.tooltip[type]
      }
    }));
  }

  handleToggleModal = () => {
    this.setState(state => ({ modalIsShow: !state.modalIsShow }));
  };

  renderAddButton() {
    return (
      <React.Fragment>
        <IcoBtn
          id={TOOLTIP.ADD_NEW_VERSION}
          key="action-open-modal"
          icon="icon-plus"
          onClick={this.handleToggleModal}
          className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        />
        <Tooltip
          placement="top"
          innerClassName="ecos-vj__tooltip"
          arrowClassName="ecos-vj__tooltip-arrow"
          isOpen={this.state.tooltip[TOOLTIP.ADD_NEW_VERSION]}
          target={TOOLTIP.ADD_NEW_VERSION}
          toggle={this.handleToggleTooltip.bind(this, TOOLTIP.ADD_NEW_VERSION)}
        >
          {t('Добавить версию')}
        </Tooltip>
      </React.Fragment>
    );
  }

  renderVersion = version => (
    <div className="ecos-vj__version">
      <div className="ecos-vj__version-header">
        <div className="ecos-vj__version-number">{version.version}</div>
        <div className="ecos-vj__version-title">{version.date}</div>
        <div className="ecos-vj__version-actions">
          <Icon onClick={this.handleClickShowModal} className="icon-on ecos-vj__version-actions-item" />
          <Icon onClick={this.handleClickShowModal} className="icon-actual ecos-vj__version-actions-item" />
          <Icon onClick={this.handleClickShowModal} className="icon-download ecos-vj__version-actions-item" />
        </div>
      </div>
      <div className="ecos-vj__version-body">
        <div className="ecos-vj__version-author">
          <img src={version.avatar} alt="author" className="ecos-vj__version-author-avatar" />
          <div className="ecos-vj__version-author-name">
            <div className="ecos-vj__version-author-name-item">
              {version.firstName} {version.middleName}
            </div>
            <div className="ecos-vj__version-author-name-item">{version.lastName}</div>
          </div>
        </div>
        {version.comment && <div className="ecos-vj__version-comment">{version.comment}</div>}
      </div>
    </div>
  );

  renderMessage = (message = '') => <div className="ecos-vj__message">{message}</div>;

  renderActualVersion() {
    const { versions } = this.state;

    if (!versions) {
      return null;
    }

    const version = versions.find(item => item.isActual);

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('Актуальная версия')}</div>
        {version && this.renderVersion(version)}
        {!version && this.renderMessage(t('Нет актуальных версий'))}
      </React.Fragment>
    );
  }

  renderOldVersions() {
    const { versions } = this.state;

    if (!versions) {
      return null;
    }

    const oldVersions = versions.filter(item => !item.isActual);

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('Старые версии')}</div>
        {oldVersions.map(this.renderVersion)}
        {!oldVersions.length && this.renderMessage(t('Пока нет старых версий'))}
      </React.Fragment>
    );
  }

  renderModal() {
    const { modalIsShow } = this.state;

    return <EcosModal isOpen={modalIsShow} hideModal={this.handleToggleModal} title={t('Добавить новую версию')} />;
  }

  render() {
    return (
      <div>
        <Dashlet
          title={t('Журнал версий')}
          needGoTo={false}
          actionEdit={false}
          actionHelp={false}
          actionReload={false}
          resizable
          customButtons={[this.renderAddButton()]}
        >
          <ReactResizeDetector handleWidth handleHeight onResize={this.handleResize} />
          {this.renderActualVersion()}
          {this.renderOldVersions()}
          {this.renderModal()}
        </Dashlet>
      </div>
    );
  }
}

export default VersionsJournal;
