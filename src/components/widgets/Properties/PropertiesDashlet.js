import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { isSmallMode, objectCompare, t } from '../../../helpers/util';
import { isTaskDashboard } from '../../../helpers/urls';
import DAction from '../../../services/DashletActionService';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import TaskAssignmentPanel from '../../TaskAssignmentPanel';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import PropertiesSettings from './PropertiesSettings';
import { PropertiesApi } from '../../../api/properties';
import { getFitnesseClassName } from '../../../helpers/tools';

import './style.scss';

const Labels = {
  WIDGET_TITLE: 'properties-widget.title',
  BTN_SUBMIT_TIP: 'properties-widget.action-submit.title',
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
      title: '',
      isDraft: false
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

    const formId = get(this.props, 'config.formId');
    const formType = formId ? get(formId.split('@'), '1', '') : '';
    const formMode = get(this.props, 'config.formMode');

    let actions = {
      [DAction.Actions.RELOAD]: {
        className: getFitnesseClassName('properties-widget', formType, DAction.Actions.RELOAD),
        onClick: this.onReloadDashlet
      },
      [DAction.Actions.SETTINGS]: {
        className: getFitnesseClassName('properties-widget', formType, DAction.Actions.SETTINGS),
        onClick: this.toggleDisplayFormSettings
      },
      [DAction.Actions.BUILDER]: {
        className: getFitnesseClassName('properties-widget', formType, DAction.Actions.BUILDER),
        icon: 'icon-forms',
        text: t(Labels.BTN_BUILD_TIP),
        onClick: this.onClickShowFormBuilder
      }
    };

    if (canEditRecord) {
      actions[DAction.Actions.EDIT] = {
        className: getFitnesseClassName('properties-widget', formType, DAction.Actions.EDIT),
        text: t(Labels.BTN_EDIT_TIP),
        onClick: this.openModal
      };
    }

    if (formMode === 'EDIT' && this.state.formIsChanged) {
      actions = {
        [DAction.Actions.CANCEL]: {
          className: getFitnesseClassName(
            'properties-widget btn btn-secondary btn-md eform-edit-form-btn mr-3',
            formType,
            DAction.Actions.CANCEL
          ),
          onClick: () => this.setState({ formIsChanged: false }, this.onReloadDashlet)
        },
        [DAction.Actions.SUBMIT]: {
          className: getFitnesseClassName(
            'properties-widget btn btn-primary btn-md eform-edit-form-btn mr-3',
            formType,
            DAction.Actions.SUBMIT
          ),
          onClick: this.submitForm
        }
      };
    }

    return actions;
  }

  checkPermissions = () => {
    const { record } = this.props;

    EcosFormUtils.hasWritePermission(record, true)
      .then(canEditRecord => {
        this.setState({ canEditRecord });
      })
      .catch(console.error);

    PropertiesApi.isDraftStatus(record).then(isDraft => {
      this.setState({ isDraft });
    });
  };

  onInlineEditSave = () => {
    this.setState({
      formIsChanged: true,
      wasLastModifiedWithInlineEditor: true
    });
  };

  handleUpdate() {
    if (this.state.wasLastModifiedWithInlineEditor) {
      this.setState({ wasLastModifiedWithInlineEditor: false });
    }

    this.onReloadDashlet(this.state.wasLastModifiedWithInlineEditor);
  }

  onReloadDashlet = withSaveData => {
    const onUpdate = get(this._propertiesRef, 'current.wrappedInstance.onUpdateForm');

    this.checkPermissions();
    this.setPreviousHeight();

    if (!isFunction(onUpdate)) {
      return;
    }

    onUpdate(withSaveData);
  };

  onResize = width => {
    if (width > 0) {
      this.setState({ isSmallMode: isSmallMode(width) });
    }
  };

  submitForm = () => {
    const form = get(this._propertiesRef, 'current.wrappedInstance._ecosForm.current');
    const submission = form._form;

    if (isFunction(form.submitForm)) {
      try {
        form.submitForm(form, submission);
      } finally {
        this.setState({ formIsChanged: false });
        this.onReloadDashlet();
      }
    }
  };

  openModal = () => {
    this.setState({ isEditProps: true });
  };

  closeModal = () => {
    this.setState({ isEditProps: false });
  };

  onClickShowFormBuilder = () => {
    const onShowBuilder = get(this._propertiesRef, 'current.wrappedInstance.onShowBuilder');

    if (isFunction(onShowBuilder)) {
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
      return <TaskAssignmentPanel narrow taskId={record} />;
    }

    return null;
  };

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging, config } = this.props;
    const { isSmallMode, isEditProps, formIsChanged, isShowSetting, title: titleForm, previousHeight, isDraft } = this.state;
    const { formId = '', titleAsFormName } = config || {};
    const titleDashlet = t((titleAsFormName && titleForm) || title || Labels.WIDGET_TITLE);

    const formMode = get(this.props, 'config.formMode', 'VIEW');

    return (
      <Dashlet
        setRef={this.setDashletRef}
        title={titleDashlet}
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
        isCollapsed={this.isCollapsed}
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
          isDraft={isDraft}
          formMode={formMode}
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
