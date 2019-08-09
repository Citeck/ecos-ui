import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import { Tooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';
import get from 'lodash/get';

import Dashlet from '../Dashlet/Dashlet';
import { IcoBtn } from '../common/btns';
import Icon from '../common/icons/Icon/Icon';
import { t } from '../../helpers/util';

import AddModal from './AddModal';
import { addNewVersion, getVersions } from '../../actions/versionsJournal';

import './style.scss';

const TOOLTIP = {
  ADD_NEW_VERSION: 'ADD_NEW_VERSION',
  SET_ACTUAL_VERSION: 'SET_ACTUAL_VERSION',
  VIEW_VERSION: 'VIEW_VERSION',
  DOWNLOAD_VERSION: 'DOWNLOAD_VERSION'
};

const mapStateToProps = state => ({
  versions: get(state, ['versionsJournal', 'versions']),
  addModalIsLoading: get(state, ['versionsJournal', 'addModalIsLoading'])
});

const mapDispatchToProps = dispatch => ({
  getVersionsList: payload => dispatch(getVersions(payload)),
  addNewVersion: payload => dispatch(addNewVersion(payload))
});

class VersionsJournal extends Component {
  state = {
    width: 290,
    tooltip: Object.keys(TOOLTIP)
      .map(key => ({ [TOOLTIP[key]]: false }))
      .reduce((reducer, current) => ({ ...reducer, ...current }), {}),
    modalIsShow: false,
    selectedVersion: null
  };

  componentDidMount() {
    this.props.getVersionsList('workspace://SpacesStore/848e6c2a-7c08-4c95-b70c-0bcf9aa5bcfa');
  }

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

  handleAddNewVersion = data => {
    this.props.addNewVersion({
      record: 'workspace://SpacesStore/848e6c2a-7c08-4c95-b70c-0bcf9aa5bcfa',
      ...data
    });
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

  renderVersion = (version, showActions = true) => {
    let avatar = <img src={version.avatar} alt="author" className="ecos-vj__version-author-avatar" />;

    if (!version.avatar) {
      const initials = version.userName
        .split(' ')
        .map(word => word[0])
        .join(' ')
        .toUpperCase();

      avatar = <div className="ecos-vj__version-author-avatar ecos-vj__version-author-avatar_empty">{initials}</div>;
    }

    return (
      <div className="ecos-vj__version" key={JSON.stringify(version)}>
        <div className="ecos-vj__version-header">
          <div className="ecos-vj__version-number">{version.version}</div>
          <div className="ecos-vj__version-title">{version.name}</div>
          {showActions && (
            <div className="ecos-vj__version-actions">
              <Icon onClick={this.handleClickShowModal} className="icon-on ecos-vj__version-actions-item" />
              <Icon onClick={this.handleClickShowModal} className="icon-actual ecos-vj__version-actions-item" />
              <a href={version.url} download>
                <Icon onClick={this.handleClickShowModal} className="icon-download ecos-vj__version-actions-item" />
              </a>
            </div>
          )}
        </div>
        <div className="ecos-vj__version-body">
          <div className="ecos-vj__version-author">
            {avatar}

            <div className="ecos-vj__version-author-name">
              <div className="ecos-vj__version-author-name-item">
                {version.firstName} {version.middleName}
              </div>
              <div className="ecos-vj__version-author-name-item">{version.lastName}</div>

              <div className="ecos-vj__version-date">
                <Icon className="icon-clock ecos-vj__version-date-icon" />
                {version.date}
              </div>
            </div>
          </div>
          {version.comment && <div className="ecos-vj__version-comment">{version.comment}</div>}
        </div>
      </div>
    );
  };

  renderMessage = (message = '') => <div className="ecos-vj__message">{message}</div>;

  renderActualVersion() {
    const { versions } = this.props;

    if (!versions) {
      return null;
    }

    const version = versions[0];
    const versionBlock = version ? this.renderVersion(version, false) : this.renderMessage(t('Нет актуальных версий'));

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('Актуальная версия')}</div>
        {versionBlock}
      </React.Fragment>
    );
  }

  renderOldVersions() {
    const { versions } = this.props;

    if (!versions) {
      return null;
    }

    const [, ...oldVersions] = versions;
    const versionsBlock = oldVersions.length
      ? oldVersions.map(version => this.renderVersion(version))
      : this.renderMessage(t('Пока нет старых версий'));

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('Старые версии')}</div>
        {versionsBlock}
      </React.Fragment>
    );
  }

  renderModal() {
    const { versions, addModalIsLoading } = this.props;
    const { modalIsShow } = this.state;
    const currentVersion = versions.length ? versions[0].version : 1;

    if (!modalIsShow) {
      return null;
    }

    return (
      <AddModal
        isShow
        title={t('Добавить новую версию')}
        currentVersion={currentVersion}
        onHideModal={this.handleToggleModal}
        onCreate={this.handleAddNewVersion}
        isLoading={addModalIsLoading}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VersionsJournal);
