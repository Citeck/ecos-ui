import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import { UncontrolledTooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';
import get from 'lodash/get';

import Dashlet from '../Dashlet/Dashlet';
import { IcoBtn } from '../common/btns';
import Icon from '../common/icons/Icon/Icon';
import { Loader } from '../common';
import { t } from '../../helpers/util';

import AddModal from './AddModal';
import ChangeVersionModal from './ChangeVersionModal';
import { addNewVersion, getVersions, setActiveVersion, toggleModal } from '../../actions/versionsJournal';
import { TOOLTIP, MODAL } from '../../constants/versionsJournal';

import './style.scss';

const mapStateToProps = state => ({
  versions: get(state, ['versionsJournal', 'versions']),
  isLoading: get(state, ['versionsJournal', 'listIsLoading']),

  addModalIsLoading: get(state, ['versionsJournal', 'addModalIsLoading']),
  addModalIsShow: get(state, ['versionsJournal', 'addModalIsShow']),
  addModalErrorMessage: get(state, ['versionsJournal', 'addModalErrorMessage']),

  changeVersionModalIsShow: get(state, ['versionsJournal', 'changeVersionModalIsShow']),
  changeVersionModalIsLoading: get(state, ['versionsJournal', 'changeVersionModalIsLoading']),
  changeVersionModalErrorMessage: get(state, ['versionsJournal', 'changeVersionModalErrorMessage'])
});

const mapDispatchToProps = dispatch => ({
  getVersionsList: payload => dispatch(getVersions(payload)),
  addNewVersion: payload => dispatch(addNewVersion(payload)),
  toggleModal: payload => dispatch(toggleModal(payload)),
  setActiveVersion: payload => dispatch(setActiveVersion(payload))
});

class VersionsJournal extends Component {
  state = {
    width: 290,
    selectedVersion: null
  };

  componentDidMount() {
    this.props.getVersionsList('workspace://SpacesStore/848e6c2a-7c08-4c95-b70c-0bcf9aa5bcfa');
  }

  handleResize = width => {
    this.setState({ width });
  };

  handleClickShowModal = () => {};

  handleToggleAddModal = () => {
    this.props.toggleModal(MODAL.ADD);
  };

  handleToggleChangeVersionModal = () => {
    this.props.toggleModal(MODAL.CHANGE_VERSION);
  };

  handleAddNewVersion = data => {
    this.props.addNewVersion({
      record: 'workspace://SpacesStore/848e6c2a-7c08-4c95-b70c-0bcf9aa5bcfa',
      ...data
    });
  };

  handleSetActiveVersion = data => {
    const { selectedVersion } = this.state;

    this.props.setActiveVersion({
      ...data,
      id: selectedVersion.id,
      version: selectedVersion.version
    });
  };

  handleOpenSetActiveVersionModal = version => {
    this.handleToggleChangeVersionModal();
    this.setState({ selectedVersion: version });
  };

  renderAddButton() {
    return (
      <span key="add-button">
        <IcoBtn
          id={TOOLTIP.ADD_NEW_VERSION}
          key="action-open-modal"
          icon="icon-plus"
          onClick={this.handleToggleAddModal}
          className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        />
        <UncontrolledTooltip
          placement="top"
          boundariesElement="window"
          key="action-open-modal-tooltip"
          innerClassName="ecos-vj__tooltip"
          arrowClassName="ecos-vj__tooltip-arrow"
          target={TOOLTIP.ADD_NEW_VERSION}
        >
          {t('Добавить версию')}
        </UncontrolledTooltip>
      </span>
    );
  }

  renderVersion = (version, showActions = true) => {
    const id = version.id.replace(/[\:\/@]/gim, '');
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
      <div className="ecos-vj__version" key={id}>
        <div className="ecos-vj__version-header">
          <div className="ecos-vj__version-number">{version.version}</div>
          <div className="ecos-vj__version-title">{version.name}</div>
          {showActions && (
            <div className="ecos-vj__version-actions">
              <Icon onClick={this.handleClickShowModal} className="icon-on ecos-vj__version-actions-item" />
              <Icon
                id={`${TOOLTIP.SET_ACTUAL_VERSION}-${id}`}
                onClick={this.handleOpenSetActiveVersionModal.bind(null, version)}
                className="icon-actual ecos-vj__version-actions-item"
              />
              <UncontrolledTooltip
                placement="top"
                boundariesElement="window"
                innerClassName="ecos-vj__tooltip"
                arrowClassName="ecos-vj__tooltip-arrow"
                target={`${TOOLTIP.SET_ACTUAL_VERSION}-${id}`}
              >
                {t('Сделать актуальным')}
              </UncontrolledTooltip>
              <a href={version.url} download data-external>
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
    const { addModalIsShow, changeVersionModalIsShow } = this.props;

    if (addModalIsShow) {
      const { versions, addModalIsLoading, addModalErrorMessage } = this.props;
      const currentVersion = versions.length ? versions[0].version : 1;

      return (
        <AddModal
          isShow
          title={t('Добавить новую версию')}
          currentVersion={currentVersion}
          onHideModal={this.handleToggleAddModal}
          onCreate={this.handleAddNewVersion}
          isLoading={addModalIsLoading}
          errorMessage={addModalErrorMessage}
        />
      );
    }

    if (changeVersionModalIsShow) {
      const { versions, changeVersionModalErrorMessage, changeVersionModalIsLoading } = this.props;

      return (
        <ChangeVersionModal
          isShow
          title={t('Сделать актуальной версию')}
          currentVersion={versions[0].version}
          onHideModal={this.handleToggleChangeVersionModal}
          onCreate={this.handleSetActiveVersion}
          isLoading={changeVersionModalIsLoading}
          errorMessage={changeVersionModalErrorMessage}
        />
      );
    }

    return null;
  }

  renderLoading() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur className="ecos-vj__loader" />;
  }

  render() {
    return (
      <div>
        <Dashlet
          title={t('Журнал версий')}
          className="ecos-vj"
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
          {this.renderLoading()}
        </Dashlet>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VersionsJournal);
