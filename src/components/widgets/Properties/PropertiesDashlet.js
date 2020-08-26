import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import { isSmallMode, objectCompare, t } from '../../../helpers/util';
import DAction from '../../../services/DashletActionService';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import PropertiesSettings from './PropertiesSettings';
import { isTaskDashboard } from '../../../helpers/urls';
import TaskAssignmentPanel from '../../TaskAssignmentPanel';

import './style.scss';

const Labels = {
  WIDGET_TITLE: 'properties-widget.title',
  BTN_EDIT_TIP: 'properties-widget.action-edit.title',
  BTN_SET_TIP: 'properties-widget.action-settings.title',
  BTN_BUILD_TIP: 'properties-widget.action-constructor.title'
};

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
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameProps: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: false
  };

  _propertiesRef = React.createRef();

  constructor(props) {
    super(props);

    this.permissionsWatcher = this.instanceRecord.watch('.att(n:"permissions"){has(n:"Write")}', this.checkPermissions);

    this.state = {
      ...this.state,
      isSmallMode: false,
      isEditProps: false,
      formIsChanged: false,
      isSmall: false,
      canEditRecord: false,
      isShowSetting: false,
      wasLastModifiedWithInlineEditor: false,
      title: ''
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this.checkPermissions();
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    if (!objectCompare(prevProps.config, this.props.config)) {
      this.reload();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.instanceRecord.unwatch(this.permissionsWatcher);
  }

  get dashletActions() {
    const { canEditRecord, isShowSetting } = this.state;

    if (isShowSetting) {
      return {};
    }

    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.onReloadDashlet
      },
      [DAction.Actions.SETTINGS]: {
        onClick: this.toggleDisplayFormSettings
      },
      [DAction.Actions.BUILDER]: {
        icon: 'icon-forms',
        text: t(Labels.BTN_BUILD_TIP),
        onClick: this.onClickShowFormBuilder
      }
    };

    if (canEditRecord) {
      actions[DAction.Actions.EDIT] = {
        text: t(Labels.BTN_EDIT_TIP),
        onClick: this.openModal
      };
    }

    return actions;
  }

  checkPermissions = () => {
    EcosFormUtils.hasWritePermission(this.props.record, true)
      .then(canEditRecord => {
        this.setState({ canEditRecord });
      })
      .catch(console.error);
  };

  onInlineEditSave = () => {
    this.setState({ wasLastModifiedWithInlineEditor: true });
  };

  handleUpdate() {
    if (this.state.wasLastModifiedWithInlineEditor) {
      this.setState({ wasLastModifiedWithInlineEditor: false });
    }

    this.onReloadDashlet(this.state.wasLastModifiedWithInlineEditor);
  }

  onReloadDashlet = withSaveData => {
    const onUpdate = get(this._propertiesRef, 'current.onUpdateForm');

    this.checkPermissions();
    this.setPreviousHeight();

    if (typeof onUpdate !== 'function') {
      return;
    }

    onUpdate(withSaveData);
  };

  onResize = width => {
    if (width > 0) {
      this.setState({ isSmallMode: isSmallMode(width) });
    }
  };

  openModal = () => {
    this.setState({ isEditProps: true });
  };

  closeModal = () => {
    this.setState({ isEditProps: false });
  };

  onClickShowFormBuilder = () => {
    const onShowBuilder = get(this._propertiesRef, 'current.onShowBuilder');

    if (typeof onShowBuilder === 'function') {
      onShowBuilder();
    }
  };

  toggleDisplayFormSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  onSaveFormSettings = config => {
    this.props.onSave && this.props.onSave(this.props.id, { config });
    this.toggleDisplayFormSettings();
  };

  onPropertiesEditFormSubmit = () => {
    this.setState({ isEditProps: false });
    this.onReloadDashlet();
  };

  onPropertiesUpdate = () => {
    this.setState({ formIsChanged: true }, () => this.setState({ formIsChanged: false }));
  };

  setTitle = title => {
    this.setState({ title });
  };

  renderAssignmentPanel = () => {
    const { record } = this.props;

    if (record && isTaskDashboard()) {
      return <TaskAssignmentPanel narrow executeRequest taskId={record} />;
    }

    return null;
  };

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging, config } = this.props;
    const { isSmallMode, isEditProps, formIsChanged, isCollapsed, isShowSetting, title: titleForm, previousHeight } = this.state;
    const { formId = '', titleAsFormName } = config || {};

    return (
      <Dashlet
        setRef={this.setDashletRef}
        title={t((titleAsFormName && titleForm) || title || Labels.WIDGET_TITLE)}
        className={classNames('ecos-properties-dashlet', classNameDashlet)}
        bodyClassName="ecos-properties-dashlet__body"
        actionConfig={this.dashletActions}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        getFitHeights={this.setFitHeights}
        onChangeHeight={this.handleChangeHeight}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Properties
          ref={this._propertiesRef}
          forwardedRef={this.contentRef}
          className={classNames(classNameProps, { 'ecos-properties_hidden': isShowSetting })}
          record={record}
          isSmallMode={isSmallMode}
          stateId={id}
          minHeight={previousHeight}
          onUpdate={this.onPropertiesUpdate}
          formId={formId}
          onInlineEditSave={this.onInlineEditSave}
          getTitle={this.setTitle}
          scrollProps={this.scrollbarProps}
        />
        {isShowSetting && (
          <PropertiesSettings
            record={record}
            stateId={id}
            config={config}
            onCancel={this.toggleDisplayFormSettings}
            onSave={this.onSaveFormSettings}
          />
        )}
        <PropertiesEditModal
          record={record}
          isOpen={isEditProps}
          formId={formId}
          onFormCancel={this.closeModal}
          onFormSubmit={this.onPropertiesEditFormSubmit}
          formIsChanged={formIsChanged}
          assignmentPanel={this.renderAssignmentPanel}
        />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
