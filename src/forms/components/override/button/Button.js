import each from 'lodash/each';
import get from 'lodash/get';
import FormIOButtonComponent from 'formiojs/components/button/Button';
import { flattenComponents } from 'formiojs/utils/formUtils';

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

  _loading = false;

  get defaultSchema() {
    return ButtonComponent.schema();
  }

  get shouldDisable() {
    return super.shouldDisable || (this.component.disableOnFormInvalid && !this.root.isValid(this.data, true));
  }

  set disabled(disabled) {
    if (disabled && (this.component.disableOnInvalid && !this.shouldDisable)) {
      disabled = false;
    }

    super.disabled = disabled;
  }

  get disabled() {
    return this._disabled;
  }

  set loading(loading) {
    this._loading = loading;

    if ((loading && !this.disabled) || (!loading && !this.disabled)) {
      this.setDisabled(this.buttonElement, loading);
    }

    super.loading = loading;
  }

  get loading() {
    return this._loading;
  }

  build() {
    super.build();

    this.bindEvents();

    if (this.component.removeIndents && this.parent) {
      const parentEl = this.parent.element;

      if (!parentEl.classList.contains('col-12-manual')) {
        this.element.classList.remove('form-group');
        this.buttonElement.classList.add('btn_without-indents');
      }
    }

    const options = this.options;

    if (options.useNarrowButtons) {
      this.buttonElement.classList.add('btn_narrow');
    }
  }

  bindEvents() {
    this.removeEventListener(this.buttonElement, 'click');

    this.addEventListener(this.buttonElement, 'click', event => {
      this.triggerReCaptcha();
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

            const cancelTimerId = window.setTimeout(() => {
              this.root.loading = false;
              this.loading = false;
            }, MAX_WAITING_TIME);

            result.finally(() => {
              window.clearTimeout(cancelTimerId);
              this.root.loading = false;
              this.loading = false;
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
  }
}
