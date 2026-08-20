import FormIOButtonComponent from 'formiojs/components/button/Button';
import { flattenComponents } from 'formiojs/utils/formUtils';
import each from 'lodash/each';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { OUTCOME_BUTTONS_PREFIX } from '@citeck/constants/forms';

const MAX_WAITING_TIME = 30000;

export default class ButtonComponent extends FormIOButtonComponent {
  static schema(...extend) {
    return FormIOButtonComponent.schema(
      {
        removeIndents: false,
        disableOnFormInvalid: false
      },
      ...extend
    );
  }

  get defaultSchema() {
    return ButtonComponent.schema();
  }

  get shouldDisable() {
    return super.shouldDisable || (this.component.disableOnFormInvalid && !this.root.isValid(this.data, true));
  }

  // Declaring only `set disabled` would define an accessor with NO getter on this prototype, and property lookup
  // stops there — the base class's `get disabled` (which returns `_disabled`) would never be reached, so
  // `this.disabled` read `undefined` for every button regardless of what had been set. Re-expose the base getter.
  get disabled() {
    return super.disabled;
  }

  set disabled(disabled) {
    if (disabled && this.component.disableOnInvalid && !this.shouldDisable) {
      disabled = false;
    }

    super.disabled = disabled;
  }

  set loading(loading) {
    // Do not touch the element's disabled state while the component itself is disabled: a loading cycle that ends
    // must not ENABLE a button something disabled on purpose. (The guard used to read
    // `(loading && !this.disabled) || (!loading && !this.disabled)`, which is the same test written twice — and,
    // with the getter missing, was unconditionally true.)
    if (!this.disabled) {
      this.setDisabled(this.buttonElement, loading);
    }

    super.loading = loading;
  }

  build() {
    super.build();

    this.bindEvents();
    if (this.component.removeIndents && this.parent) {
      const parentEl = this.parent.element;
      if (!parentEl.classList.contains('col-12-manual')) {
        this.element.classList.remove('form-group');
        this.buttonElement.classList.add('btn_without-indents');
        if (this.parent.parent) {
          this.parent.parent.element.classList.add('ecos-form-buttons-container-manual');
        }
      }
    }

    const options = this.options;

    if (options.useNarrowButtons) {
      this.buttonElement.classList.add('btn_narrow');
    }
  }

  // TODO the "find outcome_* keys and clear them" logic is spread over four places by now:
  // Webform.submit, EcosForm.resetOutcomeButtonsValues, TaskOutcome.beforeSubmit and the method below.
  // Move it into a single helper next to OUTCOME_BUTTONS_PREFIX and drop TaskOutcome's own prefix literal.
  /**
   * Drops the outcomes left in the form data by earlier clicks.
   *
   * A click marks its outcome right away, but the submit may never happen — the form gate returns
   * early, the user closes the dialog the button opened, validation rejects. Nothing clears the
   * mark then (resetOutcomeButtonsValues only runs when save() fails), so the abandoned verdict
   * travels with the next submission: either next to a second one, and the task completion is
   * rejected as ambiguous, or alone under a plain save, which quietly completes the task with it.
   *
   * Any click is a fresh intent and invalidates what the previous ones left behind, so this runs
   * for every button and keeps the outcome of the clicked one only.
   */
  resetOtherOutcomeButtons() {
    const key = get(this, 'component.key', '');
    const root = this.root;
    const data = get(root, 'data') || this.data;

    if (!data || !isFunction(get(root, 'getComponent'))) {
      return;
    }

    Object.keys(data).forEach(dataKey => {
      if (dataKey === key || !dataKey.startsWith(OUTCOME_BUTTONS_PREFIX)) {
        return;
      }

      const component = root.getComponent(dataKey);

      if (get(component, 'type') === 'button') {
        data[dataKey] = undefined;
      }
    });
  }

  bindEvents() {
    this.removeEventListener(this.buttonElement, 'click');

    this.addEventListener(this.buttonElement, 'click', event => {
      this.resetOtherOutcomeButtons();
      this.dataValue = true;

      if (this.component.action !== 'submit' && this.component.showValidations) {
        this.emit('checkValidity', this.data);
      }

      if (this.options.builder) {
        // buttons should not work in builder
        return;
      }

      switch (this.component.action) {
        case 'saveState':
        case 'submit':
          event.preventDefault();
          event.stopPropagation();
          this.emit('submitButton', {
            state: this.component.state || 'submitted'
          });
          break;
        case 'event':
          this.emit(this.interpolate(this.component.event), this.data);
          this.events.emit(this.interpolate(this.component.event), this.data);
          this.emit('customEvent', {
            type: this.interpolate(this.component.event),
            component: this.component,
            data: this.data,
            event: event
          });
          break;
        case 'custom': {
          // Get the FormioForm at the root of this component's tree
          const form = this.getRoot();
          // Get the form's flattened schema components
          const flattened = flattenComponents(form.component.components, true);
          // Create object containing the corresponding HTML element components
          const components = {};

          each(flattened, (component, key) => {
            const element = form.getComponent(key);
            if (element) {
              components[key] = element;
            }
          });

          const result = this.evaluate(this.component.custom, {
            form,
            flattened,
            components
          });

          if (typeof get(result, 'then') === 'function') {
            this.root.loading = true;
            this.loading = true;
            this.forceDisabled = true;

            const cancelTimerId = window.setTimeout(() => {
              this.root.loading = false;
              this.loading = false;
              this.forceDisabled = false;
            }, MAX_WAITING_TIME);

            result.finally(() => {
              window.clearTimeout(cancelTimerId);
              this.root.loading = false;
              this.loading = false;
              this.forceDisabled = false;
            });
          }

          break;
        }
        case 'url':
          this.emit('requestButton');
          this.emit('requestUrl', {
            url: this.interpolate(this.component.url),
            headers: this.component.headers
          });
          break;
        case 'reset':
          this.emit('resetForm');
          break;
        case 'delete':
          this.emit('deleteSubmission');
          break;
        case 'oauth':
          if (this.root === this) {
            console.warn('You must add the OAuth button to a form for it to function properly');
            return;
          }

          // Display Alert if OAuth config is missing
          if (!this.component.oauth) {
            this.root.setAlert('danger', 'You must assign this button to an OAuth action before it will work.');
            break;
          }

          // Display Alert if oAuth has an error is missing
          if (this.component.oauth.error) {
            this.root.setAlert('danger', `The Following Error Has Occured${this.component.oauth.error}`);
            break;
          }

          this.openOauth(this.component.oauth);

          break;
        default:
          break;
      }
    });

    this.on(
      'change',
      value => {
        this.disabled = this.options.readOnly || (this.component.disableOnFormInvalid && !value.isValid);
      },
      true
    );

    this.on(
      'error',
      () => {
        if (this.component.state === 'draft') {
          this.disabled = false;
        }
      },
      true
    );
  }
}
