import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import { UncontrolledTooltip } from 'reactstrap';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';
import get from 'lodash/get';
import classNames from 'classnames';

import Dashlet from '../Dashlet/Dashlet';
import { IcoBtn } from '../common/btns';
import Icon from '../common/icons/Icon/Icon';
import { Loader } from '../common';
import { t } from '../../helpers/util';

import AddModal from './AddModal';
import ChangeVersionModal from './ChangeVersionModal';
import ComparisonModal from './ComparisonModal';
import { addNewVersion, getVersions, getVersionsComparison, setActiveVersion, toggleModal } from '../../actions/versionsJournal';
import { MIN_WIDTH_DASHLET_LARGE } from '../../constants';
import { TOOLTIP, MODAL } from '../../constants/versionsJournal';
import { selectLabelsVersions } from '../../selectors/versionsJournal';

import Btn from '../common/btns/Btn';
import { Dropdown } from '../common/form';
import './style.scss';

const mapStateToProps = (state, ownProps) => {
  const id = get(ownProps, ['id']);
  const isMobile = get(state, ['view', 'isMobile'], false);

  return {
    id,
    isMobile,
    versions: get(state, ['versionsJournal', id, 'versions']),
    versionsLabels: selectLabelsVersions(state, id, isMobile),
    isLoading: get(state, ['versionsJournal', id, 'listIsLoading']),

    addModalIsLoading: get(state, ['versionsJournal', id, 'addModalIsLoading']),
    addModalIsShow: get(state, ['versionsJournal', id, 'addModalIsShow']),
    addModalErrorMessage: get(state, ['versionsJournal', id, 'addModalErrorMessage']),

    changeVersionModalIsShow: get(state, ['versionsJournal', id, 'changeVersionModalIsShow']),
    changeVersionModalIsLoading: get(state, ['versionsJournal', id, 'changeVersionModalIsLoading']),
    changeVersionModalErrorMessage: get(state, ['versionsJournal', id, 'changeVersionModalErrorMessage']),

    comparison: get(state, ['versionsJournal', id, 'comparison']),
    comparisonModalIsShow: get(state, ['versionsJournal', id, 'comparisonModalIsShow']),
    comparisonModalIsLoading: get(state, ['versionsJournal', id, 'comparisonModalIsLoading']),
    comparisonModalErrorMessage: get(state, ['versionsJournal', id, 'comparisonModalErrorMessage'])
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  getVersionsList: () => dispatch(getVersions({ record: ownProps.record, id: ownProps.id })),
  getVersionsComparison: payload => dispatch(getVersionsComparison({ ...payload, record: ownProps.record, id: ownProps.id })),
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
    versionsLabels: PropTypes.arrayOf([
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        text: PropTypes.string
      })
    ]),
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
    versionsLabels: [],
    isLoading: false,

    addModalIsLoading: false,
    addModalIsShow: false,
    addModalErrorMessage: '',

    changeVersionModalIsShow: false,
    changeVersionModalIsLoading: false,
    changeVersionModalErrorMessage: ''
  };

  constructor(props) {
    super(props);

    const state = {
      width: 290,
      selectedVersion: null,
      comparisonFirstVersion: null,
      comparisonSecondVersion: null
    };

    this.state = { ...state, ...VersionsJournal.getDefaultSelectedVersions(props) };
  }

  static getDerivedStateFromProps(props, state) {
    if (!state.comparisonFirstVersion && props.versionsLabels.length) {
      return { ...VersionsJournal.getDefaultSelectedVersions(props) };
    }

    return null;
  }

  static getDefaultSelectedVersions(props) {
    const state = {
      comparisonFirstVersion: null,
      comparisonSecondVersion: null
    };

    if (props.versionsLabels.length) {
      const [comparisonFirstVersion, comparisonSecondVersion] = props.versionsLabels;

      if (comparisonFirstVersion) {
        state.comparisonFirstVersion = comparisonFirstVersion.id;
      }

      if (comparisonSecondVersion) {
        state.comparisonSecondVersion = comparisonSecondVersion.id;
      }
    }

    return state;
  }

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

  handleSelectFirstVersion = data => {
    this.setState({ comparisonFirstVersion: data.id });
  };

  handleSelectSecondVersion = data => {
    this.setState({ comparisonSecondVersion: data.id });
  };

  handleClickShowComparisonModal = () => {
    const { comparisonFirstVersion, comparisonSecondVersion } = this.state;

    this.props.toggleModal(MODAL.COMPARISON);
    this.props.getVersionsComparison({ comparisonFirstVersion, comparisonSecondVersion });
  };

  handleClickHideComparisonModal = () => {
    this.props.toggleModal(MODAL.COMPARISON);
  };

  renderAddButton(isModal = false) {
    const { id, record } = this.props;

    if (!record) {
      return null;
    }

    if (isModal) {
      return (
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue ecos-vj__btn-add" onClick={this.handleToggleAddModal}>
          <Icon className="icon-plus ecos-vj__btn-add-icon" />
          <span className="ecos-vj__btn-add-title">{t('versions-journal-widget.add-version')}</span>
        </Btn>
      );
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
          {t('versions-journal-widget.add-version')}
        </UncontrolledTooltip>
      </span>
    );
  }

  renderVersionActions(version, isMobile = false) {
    const { id } = this.props;
    const key = `${version.id.replace(/[:@/]/gim, '')}-${id}`;

    return (
      <div
        className={classNames('ecos-vj__version-actions', {
          'ecos-vj__version-actions_mobile': isMobile
        })}
      >
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
          {t('versions-journal-widget.set-current')}
        </UncontrolledTooltip>
        <a href={version.url} download data-external>
          <Icon className="icon-download ecos-vj__version-actions-item" />
        </a>
      </div>
    );
  }

  renderVersion = (version, showActions = true) => {
    const { id, isMobile } = this.props;
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
          {showActions && !isMobile && this.renderVersionActions(version)}
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
          {showActions && isMobile && this.renderVersionActions(version, isMobile)}
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
    const versionBlock = version
      ? this.renderVersion(version, false)
      : this.renderMessage(t('versions-journal-widget.no-current-versions'));

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('versions-journal-widget.current-version')}</div>
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
      : this.renderMessage(t('versions-journal-widget.no-old-versions'));

    return (
      <React.Fragment>
        <div className="ecos-vj__title">{t('versions-journal-widget.old')}</div>
        {versionsBlock}
      </React.Fragment>
    );
  }

  renderModal() {
    const { addModalIsShow, changeVersionModalIsShow, comparisonModalIsShow } = this.props;

    if (addModalIsShow) {
      const { versions, addModalIsLoading, addModalErrorMessage } = this.props;
      const currentVersion = versions.length ? versions[0].version : 1;

      return (
        <AddModal
          isShow
          title={t('versions-journal-widget.add')}
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
          title={t('versions-journal-widget.set-current-version')}
          currentVersion={versions[0].version}
          onHideModal={this.handleToggleChangeVersionModal}
          onCreate={this.handleSetActiveVersion}
          isLoading={changeVersionModalIsLoading}
          errorMessage={changeVersionModalErrorMessage}
        />
      );
    }

    if (comparisonModalIsShow) {
      const { versionsLabels, versions, comparison, comparisonModalIsLoading } = this.props;
      const { comparisonFirstVersion, comparisonSecondVersion } = this.state;
      const selectedVersions = versions.filter(version => version.id === comparisonFirstVersion || version.id === comparisonSecondVersion);

      return (
        <ComparisonModal
          isShow
          isLoading={comparisonModalIsLoading}
          comparison={comparison}
          versions={selectedVersions}
          onHideModal={this.handleClickHideComparisonModal}
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

  renderComparison() {
    const { isMobile, versionsLabels } = this.props;
    const { comparisonFirstVersion, comparisonSecondVersion, width } = this.state;

    if (versionsLabels.length < 2) {
      return null;
    }

    const isSmall = isMobile || width <= MIN_WIDTH_DASHLET_LARGE;
    let comparisonButtonIsDisabled = false;

    if (comparisonSecondVersion && comparisonFirstVersion) {
      comparisonButtonIsDisabled = comparisonFirstVersion === comparisonSecondVersion;
    }

    return (
      <div
        className={classNames('ecos-vj__comparison', {
          'ecos-vj__comparison_small': isSmall
        })}
      >
        <Dropdown
          source={versionsLabels}
          value={comparisonFirstVersion}
          valueField="id"
          titleField={isSmall ? 'shortText' : 'text'}
          className="ecos-vj__comparison-dropdown"
          menuClassName="ecos-vj__comparison-dropdown-list"
          onChange={this.handleSelectFirstVersion}
          hideSelected
          withScrollbar
          scrollbarHeightMax="200px"
        >
          <IcoBtn
            invert
            icon="icon-down ecos-vj__comparison-dropdown-toggle-icon"
            className="ecos-vj__comparison-dropdown-toggle ecos-btn_transparent"
          />
        </Dropdown>

        <Dropdown
          source={versionsLabels}
          value={comparisonSecondVersion}
          valueField="id"
          titleField={isSmall ? 'shortText' : 'text'}
          className="ecos-vj__comparison-dropdown"
          menuClassName="ecos-vj__comparison-dropdown-list"
          onChange={this.handleSelectSecondVersion}
          hideSelected
          withScrollbar
          scrollbarHeightMax={'200px'}
        >
          <IcoBtn
            invert
            icon="icon-down ecos-vj__comparison-dropdown-toggle-icon"
            className="ecos-vj__comparison-dropdown-toggle ecos-btn_transparent"
          />
        </Dropdown>

        <Btn
          className={classNames('ecos-btn', 'ecos-vj__btn-comparison', {
            'ecos-btn_blue': !isMobile,
            'ecos-btn_hover_light-blue': !isMobile,
            'ecos-vj__btn-comparison_mobile': isMobile
          })}
          disabled={comparisonButtonIsDisabled}
          onClick={this.handleClickShowComparisonModal}
        >
          {t('Сравнить')}
        </Btn>
      </div>
    );
  }

  render() {
    const { isMobile, versionsLabels } = this.props;

    return (
      <div>
        <Dashlet
          title={t('versions-journal-widget.title')}
          className="ecos-vj"
          needGoTo={false}
          actionEdit={false}
          actionHelp={false}
          actionReload={false}
          resizable
          customButtons={[!isMobile && this.renderAddButton()]}
        >
          {(versionsLabels.length > 1 || isMobile) && (
            <div className="ecos-vj__block">
              {this.renderComparison()}

              {isMobile && this.renderAddButton(isMobile)}
            </div>
          )}

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
