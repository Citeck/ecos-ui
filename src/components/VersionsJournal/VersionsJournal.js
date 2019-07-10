import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import { Tooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';

import Dashlet from '../Dashlet/Dashlet';
import { IcoBtn } from '../common/btns';
import Icon from '../common/icons/Icon/Icon';
import { t } from '../../helpers/util';

import AddModal from './AddModal';
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
        version: '1.5',
        date: '8 Сентября, 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg'
      },
      {
        firstName: 'Константин',
        lastName: 'Константинопольский',
        middleName: '',
        comment: '',
        version: '1.4',
        date: '6 Сентября, 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg'
      },
      {
        firstName: 'Константин',
        lastName: 'Константинопольский',
        middleName: '',
        comment: '',
        version: '1.3',
        date: '3 Сентября, 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg'
      },
      {
        firstName: 'Константин',
        lastName: 'Константинопольский',
        middleName: '',
        comment: '',
        version: '1.2',
        date: '2 Сентября, 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg'
      },
      {
        firstName: 'Константин',
        lastName: 'Константинопольский',
        middleName: '',
        comment: '',
        version: '1.1',
        date: '1 Сентября, 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg'
      },
      {
        firstName: 'Константин',
        lastName: 'Константинопольский',
        middleName: '',
        comment: '',
        version: '1.0',
        date: '18 , 13:25',
        avatar:
          'https://images-na.ssl-images-amazon.com/images/M/MV5BMTEwNjE0Njg2MTReQTJeQWpwZ15BbWU3MDEyODM1ODc@._V1_UY256_CR1,0,172,256_AL_.jpg'
      }
    ],
    modalIsShow: true,
    selectedVersion: null
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
      <span key="add-button">
        <IcoBtn
          id={TOOLTIP.ADD_NEW_VERSION}
          key="action-open-modal"
          icon="icon-plus"
          onClick={this.handleToggleModal}
          className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        />
        <Tooltip
          placement="top"
          key="action-open-modal-tooltip"
          innerClassName="ecos-vj__tooltip"
          arrowClassName="ecos-vj__tooltip-arrow"
          isOpen={this.state.tooltip[TOOLTIP.ADD_NEW_VERSION]}
          target={TOOLTIP.ADD_NEW_VERSION}
          toggle={this.handleToggleTooltip.bind(this, TOOLTIP.ADD_NEW_VERSION)}
        >
          {t('Добавить версию')}
        </Tooltip>
      </span>
    );
  }

  renderVersion = (version, showActions = true) => (
    <div className="ecos-vj__version">
      <div className="ecos-vj__version-header">
        <div className="ecos-vj__version-number">{version.version}</div>
        <div className="ecos-vj__version-title">{version.date}</div>
        {showActions && (
          <div className="ecos-vj__version-actions">
            <Icon onClick={this.handleClickShowModal} className="icon-on ecos-vj__version-actions-item" />
            <Icon onClick={this.handleClickShowModal} className="icon-actual ecos-vj__version-actions-item" />
            <Icon onClick={this.handleClickShowModal} className="icon-download ecos-vj__version-actions-item" />
          </div>
        )}
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

    const version = versions[0];

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('Актуальная версия')}</div>
        {version && this.renderVersion(version, false)}
        {!version && this.renderMessage(t('Нет актуальных версий'))}
      </React.Fragment>
    );
  }

  renderOldVersions() {
    const { versions } = this.state;

    if (!versions) {
      return null;
    }

    const [, ...oldVersions] = versions;

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('Старые версии')}</div>
        {oldVersions.map(version => this.renderVersion(version))}
        {!oldVersions.length && this.renderMessage(t('Пока нет старых версий'))}
      </React.Fragment>
    );
  }

  renderModal() {
    const { modalIsShow, versions } = this.state;
    const currentVersion = versions.length ? versions[0].version : 1;

    return (
      <AddModal
        isShow={modalIsShow}
        onHideModal={this.handleToggleModal}
        title={t('Добавить новую версию')}
        currentVersion={currentVersion}
      />
    );
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
          <Scrollbars autoHide autoHeight autoHeightMin={270} autoHeightMax={430}>
            {this.renderActualVersion()}
            {this.renderOldVersions()}
          </Scrollbars>
          {this.renderModal()}
        </Dashlet>
      </div>
    );
  }
}

export default VersionsJournal;
