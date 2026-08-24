import classNames from 'classnames';
import Formio from 'formiojs/Formio';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';
import uuidv4 from 'uuidv4';

import { getCurrentLocale } from '../../../../helpers/export/util';
import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';

class FormWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      containerId: 'form-wrapper-' + uuidv4()
    };

    this._form = null;
    this._isBuilding = false;
    // Identifies the build whose result is still wanted; see initForm
    this._buildId = 0;
    this.formRef = React.createRef();
  }

  componentDidMount() {
    const { forwardedRef } = this.props;

    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(this);
      } else if (typeof forwardedRef === 'object') {
        forwardedRef.current = this;
      }
    }

    this.initForm();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (isEqual(prevProps, this.props)) {
      return;
    }

    if (this.canUpdateValuesOnly(prevProps)) {
      this.updateFormData(prevProps.formData, this.props.formData);
      return;
    }

    this.initForm();
  }

  componentWillUnmount() {
    // Orphans any in-flight build: its `then` sees a stale id and destroys the form it built
    this._buildId += 1;
    this._isBuilding = false;

    if (this._form) {
      const form = this._form;
      this._form = null;
      setTimeout(() => form.destroy(), 0);
    }
  }

  get form() {
    return this._form;
  }

  /**
   * Keys whose values differ between the two objects, the keys missing from one of them included.
   */
  static getChangedKeys(prev = {}, next = {}) {
    const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);

    return [...keys].filter(key => !isEqual(get(prev, [key]), get(next, [key])));
  }

  /**
   * A full re-initialization (destroy + `Formio.createForm`) is only required when something the
   * built form is actually made of has changed: the definition, the options, the i18n bundle,
   * visibility, or the identity of a handler bound to the form instance. When the only difference
   * is the data, the already built form is updated in place instead.
   *
   * That is what removes the flicker of a kanban card whose record has been refreshed: the board
   * commits the refreshed data twice (measured on an edit through the card actions), and each of
   * those commits used to destroy and rebuild the whole card body although only the data differed.
   */
  canUpdateValuesOnly(prevProps) {
    /**
     * `onBeforeFormDestroy` is called from `initForm` only, and ModelEditor uses it to persist the
     * data of the element that is being left (an element rename included). Keeping the form alive
     * would silently drop those changes, so a consumer that passes the callback always gets the
     * full rebuild. Kanban cards do not pass it.
     */
    if (isFunction(this.props.onBeforeFormDestroy)) {
      return false;
    }

    // Nothing has been built yet (or it has been torn down) — there is nothing to update in place.
    if (!this.props.isVisible || (!this._form && !this._isBuilding)) {
      return false;
    }

    const changedKeys = FormWrapper.getChangedKeys(prevProps, this.props);

    return changedKeys.length === 1 && changedKeys[0] === 'formData';
  }

  updateFormData(prevFormData, formData) {
    const changedKeys = FormWrapper.getChangedKeys(prevFormData, formData);

    if (isEmpty(changedKeys)) {
      return;
    }

    /**
     * `Formio.createForm` is asynchronous and the pending build reads `this.props.formData` when it
     * resolves, so it picks the new values up on its own. Re-initializing here would throw the
     * in-flight form away and build a second one — exactly the extra flicker being fixed.
     */
    if (!this._form) {
      return;
    }

    const data = {};

    // Keys dropped from the data are passed as undefined on purpose, so that the form clears them
    // instead of keeping the previous value (`setValue` merges over the current data).
    changedKeys.forEach(key => {
      data[key] = get(formData, [key]);
    });

    this.setValue(data);

    /**
     * `setValue` only refreshes the model. In read-only `viewAsHtml` mode — which is exactly how a
     * kanban card is rendered — a component paints its value into static markup that is built once,
     * so the form would keep showing the previous value without an explicit repaint.
     *
     * The repaint has to happen at form level rather than on the changed components alone: card
     * values are not taken from the data as-is, an `asyncData` component resolves the raw attribute
     * values into the labels the card displays (a priority id like `300_medium` into `Medium`).
     * That resolution is part of the component lifecycle, so repainting single components leaves
     * the raw ids on screen. `redraw` rebuilds the markup from the live form instance, which is
     * still far cheaper than `initForm` — no destroy, no asynchronous `Formio.createForm`, and no
     * empty card in between.
     *
     * @todo EcosForm on the COREDEV-429 branch has a per-component variant of this
     * (`_redrawComponents`, used by `softReload`). When 429 is merged, check whether the two can
     * share one helper — mind that the per-component variant is not enough for card forms.
     */
    this.update();
  }

  initForm() {
    this._isBuilding = false;

    if (this._form) {
      const { onBeforeFormDestroy } = this.props;

      if (isFunction(onBeforeFormDestroy)) {
        onBeforeFormDestroy(this._form.getValue());
      }

      this._form.formReadyReject();
      const oldForm = this._form;
      this._form = null;
      setTimeout(() => oldForm.destroy(), 0);
    }

    if (!this.props.isVisible) {
      return;
    }

    const containerElement = document.getElementById(this.state.containerId);
    const formDefinition = this.props.formDefinition;

    if (!containerElement || !formDefinition) {
      return;
    }

    const onSubmit = this.props.onSubmit || (() => undefined);
    const options = {
      ...(this.props.formOptions || {}),
      onSubmit
    };

    const i18n = options.i18n || {};
    const language = options.language || getCurrentLocale();
    const defaultI18N = i18n[language] || {};
    const formI18N = (this.props.formI18n || {})[language] || {};

    i18n[language] = EcosFormUtils.getI18n(defaultI18N, {}, formI18N);
    options.i18n = i18n;
    options.language = language;

    const processedDefinition = EcosFormUtils.preProcessFormDefinition(formDefinition, options);

    this._isBuilding = true;

    /**
     * `Formio.createForm` is asynchronous, so a second build (or an unmount) can start while this
     * one is still in flight. Whoever changes `_buildId` afterwards owns the container: a build that
     * resolves to a stale id was never seen by the user — it is destroyed on the spot, without
     * `onBeforeFormDestroy` (there is nothing of the user's in it) and without touching `_form`.
     */
    const buildId = ++this._buildId;

    const formPromise = Formio.createForm(containerElement, processedDefinition, options);

    formPromise.then(form => {
      if (buildId !== this._buildId) {
        form.destroy();
        return;
      }

      let data = {};

      this._isBuilding = false;

      this.setEvents(form, { onSubmit });

      if (this.props.formData) {
        data = {
          ...this.props.formData
        };
      }

      if (!isEmpty(data)) {
        form.setValue({ data });
      }

      form.formReady.then(() => {
        isFunction(this.props.onFormReady) && this.props.onFormReady(this._form);
      });

      this._form = form;
    });
  }

  update = () => {
    if (!this._form) {
      return;
    }

    this._form.redraw();
  };

  setValue = (data, flags) => {
    if (!this._form) {
      return;
    }

    /**
     * @todo Maybe should think about optimization. For example, check previous and current values
     * @todo Or set values with a delay, accumulating frequent changes into a separate object
     */
    const formData = this._form.getValue();

    this._form.setValue(
      {
        ...formData,
        data: {
          ...formData.data,
          ...data
        }
      },
      flags
    );
  };

  checkForChanges(params) {
    const { data = {}, formData = {} } = params;
    const changed = {};
    for (let key in data) {
      if (data.hasOwnProperty(key) && formData.hasOwnProperty(key)) {
        if (data[key] !== formData[key]) {
          changed[key] = {
            oldValue: formData[key],
            newValue: data[key]
          };
        }
      }
    }
    return Object.keys(changed).length > 0
      ? {
          instance: changed,
          component: { type: 'button' }
        }
      : null;
  }

  setEvents(form, extra = {}) {
    form.on('submit', submission => {
      let res = extra.onSubmit(submission);

      /* Since the "form" parameter contains an already changeable form,
      the original form object is needed to confirm the changes - currentForm */
      if (this.props.formData && this.props.currentForm && !isEmpty(this.props.currentForm)) {
        submission.changed = this.checkForChanges({ data: submission.data, formData: this.props.formData });
        this.props.currentForm.emit('change', submission);
      }

      if (res && res.catch) {
        res.catch(e => {
          form.showErrors(e, true);
        });
      }
    });

    if (this.props.onFormCancel) {
      form.on('cancel', () => {
        this.props.onFormCancel();
      });
    }

    if (this.props.onFormChange) {
      form.on('change', (...args) => {
        this.props.onFormChange(...args, form);
      });
    }
  }

  render() {
    return (
      <div
        ref={this.formRef}
        id={this.state.containerId}
        className={classNames('formio-form', this.props.className)}
        onClick={this.props.onClick}
      />
    );
  }
}

FormWrapper.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  isVisible: PropTypes.bool,
  formDefinition: PropTypes.object,
  formOptions: PropTypes.object,
  formI18n: PropTypes.object,
  formData: PropTypes.object,
  currentForm: PropTypes.object,
  onClick: PropTypes.func,
  onSubmit: PropTypes.func,
  onFormCancel: PropTypes.func,
  onFormChange: PropTypes.func,
  onFormReady: PropTypes.func,
  onBeforeFormDestroy: PropTypes.func
};

export default FormWrapper;
