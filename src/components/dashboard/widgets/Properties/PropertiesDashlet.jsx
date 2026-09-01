import { PERMISSION_WRITE_ATTR } from '@citeck/records-core/constants';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import Dashlet from '@/components/dashboard/Dashlet';
import { FORM_MODE_VIEW } from '@/components/forms/EcosForm';
import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';
import TaskAssignmentPanel from '@/components/domain/TaskAssignmentPanel';
import PointsLoader from '@/components/common/PointsLoader/PointsLoader';
import BaseWidget, { EVENTS } from '../BaseWidget';

import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import PropertiesSettings from './PropertiesSettings';

import { PropertiesApi } from '@/api/properties';
import { getFitnesseClassName } from '@/helpers/tools';
import { isTaskDashboard } from '@/helpers/urls';
import { isMobileDevice, isSmallMode, objectCompare, t } from '@/helpers/util';
import DAction from '@/services/DashletActionService';

import './style.scss';

const Labels = {
  WIDGET_TITLE: 'properties-widget.title',
  BTN_SUBMIT_TIP: 'properties-widget.action-submit.title',
  BTN_EDIT_TIP: 'properties-widget.action-edit.title',
  BTN_SET_TIP: 'properties-widget.action-settings.title',
  BTN_BUILD_TIP: 'properties-widget.action-constructor.title'
};

const MIN_REFRESH_SPIN_TIME = 500;

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

    this.permissionsWatcher = this.instanceRecord.watch(PERMISSION_WRITE_ATTR, this.checkPermissions);
    this.ref = this;

    this.state = {
      ...this.state,
      isSmallMode: isMobileDevice(),
      isEditProps: false,
      formIsChanged: false,
      isSmall: false,
      canEditRecord: false,
      isShowSetting: false,
      wasLastModifiedWithInlineEditor: false,
      wasLastModifiedWithFormSubmit: false,
      title: '',
      isDraft: false,
      formIsValid: false,
      componentsCount: -1,
      isRefreshing: false
    };

    this.instanceRecord.events.on(EVENTS.ASSOC_UPDATE, this.reload);
    this.instanceRecord.events.on(EVENTS.ATTS_UPDATED, this.reload);
  }

  componentDidMount() {
    super.componentDidMount();

    const widgetWidth = get(this.ref, '_dashletRef.clientWidth');

    this.setState({ isSmallMode: isSmallMode(widgetWidth) }, () => {
      this.checkPermissions();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    if ((prevProps.config || this.props.config) && !objectCompare(prevProps.config, this.props.config)) {
      this.reload();
    }

    if (prevProps.record !== this.props.record) {
      this.reload();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.instanceRecord.unwatch(this.permissionsWatcher);
    window.clearTimeout(this._refreshTimerId);
    isFunction(this._refreshSpinResolve) && this._refreshSpinResolve();
  }

  get dashletActions() {
    const { canEditRecord, isShowSetting, formIsValid, formIsChanged, isDraft, isSaving, isRefreshing } = this.state;

    if (isShowSetting) {
      return {};
    }

    const formId = get(this.props, 'config.formId');
    const formType = formId ? get(formId.split('@'), '1', '') : '';
    const formMode = get(this.props, 'config.formMode');

    let actions = {
      [DAction.Actions.RELOAD]: {
        className: classNames(getFitnesseClassName('properties-widget', formType, DAction.Actions.RELOAD), {
          'ecos-properties-dashlet__reload_active': isRefreshing
        }),
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

    if (formMode === 'EDIT' && formIsChanged) {
      actions = {
        [DAction.Actions.CANCEL]: {
          className: classNames(
            getFitnesseClassName('properties-widget', formType, DAction.Actions.CANCEL),
            'btn btn-secondary btn-xsm eform-edit-form-btn'
          ),
          onClick: () =>
            this.setState({ formIsChanged: false }, () => {
              const currentForm = get(this._propertiesRef, 'current._ecosForm.current');

              PropertiesApi.resetPropertipesDashlet(currentForm.state.recordId).then(() => {
                this.onReloadDashlet(true);
              });
            })
        },
        [DAction.Actions.SUBMIT]: {
          className: classNames(
            getFitnesseClassName('properties-widget', formType, DAction.Actions.SUBMIT),
            'btn btn-primary btn-xsm eform-edit-form-btn',
            {
              'disabled btn_disabled': isSaving || (!isDraft && !formIsValid)
            }
          ),
          component: (
            <button type="button">{isSaving ? <PointsLoader color="white" height={16} width={40} /> : t(Labels.BTN_SUBMIT_TIP)}</button>
          ),
          onClick: () => !isSaving && this.submitForm(isDraft)
        }
      };
    }

    return actions;
  }

  get formMode() {
    const { canEditRecord } = this.state;

    if (!canEditRecord) {
      return FORM_MODE_VIEW;
    }

    return get(this.props, 'config.formMode', FORM_MODE_VIEW);
  }

  // NB: there is no `reload()` override here. BaseWidget assigns `reload` as an instance field
  // (a debounced arrow), so a prototype method of the same name is shadowed and never runs —
  // the guard that used to live here ("do not reload while the form is open") was dead code.

  checkPermissions = () => {
    const { record } = this.props;

    EcosFormUtils.hasWritePermission(record, true)
      .then(canEditRecord => {
        // Only on a real change: `canEditRecord` feeds `formMode`, and re-setting it re-renders
        // Properties with new form options, which makes EcosForm rebuild the whole form.
        if (this.state.canEditRecord !== canEditRecord) {
          this.setState({ canEditRecord });
        }
      })
      .catch(console.error);

    PropertiesApi.isDraftStatus(record)
      .then(isDraft => {
        if (this.state.isDraft !== isDraft) {
          this.setState({ isDraft });
        }
      })
      .catch(console.error);
  };

  onInlineEditSave = () => {
    this.setState({
      formIsChanged: true,
      wasLastModifiedWithInlineEditor: true
    });
  };

  handleUpdate() {
    if (this.state.wasLastModifiedWithInlineEditor || this.state.wasLastModifiedWithFormSubmit) {
      const form = get(this._propertiesRef, 'current._ecosForm.current._form');

      if (form && isFunction(form.getAllComponents)) {
        form.getAllComponents().forEach(component => {
          component.valueChangedByUser = false;
        });
      }

      this.setState({
        wasLastModifiedWithInlineEditor: false,
        wasLastModifiedWithFormSubmit: false,
        isSaving: false,
        formIsValid: true
      });

      this.checkPermissions();

      return;
    }

    this.softReloadDashlet();
  }

  /**
   * Background update (the record changed outside this widget).
   *
   * Keeps the rendered form in place: the reload icon in the header spins while the record is
   * re-read, and the form is patched only if the data really differs (COREDEV-429). The full
   * reload with a loader stays on the user-triggered path — {@link onReloadDashlet}.
   */
  softReloadDashlet = () => {
    // Overlapping runs would overwrite each other's spin timer and resolver, and the first one to
    // settle would stop the icon while the other re-read is still in flight. One at a time — a
    // request arriving mid-run (say, the edit modal's submit during a background tick) is not
    // dropped but coalesced into one trailing pass.
    if (this._softReloadInFlight) {
      this._softReloadPending = true;
      return;
    }

    const softUpdate = get(this._propertiesRef, 'current.softUpdateForm');
    const hasForm = !!get(this._propertiesRef, 'current.form');

    if (!isFunction(softUpdate) || !hasForm) {
      this.onReloadDashlet(false);
      return;
    }

    this._softReloadInFlight = true;

    this.setState({ isRefreshing: true });
    this.checkPermissions();

    // The minimal spin keeps the indication readable: re-reading a cached record can finish in a
    // couple of frames, and a spinner that appears and disappears within them just looks like a glitch.
    const minSpin = new Promise(resolve => {
      // Kept for the unmount path: clearing the timeout alone would leave this promise pending
      // forever, and the Promise.all below — with everything it closes over — pinned in memory.
      this._refreshSpinResolve = resolve;
      this._refreshTimerId = window.setTimeout(resolve, MIN_REFRESH_SPIN_TIME);
    });

    Promise.all([Promise.resolve(softUpdate()).catch(console.error), minSpin]).then(() => {
      this._softReloadInFlight = false;

      if (this._isMounted) {
        this.setState({ isRefreshing: false });
      }

      if (this._softReloadPending) {
        this._softReloadPending = false;
        this._isMounted && this.softReloadDashlet();
      }
    });
  };

  onReloadDashlet = withSaveData => {
    const onUpdate = get(this._propertiesRef, 'current.onUpdateForm');

    this.checkPermissions();
    this.setPreviousHeight();

    if (!isFunction(onUpdate)) {
      return;
    }

    this.setState({
      componentsCount: -1
    });

    onUpdate(withSaveData);
  };

  onResize = width => {
    if (width > 0) {
      this.setState({ isSmallMode: isSmallMode(width) });
    }
  };

  onFormIsChanged = (trigger, formIsValid) => {
    this.setState({
      formIsChanged: !!trigger,
      formIsValid
    });
  };

  submitForm = isDraft => {
    const currentForm = get(this._propertiesRef, 'current._ecosForm.current');
    const form = get(currentForm, '_form');

    if (!isDraft && form && isFunction(form.checkValidity) && !form.checkValidity(form.data, false)) {
      this.setState({ formIsValid: false });
      return;
    }

    this.setState({ formIsChanged: false, isSaving: true, wasLastModifiedWithFormSubmit: true }, () => {
      currentForm.submitForm.cancel();

      const submission = currentForm._form;
      const baseForm = get(this._propertiesRef, 'current._hiddenEcosForm.current._form');

      // Flush any pending widget values (e.g. flatpickr debounces time-spinner
      // changes for 300 ms) so that submission.data is up-to-date. Use
      // noUpdateEvent so the flush does not emit form 'change' events that
      // would later resurface as a stale onFormChanged with dirty=true and
      // disable the Save button on the next edit cycle.
      if (submission) {
        const allComponents = submission.getAllComponents();
        allComponents.forEach(component => component.updateValue({ changeByUser: true, noUpdateEvent: true }));
      }

      currentForm.submitForm(baseForm, submission, true);
    });
  };

  openModal = () => {
    this.setState({ isEditProps: true });
  };

  closeModal = () => {
    this.setState({ isEditProps: false });
  };

  onClickShowFormBuilder = () => {
    const onShowBuilder = get(this._propertiesRef, 'current.onShowBuilder');

    if (isFunction(onShowBuilder)) {
      onShowBuilder();
    }
  };

  toggleDisplayFormSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  changeComponentsCount = componentsCount => {
    this.setState({ componentsCount });
  };

  onSaveFormSettings = config => {
    this.props.onSave && this.props.onSave(this.props.id, { config });
    this.toggleDisplayFormSettings();
  };

  onPropertiesEditFormSubmit = () => {
    this.setState({ isEditProps: false });
    // The widget's own edit modal is as much a background change for the *rendered* form as a
    // neighbouring widget's edit: the view form under the modal is intact, only the record's data
    // moved. Patch it in place (COREDEV-429) — the full reload stays on the manual-reload path.
    this.softReloadDashlet();
  };

  onPropertiesUpdate = () => {
    this.setState({ formIsChanged: true, isSaving: false, formIsValid: true }, () => this.setState({ formIsChanged: false }));
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
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging, config, ...props } = this.props;
    const {
      isSmallMode,
      isEditProps,
      formIsChanged,
      isShowSetting,
      title: titleForm,
      previousHeight,
      isDraft,
      componentsCount
    } = this.state;
    const { formId = '', titleAsFormName } = config || {};
    const titleDashlet = t((titleAsFormName && titleForm) || title || Labels.WIDGET_TITLE);

    return (
      <Dashlet
        {...props}
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
          componentsCount={componentsCount}
          changeComponentsCount={this.changeComponentsCount}
          onFormIsChanged={this.onFormIsChanged}
          formId={formId}
          onInlineEditSave={this.onInlineEditSave}
          getTitle={this.setTitle}
          scrollProps={this.scrollbarProps}
          isDraft={isDraft}
          formMode={this.formMode}
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
