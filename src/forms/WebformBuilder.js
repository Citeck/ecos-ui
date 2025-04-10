import EventEmitter from 'formiojs/EventEmitter';
import Webform from 'formiojs/Webform';
import WebformBuilder from 'formiojs/WebformBuilder';
import Components from 'formiojs/components/Components';
import BuilderUtils from 'formiojs/utils/builder';
import { getComponent } from 'formiojs/utils/formUtils';
import _ from 'lodash';

import { t } from '../helpers/export/util';
import { getMLValue } from '../helpers/util';

import { prepareComponentBuilderInfo } from './utils';

import dragula from '@/services/dragula';

const originAddBuilderComponentInfo = WebformBuilder.prototype.addBuilderComponentInfo;
const originAddBuilderComponent = WebformBuilder.prototype.addBuilderComponent;

Object.defineProperty(WebformBuilder.prototype, 'defaultComponents', {
  get: function () {
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

WebformBuilder.prototype.deleteComponent = function (component) {
  if (!component.parent) {
    return;
  }

  var remove = true;

  if (typeof component.getComponents === 'function' && component.getComponents().length > 0) {
    var message = 'Removing this component will also remove all of its children. Are you sure you want to do this?';
    remove = window.confirm(this.t(message));
  }

  if (remove) {
    component.parent.removeComponentById(component.id);
    if (!_.isEqual(this.form, this.schema)) {
      this.form = this.schema;
    }
    this.emit('deleteComponent', component);
  }

  return remove;
};

WebformBuilder.prototype.pasteComponent = function (component) {
  if (!window.sessionStorage) {
    return console.log('Session storage is not supported in this browser.');
  }

  this.removeClass(this.element, 'builder-paste-mode');
  var data = window.sessionStorage.getItem('formio.clipboard');

  if (data) {
    var schema = JSON.parse(data);
    window.sessionStorage.removeItem('formio.clipboard');

    BuilderUtils.uniquify(this.form, schema); // If this is an empty "nested" component, and it is empty, then paste the component inside this component.

    if (typeof component.addComponent === 'function' && !component.components.length) {
      component.addComponent(schema);
    } else {
      component.parent.addComponent(schema, false, false, component.element.nextSibling);
    }

    if (!_.isEqual(this.form, this.schema)) {
      this.form = this.schema;
    }
  }
};

WebformBuilder.prototype.onDrop = function (element, target, source, sibling) {
  if (!element || !element.id) {
    console.warn('No element.id defined for dropping');
    return;
  }

  var builderElement = source.querySelector('#'.concat(element.id));
  var newParent = this.getParentElement(element);

  if (!newParent || !newParent.component) {
    return console.warn('Could not find parent component.');
  } // Remove any instances of the placeholder.

  var placeholder = document.getElementById(''.concat(newParent.component.id, '-placeholder'));

  if (placeholder) {
    placeholder = placeholder.parentNode;
    placeholder.parentNode.removeChild(placeholder);
  } // If the sibling is the placeholder, then set it to null.

  if (sibling === placeholder) {
    sibling = null;
  } // Make this element go before the submit button if it is still on the builder.

  if (!sibling && this.submitButton && newParent.contains(this.submitButton.element)) {
    sibling = this.submitButton.element;
  } // If this is a new component, it will come from the builderElement

  if (builderElement && builderElement.builderInfo && builderElement.builderInfo.schema) {
    var componentSchema = _.clone(builderElement.builderInfo.schema);

    if (target.dragEvents && target.dragEvents.onDrop) {
      target.dragEvents.onDrop(element, target, source, sibling, componentSchema);
    } // Add the new component.

    var component = this.addComponentTo(componentSchema, newParent.component, newParent, sibling, function (comp) {
      // Set that this is a new component.
      comp.isNew = true; // Pass along the save event.

      if (target.dragEvents) {
        comp.dragEvents = target.dragEvents;
      }
    }); // Edit the component.

    this.editComponent(component); // Remove the element.

    target.removeChild(element);
  } // Check to see if this is a moved component.
  else if (element.component) {
    var _componentSchema = element.component.schema;

    if (target.dragEvents && target.dragEvents.onDrop) {
      target.dragEvents.onDrop(element, target, source, sibling, _componentSchema);
    } // Remove the component from its parent.

    if (element.component.parent) {
      this.emit('deleteComponent', element.component);
      element.component.parent.removeComponent(element.component);
    } // Add the new component.

    var _component = this.addComponentTo(_componentSchema, newParent.component, newParent, sibling);

    if (target.dragEvents && target.dragEvents.onSave) {
      target.dragEvents.onSave(_component);
    } // Refresh the form.

    if (!_.isEqual(this.form, this.schema)) {
      this.form = this.schema;
    }
  }
};

WebformBuilder.prototype.updateComponent = function (component) {
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
        }),
        ..._.pick(_.get(this, 'options', {}), ['typeRef', 'recordRef'])
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
      component.component.key =
        component.component.defaultKey ||
        _.camelCase(getMLValue(component.component.label || component.component.placeholder || component.component.type));
    }

    // Set a unique key for this component.
    BuilderUtils.uniquify(this.form, component.component);
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

  const componentInForm = this.getAllComponents().find(c => c.id === component.id);
  if (componentInForm) {
    componentInForm.dataValue = component.defaultValue;
  }

  // Called when we update a component.
  this.emit('updateComponent', component);
};

WebformBuilder.prototype.editComponent = function (component, isJsonEdit) {
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
              [removeButton, cancelButton, saveButton]
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
  let editFormOptions = _.get(this, 'options.editForm', {});

  if (_.isEmpty(editFormOptions)) {
    editFormOptions = _.pick(_.get(this, 'options', {}), ['typeRef', 'recordRef']);
  }

  this.editForm = new Webform(formioForm, {
    language: this.options.language,
    ...editFormOptions,
    parentId: this.id,
    editInFormBuilder: true
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
    const popup = this.element.closest('.modal-dialog');
    let top = 0;
    if (popup) {
      top = Math.round(popup.getBoundingClientRect().top) * -1;
    }

    this.form = this.schema;
    this.emit('saveComponent', component, originalComponent);
    this.dialog.close();

    const container = this.element.closest('.modal');

    if (!container) {
      return;
    }

    const target = document.querySelector('.formarea');
    const observer = new MutationObserver(function () {
      container.scrollTo(0, top);
      setTimeout(() => {
        observer.disconnect();
      }, 100);
    });

    const config = {
      childList: true,
      attributes: true,
      characterData: true
    };

    observer.observe(target, config);
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

WebformBuilder.prototype.addBuilderComponentInfo = function (builderInfo) {
  return originAddBuilderComponentInfo.call(this, prepareComponentBuilderInfo(builderInfo));
};

WebformBuilder.prototype.addBuilderComponent = function (...props) {
  const component = originAddBuilderComponent.call(this, ...props);
  if (component.element && component.documentation) {
    const helper = this.ce('i', {
      class: 'fa fa-question-circle-o formcomponent__doc',
      style: 'right: 5px; position: absolute;font-size: 13px;cursor: pointer;',
      title: t('form-editor.open-comp-doc', { name: component.title || component.key })
    });

    this.addEventListener(helper, 'click', () => window.open(component.documentation, '_blank'), true);

    component.element.appendChild(helper);
  }
  return component;
};

WebformBuilder.prototype.refreshDraggable = function () {
  if (this.dragula) {
    this.dragula.destroy();
  }

  this.dragula = dragula(this.sidebarContainers.concat(this.dragContainers), {
    moves(el) {
      return !el.classList.contains('no-drag');
    },
    copy(el) {
      return el.classList.contains('drag-copy');
    },
    accepts(el, target) {
      return !el.contains(target) && !target.classList.contains('no-drop');
    }
  }).on('drop', (element, target, source, sibling) => {
    return this.onDrop(element, target, source, sibling);
  });

  // If there are no components, then we need to add a default submit button.
  this.addSubmitButton();
  this.builderReadyResolve();
};

export default WebformBuilder;
