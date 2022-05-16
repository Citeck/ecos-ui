import _ from 'lodash';
import Webform from 'formiojs/Webform';
import WebformBuilder from 'formiojs/WebformBuilder';
import Components from 'formiojs/components/Components';
import EventEmitter from 'formiojs/EventEmitter';
import BuilderUtils from 'formiojs/utils/builder';
import Tooltip from 'tooltip.js';
import { getComponent } from 'formiojs/utils/formUtils';

import { t } from '../helpers/export/util';
import { prepareComponentBuilderInfo } from './utils';

Object.defineProperty(WebformBuilder.prototype, 'defaultComponents', {
  get: function() {
    return {
      basic: {
        title: t('form-constructor.builder.basic'),
        weight: 0,
        default: true
      },
      advanced: {
        title: t('form-constructor.builder.advanced'),
        weight: 10
      },
      layout: {
        title: t('form-constructor.builder.layout'),
        weight: 20
      },
      data: {
        title: t('form-constructor.builder.data'),
        weight: 30
      }
    };
  }
});

// Object.defineProperty(WebformBuilder.prototype, 'options.hoocks.addComponent')

console.log('WEB FORM BUILDER', WebformBuilder);

Object.defineProperty(WebformBuilder.prototype, 'options.hooks.addComponent', {
  set: function(container, comp, parent) {
    if (!comp || !comp.component) {
      return container;
    }

    if (!comp.noEdit && !comp.component.internal) {
      // Make sure the component position is relative so the buttons align properly.
      comp.getElement().style.position = 'relative';

      const removeButton = this.ce(
        'div',
        {
          class: 'btn btn-xxs btn-danger component-settings-button component-settings-button-remove'
        },
        this.getIcon('remove')
      );
      this.addEventListener(removeButton, 'click', () => this.deleteComponent(comp));
      new Tooltip(removeButton, {
        trigger: 'hover',
        placement: 'top',
        title: this.t('Remove')
      });

      const editButton = this.ce(
        'div',
        {
          class: 'btn btn-xxs btn-default component-settings-button component-settings-button-edit'
        },
        this.getIcon('cog')
      );
      this.addEventListener(editButton, 'click', () => this.editComponent(comp));
      new Tooltip(editButton, {
        trigger: 'hover',
        placement: 'top',
        title: this.t('Редактировать')
      });

      const copyButton = this.ce(
        'div',
        {
          class: 'btn btn-xxs btn-default component-settings-button component-settings-button-copy'
        },
        this.getIcon('copy')
      );
      this.addEventListener(copyButton, 'click', () => this.copyComponent(comp));
      new Tooltip(copyButton, {
        trigger: 'hover',
        placement: 'top',
        title: this.t('Copy')
      });

      const pasteButton = this.ce(
        'div',
        {
          class: 'btn btn-xxs btn-default component-settings-button component-settings-button-paste'
        },
        this.getIcon('save')
      );
      const pasteTooltip = new Tooltip(pasteButton, {
        trigger: 'hover',
        placement: 'top',
        title: this.t('Paste below')
      });
      this.addEventListener(pasteButton, 'click', () => {
        pasteTooltip.hide();
        this.pasteComponent(comp);
      });

      const editJsonButton = this.ce(
        'div',
        {
          class: 'btn btn-xxs btn-default component-settings-button component-settings-button-edit-json'
        },
        this.getIcon('wrench')
      );
      this.addEventListener(editJsonButton, 'click', () => this.editComponent(comp, true));
      new Tooltip(editJsonButton, {
        trigger: 'hover',
        placement: 'top',
        title: this.t('Edit JSON')
      });

      // Set in paste mode if we have an item in our clipboard.
      if (window.sessionStorage) {
        const data = window.sessionStorage.getItem('formio.clipboard');
        if (data) {
          this.addClass(this.element, 'builder-paste-mode');
        }
      }

      // Add the edit buttons to the component.
      comp.prepend(
        this.ce(
          'div',
          {
            class: 'component-btn-group'
          },
          [
            this.options.enableButtons.remove ? removeButton : null,
            this.options.enableButtons.copy ? copyButton : null,
            this.options.enableButtons.paste ? pasteButton : null,
            this.options.enableButtons.editJson ? editJsonButton : null,
            this.options.enableButtons.edit ? editButton : null
          ]
        )
      );
    }

    if (!container.noDrop) {
      this.addDragContainer(container, parent);
    }

    return container;
  }
});

WebformBuilder.prototype.updateComponent = function(component) {
  // Update the preview.
  if (this.componentPreview) {
    if (this.preview) {
      this.preview.destroy();
    }
    this.preview = Components.create(
      component.component,
      {
        preview: true,
        events: new EventEmitter({
          wildcard: false,
          maxListeners: 0
        })
      },
      {},
      true
    );
    this.preview.on('componentEdit', comp => {
      _.merge(component.component, comp.component);
      this.editForm.redraw();
    });
    this.preview.build();
    this.preview.isBuilt = true;
    this.componentPreview.innerHTML = '';
    this.componentPreview.appendChild(this.preview.getElement());
  }

  // Ensure this component has a key.
  if (component.isNew) {
    if (!component.keyModified) {
      component.component.key = _.camelCase(component.component.label || component.component.placeholder || component.component.type);
    }

    // Set a unique key for this component.
    BuilderUtils.uniquify(this._form, component.component);
  }

  // Change the "default value" field to be reflective of this component.
  if (this.defaultValueComponent) {
    _.assign(
      this.defaultValueComponent,
      _.omit(component.component, [
        // Cause: https://citeck.atlassian.net/browse/ECOSUI-31
        'calculateValue',
        'logic',
        // default
        'key',
        'label',
        'placeholder',
        'tooltip',
        'validate',
        'disabled',
        'fields.day.required',
        'fields.month.required',
        'fields.year.required'
      ]),
      {
        customClass: `webform-builder-dv-${component.type}`
      }
    );
  }

  // Called when we update a component.
  this.emit('updateComponent', component);
};

WebformBuilder.prototype.editComponent = function(component, isJsonEdit) {
  const componentCopy = _.cloneDeep(component);
  let componentClass = Components.components[componentCopy.component.type];
  const isCustom = componentClass === undefined;
  //custom component should be edited as JSON
  isJsonEdit = isJsonEdit || isCustom;
  componentClass = isCustom ? Components.components.unknown : componentClass;
  // Make sure we only have one dialog open at a time.
  if (this.dialog) {
    this.dialog.close();
  }
  this.dialog = this.createModal(componentCopy.name);
  const formioForm = this.ce('div');
  this.componentPreview = this.ce('div', {
    class: 'component-preview'
  });
  const componentInfo = componentClass ? componentClass.builderInfo : {};

  const saveButton = this.ce(
    'button',
    {
      class: 'btn btn-success',
      style: 'margin-right: 10px;'
    },
    t('form-editor.save-button')
  );

  const cancelButton = this.ce(
    'button',
    {
      class: 'btn btn-default',
      style: 'margin-right: 10px;'
    },
    t('form-editor.cancel-button')
  );

  const removeButton = this.ce(
    'button',
    {
      class: 'btn btn-danger'
    },
    t('form-editor.remove-button')
  );

  const componentEdit = this.ce('div', {}, [
    this.ce(
      'div',
      {
        class: 'row'
      },
      [
        this.ce(
          'div',
          {
            class: 'col col-sm-6'
          },
          this.ce(
            'p',
            {
              class: 'lead'
            },
            `${this.t(componentInfo.title)} ${this.t('Component')}`
          )
        ),
        this.ce(
          'div',
          {
            class: 'col col-sm-6'
          },
          [
            this.ce(
              'div',
              {
                class: 'pull-right',
                style: 'margin-right: 20px; margin-top: 10px'
              },
              this.ce(
                'a',
                {
                  href: componentInfo.documentation || '#',
                  target: '_blank'
                },
                this.ce(
                  'i',
                  {
                    class: this.iconClass('new-window')
                  },
                  t('form-editor.help')
                )
              )
            )
          ]
        )
      ]
    ),
    this.ce(
      'div',
      {
        class: 'row'
      },
      [
        this.ce(
          'div',
          {
            class: 'col col-sm-6'
          },
          formioForm
        ),
        this.ce(
          'div',
          {
            class: 'col col-sm-6'
          },
          [
            this.ce(
              'div',
              {
                class: 'card panel panel-default preview-panel'
              },
              [
                this.ce(
                  'div',
                  {
                    class: 'card-header panel-heading'
                  },
                  this.ce(
                    'h4',
                    {
                      class: 'card-title panel-title mb-0'
                    },
                    t('form-editor.preview-button')
                  )
                ),
                this.ce(
                  'div',
                  {
                    class: 'card-body panel-body'
                  },
                  this.componentPreview
                )
              ]
            ),
            this.ce(
              'div',
              {
                style: 'margin-top: 10px;'
              },
              [saveButton, cancelButton, removeButton]
            )
          ]
        )
      ]
    )
  ]);

  // Append the settings page to the dialog body.
  this.dialog.body.appendChild(componentEdit);

  // Allow editForm overrides per component.
  const overrides = _.get(this.options, `editForm.${componentCopy.component.type}`, {});

  // Get the editform for this component.
  let editForm;
  //custom component has its own Edit Form defined
  if (isJsonEdit && !isCustom) {
    editForm = {
      components: [
        {
          type: 'textarea',
          as: 'json',
          editor: 'ace',
          weight: 10,
          input: true,
          key: 'componentJson',
          label: 'Component JSON',
          tooltip: 'Edit the JSON for this component.'
        }
      ]
    };
  } else {
    editForm = componentClass.editForm(_.cloneDeep(overrides));
  }

  // Change the defaultValue component to be reflective.
  this.defaultValueComponent = getComponent(editForm.components, 'defaultValue');
  _.assign(
    this.defaultValueComponent,
    _.omit(componentCopy.component, [
      // Cause: https://citeck.atlassian.net/browse/ECOSUI-31
      'calculateValue',
      'logic',
      // default
      'key',
      'label',
      'placeholder',
      'tooltip',
      'validate',
      'disabled',
      'fields.day.required',
      'fields.month.required',
      'fields.year.required'
    ])
  );

  // Create the form instance.
  const editFormOptions = _.get(this, 'options.editForm', {});

  this.editForm = new Webform(formioForm, {
    language: this.options.language,
    ...editFormOptions
  });

  // Set the form to the edit form.
  this.editForm.form = editForm;

  // Pass along the form being edited.
  this.editForm.editForm = this._form;
  this.editForm.editComponent = component;

  // Update the preview with this component.
  this.updateComponent(componentCopy);

  // Register for when the edit form changes.
  this.editForm.on('change', event => {
    if (event.changed) {
      // See if this is a manually modified key. Treat JSON edited component keys as manually modified
      if ((event.changed.component && event.changed.component.key === 'key') || isJsonEdit) {
        componentCopy.keyModified = true;
      }

      // Set the component JSON to the new data.
      var editFormData = this.editForm.getValue().data;
      //for custom component use value in 'componentJson' field as JSON of component
      if ((editFormData.type === 'custom' || isJsonEdit) && editFormData.componentJson) {
        componentCopy.component = editFormData.componentJson;
      } else {
        componentCopy.component = editFormData;
      }

      // Update the component.
      this.updateComponent(componentCopy);
    }
  });

  // Modify the component information in the edit form.
  this.editForm.formReady.then(() => {
    //for custom component populate component setting with component JSON
    if (isJsonEdit) {
      this.editForm.setValue({
        data: {
          componentJson: _.cloneDeep(componentCopy.component)
        }
      });
    } else {
      this.editForm.setValue({ data: componentCopy.component });
    }
  });

  this.addEventListener(cancelButton, 'click', event => {
    event.preventDefault();
    this.emit('cancelComponent', component);
    this.dialog.close();
  });

  this.addEventListener(removeButton, 'click', event => {
    event.preventDefault();
    this.deleteComponent(component);
    this.dialog.close();
  });

  this.addEventListener(saveButton, 'click', event => {
    event.preventDefault();
    const originalComponent = component.schema;
    component.isNew = false;
    //for JSON Edit use value in 'componentJson' field as JSON of component
    if (isJsonEdit) {
      component.component = this.editForm.data.componentJson;
    } else {
      component.component = componentCopy.component;
    }
    if (component.dragEvents && component.dragEvents.onSave) {
      component.dragEvents.onSave(component);
    }
    this.form = this.schema;
    this.emit('saveComponent', component, originalComponent);
    this.dialog.close();
  });

  this.addEventListener(this.dialog, 'close', () => {
    this.editForm.destroy(true);
    this.preview.destroy(true);
    if (component.isNew) {
      this.deleteComponent(component);
    }
  });

  // Called when we edit a component.
  this.emit('editComponent', component);
};

const originAddBuilderComponentInfo = WebformBuilder.prototype.addBuilderComponentInfo;

WebformBuilder.prototype.addBuilderComponentInfo = function(builderInfo) {
  return originAddBuilderComponentInfo.call(this, prepareComponentBuilderInfo(builderInfo));
};

export default WebformBuilder;
