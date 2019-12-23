import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import { UncontrolledTooltip } from 'reactstrap';

import { isSmallMode, t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import IcoBtn from '../../common/btns/IcoBtn';
import Dashlet from '../../Dashlet/Dashlet';
import BaseWidget from '../BaseWidget';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import PropertiesSettings from './PropertiesSettings';

import './style.scss';

const Labels = {
  WIDGET_TITLE: 'properties-widget.title',
  BTN_EDIT_TIP: 'properties-widget.action-edit.title',
  BTN_SET_TIP: 'properties-widget.action-settings.title',
  BTN_BUILD_TIP: 'properties-widget.action-constructor.title'
};

const mapStateToProps = state => ({
  isAdmin: get(state, ['user', 'isAdmin'], false)
});

class PropertiesDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string,
    record: PropTypes.string,
    title: PropTypes.string,
    classNameProps: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    dragHandleProps: PropTypes.object,
    isAdmin: PropTypes.bool,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameProps: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: true
  };

  _propertiesRef = React.createRef();

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isSmallMode: false,
      isReady: true,
      isEditProps: false,
      formIsChanged: false,
      isSmall: false,
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      fitHeights: {},
      canEditRecord: false,
      isShowSetting: false
    };
  }

  componentDidMount() {
    EcosFormUtils.hasWritePermission(this.props.record).then(canEditRecord => {
      this.setState({ canEditRecord });
    });
  }

  checkEditRights = () => {
    const { record } = this.props;

    EcosFormUtils.getCanWritePermission(record).then(canEdit => {
      this.setState({ canEdit });
    });
  };

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onOpenModal = () => {
    this.setState({ isEditProps: true });
  };

  onCloseModal = () => {
    this.setState({ isEditProps: false });
  };

  onClickShowFormBuilder = () => {
    if (this._propertiesRef.current) {
      this._propertiesRef.current.onShowBuilder();
    }
  };

  onClickShowFormSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  onSaveFormSettings = config => {
    this.props.onSave && this.props.onSave(this.props.id, { config });
    this.onClickShowFormSettings();
  };

  updateProps = () => {
    this.setState({ isReady: false, isEditProps: false }, () => this.setState({ isReady: true }));
  };

  updateProperties = () => {
    this.setState({ formIsChanged: true }, () => this.setState({ formIsChanged: false }));
  };

  renderDashletCustomButtons(isDashlet = false) {
    const { id, isAdmin } = this.props;
    const { isShowSetting } = this.state;
    const buttons = [];

    if (isShowSetting) {
      return buttons;
    }

    const target = `settings-icon-${id}-${isDashlet ? '-dashlet' : '-properties'}`;

    buttons.push(
      <React.Fragment key={keySettingsBtn}>
        <IcoBtn
          id={keySettingsBtn}
          icon="icon-settings"
          className="ecos-properties-dashlet__btn-settings ecos-btn_i ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
          onClick={this.onClickShowFormSettings}
        />
        <UncontrolledTooltip
          target={keySettingsBtn}
          delay={0}
          placement="top"
          className="ecos-base-tooltip ecos-modal-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
        >
          {t(Labels.BTN_SET_TIP)}
        </UncontrolledTooltip>
      </React.Fragment>
    );

    if (isAdmin) {
      const keyConstructorBtn = `constructor-btn-${id}`;

      buttons.push(
        <React.Fragment key={keyConstructorBtn}>
          <IcoBtn
            id={keyConstructorBtn}
            icon="icon-forms"
            className="ecos-properties-dashlet__btn-settings ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
            onClick={this.onClickShowFormBuilder}
          />
          <UncontrolledTooltip
            target={keyConstructorBtn}
            delay={0}
            placement="top"
            className="ecos-base-tooltip ecos-modal-tooltip"
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
          >
            {t(Labels.BTN_BUILD_TIP)}
          </UncontrolledTooltip>
        </React.Fragment>
      );
    }

    return buttons;
  }

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging, config } = this.props;
    const {
      isSmallMode,
      isReady,
      isEditProps,
      userHeight,
      fitHeights,
      formIsChanged,
      isCollapsed,
      canEditRecord,
      isShowSetting
    } = this.state;
    const { formId = null } = config || {};

    return (
      <Dashlet
        title={title || t(Labels.WIDGET_TITLE)}
        className={classNames('ecos-properties-dashlet', classNameDashlet)}
        bodyClassName="ecos-properties-dashlet__body"
        actionEdit={canEditRecord && !isShowSetting}
        actionEditTitle={t(Labels.BTN_EDIT_TIP)}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        onEdit={this.onOpenModal}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        customButtons={this.renderDashletCustomButtons()}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Properties
          ref={this._propertiesRef}
          forwardedRef={this.contentRef}
          className={classNames(classNameProps, { 'ecos-properties_hidden': isShowSetting })}
          record={record}
          isSmallMode={isSmallMode}
          isReady={isReady}
          stateId={id}
          height={userHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          onUpdate={this.updateProperties}
          formId={formId}
        />
        {isShowSetting && (
          <PropertiesSettings
            record={record}
            stateId={id}
            formId={formId}
            onCancel={this.onClickShowFormSettings}
            onSave={this.onSaveFormSettings}
          />
        )}
        <PropertiesEditModal
          record={record}
          isOpen={isEditProps}
          onFormCancel={this.onCloseModal}
          onFormSubmit={this.updateProps}
          formIsChanged={formIsChanged}
        />
      </Dashlet>
    );
  }
}

export default connect(mapStateToProps)(PropertiesDashlet);
