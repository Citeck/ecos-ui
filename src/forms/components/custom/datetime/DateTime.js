import React from 'react';
import ReactDom from 'react-dom';
// import Input from '../../../../components/common/form/Input';
// import Select from '../../../../components/common/form/Select';
import DatePicker from '../../../../components/common/form/DatePicker';

import BaseComponent from 'formiojs/components/base/Base';

// import lodashGet from 'lodash/get';
// import lodashParseInt from 'lodash/parseInt';
// import lodashMap from 'lodash/map';
// import lodashFind from 'lodash/find';
//
// const _ = {
//   get: lodashGet,
//   parseInt: lodashParseInt,
//   map: lodashMap,
//   find: lodashFind
// };

export default class DateTimeComponent extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        label: 'React DateTime',
        key: 'reactDatetime',
        type: 'reactDatetime',
        mask: false,
        inputType: 'text',
        inputMask: '',
        widget: {
          format: 'yyyy-MM-dd hh:mm a',
          dateFormat: 'yyyy-MM-dd hh:mm a',
          saveAs: 'text'
        },
        validate: {
          minLength: '',
          maxLength: '',
          minWords: '',
          maxWords: '',
          pattern: ''
        }
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'React DateTime',
      icon: 'fa fa-terminal',
      group: 'basic',
      documentation: 'http://help.form.io/userguide/#textfield',
      weight: 0,
      schema: DateTimeComponent.schema()
    };
  }

  get defaultSchema() {
    return DateTimeComponent.schema();
  }

  build() {
    // Restore the value.
    // this.restoreValue();

    this.createElement();

    const labelAtTheBottom = this.component.labelPosition === 'bottom';
    if (!labelAtTheBottom) {
      this.createLabel(this.element);
    }

    this.reactContainer = this.ce('div');
    this.element.appendChild(this.reactContainer);

    // const renderComponent = (
    //   <Input
    //     onChange={(e) => {
    //       console.log('onChange e.target.value', e.target.value);
    //     }}
    //   />
    // );

    // const renderComponent = <Select />;
    const renderComponent = (
      <DatePicker
        showIcon
        selected={new Date()}
        onChange={value => {
          console.log('DatePicker onChange value', value);
        }}
      />
    );

    ReactDom.render(renderComponent, this.reactContainer);

    // this.inputsContainer = this.ce('div');
    // this.errorContainer = this.inputsContainer;
    // this.createErrorElement();
    // this.listContainer = this.buildFileList();
    // this.inputsContainer.appendChild(this.listContainer);
    // this.uploadContainer = this.buildUpload();
    // this.hiddenFileInputElement = this.buildHiddenFileInput();
    // this.hook('input', this.hiddenFileInputElement, this.inputsContainer);
    // this.inputsContainer.appendChild(this.hiddenFileInputElement);
    // this.inputsContainer.appendChild(this.uploadContainer);
    // this.addWarnings(this.inputsContainer);
    // this.buildUploadStatusList(this.inputsContainer);
    // this.setInputStyles(this.inputsContainer);
    // this.element.appendChild(this.inputsContainer);
    // if (labelAtTheBottom) {
    //   this.createLabel(this.element);
    // }
    // this.createDescription(this.element);
    // this.autofocus();
    //
    // // Disable if needed.
    // if (this.shouldDisable) {
    //   this.disabled = true;
    // }
    // this.attachLogic();
  }
  //
  // elementInfo() {
  //   const info = super.elementInfo();
  //   info.type = 'input';
  //
  //   if (this.component.hasOwnProperty('spellcheck')) {
  //     info.attr.spellcheck = this.component.spellcheck;
  //   }
  //
  //   if (this.component.mask) {
  //     info.attr.type = 'password';
  //   } else {
  //     info.attr.type = 'text';
  //   }
  //   info.changeEvent = 'input';
  //   return info;
  // }
  //
  // get emptyValue() {
  //   return '';
  // }
  //
  // createInput(container) {
  //   if (!this.isMultipleMasksField) {
  //     const inputGroup = super.createInput(container);
  //     this.addCounter(container);
  //     return inputGroup;
  //   }
  //   //if component should have multiple masks
  //   const id = `${this.key}`;
  //   const attr = this.info.attr;
  //   attr.class += ' formio-multiple-mask-input';
  //   attr.id = id;
  //   const textInput = this.ce('input', attr);
  //
  //   const inputGroup = this.ce('div', {
  //     class: 'input-group formio-multiple-mask-container'
  //   });
  //   this.addPrefix(textInput, inputGroup);
  //   const maskInput = this.createMaskInput(textInput);
  //   this.addTextInputs(textInput, maskInput, inputGroup);
  //   this.addSuffix(textInput, inputGroup);
  //
  //   this.errorContainer = container;
  //   this.setInputStyles(inputGroup);
  //   this.addCounter(inputGroup);
  //   container.appendChild(inputGroup);
  //   return inputGroup;
  // }
  //
  // addCounter(container) {
  //   if (_.get(this.component, 'showWordCount', false)) {
  //     this.maxWordCount = _.parseInt(_.get(this.component, 'validate.maxWords', 0), 10);
  //     this.wordCount = this.ce('span', {
  //       class: 'text-muted pull-right',
  //       style: 'margin-left: 4px'
  //     });
  //     container.appendChild(this.wordCount);
  //   }
  //   if (_.get(this.component, 'showCharCount', false)) {
  //     this.maxCharCount = _.parseInt(_.get(this.component, 'validate.maxLength', 0), 10);
  //     this.charCount = this.ce('span', {
  //       class: 'text-muted pull-right'
  //     });
  //     container.appendChild(this.charCount);
  //   }
  //   return container;
  // }
  //
  // setCounter(type, element, count, max) {
  //   if (max) {
  //     const remaining = max - count;
  //     if (remaining > 0) {
  //       this.removeClass(element, 'text-danger');
  //     } else {
  //       this.addClass(element, 'text-danger');
  //     }
  //     element.innerHTML = this.t(`{{ remaining }} ${type} remaining.`, {
  //       remaining: remaining
  //     });
  //   } else {
  //     element.innerHTML = this.t(`{{ count }} ${type}`, {
  //       count: count
  //     });
  //   }
  // }
  //
  // onChange(flags, fromRoot) {
  //   super.onChange(flags, fromRoot);
  //   if (this.wordCount) {
  //     this.setCounter('words', this.wordCount, this.dataValue.trim().split(/\s+/).length, this.maxWordCount);
  //   }
  //   if (this.charCount) {
  //     this.setCounter('characters', this.charCount, this.dataValue.length, this.maxCharCount);
  //   }
  // }
  //
  // setValueAt(index, value, flags) {
  //   flags = flags || {};
  //   if (!this.isMultipleMasksField) {
  //     return super.setValueAt(index, value, flags);
  //   }
  //   const defaultValue = flags.noDefault ? this.emptyValue : this.defaultValue;
  //   if (!value) {
  //     if (defaultValue) {
  //       value = defaultValue;
  //     } else {
  //       value = {
  //         maskName: this.component.inputMasks[0].label
  //       };
  //     }
  //   }
  //   //if value is a string, treat it as text value itself and use default mask or first mask in the list
  //   const defaultMaskName = _.get(defaultValue, 'maskName', '');
  //   if (typeof value === 'string') {
  //     value = {
  //       value: value,
  //       maskName: defaultMaskName ? defaultMaskName : this.component.inputMasks[0].label
  //     };
  //   }
  //   const maskName = value.maskName || '';
  //   const textValue = value.value || '';
  //   const textInput = this.inputs[index] ? this.inputs[index].text : undefined;
  //   const maskInput = this.inputs[index] ? this.inputs[index].mask : undefined;
  //   if (textInput && maskInput) {
  //     maskInput.value = maskName;
  //     textInput.value = textValue;
  //     this.updateMask(textInput, maskName);
  //   }
  // }
  //
  // getValueAt(index) {
  //   if (!this.isMultipleMasksField) {
  //     return super.getValueAt(index);
  //   }
  //   const textField = this.inputs[index];
  //   return {
  //     value: textField && textField.text ? textField.text.value : undefined,
  //     maskName: textField && textField.mask ? textField.mask.value : undefined
  //   };
  // }
  //
  // performInputMapping(input) {
  //   if (!this.isMultipleMasksField) {
  //     return super.performInputMapping(input);
  //   }
  //   return input && input.text ? input.text : input;
  // }
  //
  // buildInput(container, value, index) {
  //   if (!this.isMultipleMasksField) {
  //     return super.buildInput(container, value, index);
  //   }
  //   this.createInput(container);
  //   this.setValueAt(index, value);
  // }
  //
  // isEmpty(value) {
  //   if (!this.isMultipleMasksField) {
  //     return super.isEmpty(value);
  //   }
  //   return super.isEmpty(value) || (this.component.multiple ? value.length === 0 : !value.maskName || !value.value);
  // }
  //
  // createMaskInput(textInput) {
  //   const id = `${this.key}-mask`;
  //   const maskInput = this.ce('select', {
  //     class: 'form-control formio-multiple-mask-select',
  //     id
  //   });
  //   const self = this;
  //   const maskOptions = this.maskOptions;
  //   this.selectOptions(maskInput, 'maskOption', maskOptions);
  //   // Change the text field mask when another mask is selected.
  //   maskInput.onchange = function() {
  //     self.updateMask(textInput, this.value);
  //   };
  //   return maskInput;
  // }
  //
  // addTextInputs(textInput, maskInput, container) {
  //   if (textInput && maskInput && container) {
  //     const input = {
  //       mask: maskInput,
  //       text: textInput
  //     };
  //     this.inputs.push(input);
  //     container.appendChild(maskInput);
  //     container.appendChild(textInput);
  //   }
  //   this.hook('input', textInput, container);
  //   this.addFocusBlurEvents(textInput);
  //   this.addInputEventListener(textInput);
  //   this.addInputSubmitListener(textInput);
  // }
  //
  // updateMask(textInput, newMaskName) {
  //   const newMask = this.getMaskByName(newMaskName);
  //   //destroy previous mask
  //   if (textInput.mask) {
  //     textInput.mask.destroy();
  //   }
  //   //set new text field mask
  //   this.setInputMask(textInput, newMask);
  //   //update text field value after new mask is applied
  //   this.updateValue();
  // }
  //
  // get maskOptions() {
  //   return _.map(this.component.inputMasks, mask => {
  //     return {
  //       label: mask.label,
  //       value: mask.label
  //     };
  //   });
  // }
  //
  // get isMultipleMasksField() {
  //   return this.component.allowMultipleMasks && !!this.component.inputMasks && !!this.component.inputMasks.length;
  // }
  //
  // getMaskByName(maskName) {
  //   const inputMask = _.find(this.component.inputMasks, inputMask => {
  //     return inputMask.label === maskName;
  //   });
  //   return inputMask ? inputMask.mask : undefined;
  // }
}
