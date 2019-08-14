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

const mapStateToProps = (state, ownProps) => ({
  id: get(ownProps, ['id']),
  versions: get(state, ['versionsJournal', ownProps.id, 'versions']),
  isLoading: get(state, ['versionsJournal', ownProps.id, 'listIsLoading']),

  addModalIsLoading: get(state, ['versionsJournal', ownProps.id, 'addModalIsLoading']),
  addModalIsShow: get(state, ['versionsJournal', ownProps.id, 'addModalIsShow']),
  addModalErrorMessage: get(state, ['versionsJournal', ownProps.id, 'addModalErrorMessage']),

  changeVersionModalIsShow: get(state, ['versionsJournal', ownProps.id, 'changeVersionModalIsShow']),
  changeVersionModalIsLoading: get(state, ['versionsJournal', ownProps.id, 'changeVersionModalIsLoading']),
  changeVersionModalErrorMessage: get(state, ['versionsJournal', ownProps.id, 'changeVersionModalErrorMessage'])
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  getVersionsList: () => dispatch(getVersions({ record: ownProps.record, id: ownProps.id })),
  addNewVersion: payload => dispatch(addNewVersion({ ...payload, record: ownProps.record, id: ownProps.id })),
  toggleModal: key => dispatch(toggleModal({ key, record: ownProps.record, id: ownProps.id })),
  setActiveVersion: payload => dispatch(setActiveVersion({ ...payload, record: ownProps.record, id: ownProps.id }))
});

class VersionsJournal extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    versions: PropTypes.arrayOf(
      PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string,
        middleName: PropTypes.string,
        userName: PropTypes.string,
        comment: PropTypes.string,
        version: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        name: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        url: PropTypes.string.isRequired,
        avatar: PropTypes.string
      })
    ),
    isLoading: PropTypes.bool,

    addModalIsLoading: PropTypes.bool,
    addModalIsShow: PropTypes.bool,
    addModalErrorMessage: PropTypes.string,

    changeVersionModalIsShow: PropTypes.bool,
    changeVersionModalIsLoading: PropTypes.bool,
    changeVersionModalErrorMessage: PropTypes.string
  };

  static defaultProps = {
    versions: [],
    isLoading: false,

    addModalIsLoading: false,
    addModalIsShow: false,
    addModalErrorMessage: '',

    changeVersionModalIsShow: false,
    changeVersionModalIsLoading: false,
    changeVersionModalErrorMessage: ''
  };

  state = {
    width: 290,
    selectedVersion: null
  };

  componentDidMount() {
    this.props.getVersionsList();
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
    this.props.addNewVersion(data);
  };

  handleSetActiveVersion = data => {
    const { selectedVersion } = this.state;

    this.props.setActiveVersion({
      ...data,
      versionId: selectedVersion.id,
      version: selectedVersion.version
    });
  };

  handleOpenSetActiveVersionModal = version => {
    this.handleToggleChangeVersionModal();
    this.setState({ selectedVersion: version });
  };

  renderAddButton() {
    const { id, record } = this.props;

    if (!record) {
      return null;
    }

    return (
      <span key="add-button">
        <IcoBtn
          id={`${TOOLTIP.ADD_NEW_VERSION}-${id}`}
          key="action-open-modal"
          icon="icon-plus"
          onClick={this.handleToggleAddModal}
          className="ecos-btn_i dashlet__btn_hidden dashlet__btn_next dashlet__btn_add ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        />
        <UncontrolledTooltip
          placement="top"
          boundariesElement="window"
          key="action-open-modal-tooltip"
          innerClassName="ecos-vj__tooltip"
          arrowClassName="ecos-vj__tooltip-arrow"
          target={`${TOOLTIP.ADD_NEW_VERSION}-${id}`}
        >
          {t('Добавить версию')}
        </UncontrolledTooltip>
      </span>
    );
  }

  renderVersion = (version, showActions = true) => {
    const { id } = this.props;
    const key = `${version.id.replace(/[:@/]/gim, '')}-${id}`;
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
      <div className="ecos-vj__version" key={key}>
        <div className="ecos-vj__version-header">
          <div className="ecos-vj__version-number">{version.version}</div>
          <div className="ecos-vj__version-title">{version.name}</div>
          {showActions && (
            <div className="ecos-vj__version-actions">
              <Icon onClick={this.handleClickShowModal} className="icon-on ecos-vj__version-actions-item" />
              <Icon
                id={`${TOOLTIP.SET_ACTUAL_VERSION}-${key}`}
                onClick={this.handleOpenSetActiveVersionModal.bind(null, version)}
                className="icon-actual ecos-vj__version-actions-item"
              />
              <UncontrolledTooltip
                placement="top"
                boundariesElement="window"
                innerClassName="ecos-vj__tooltip"
                arrowClassName="ecos-vj__tooltip-arrow"
                target={`${TOOLTIP.SET_ACTUAL_VERSION}-${key}`}
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
