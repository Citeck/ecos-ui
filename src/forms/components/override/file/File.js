import FormIOFileComponent from 'formiojs/components/file/File';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import queryString from 'query-string';

import { FILE_CLICK_ACTION_DOWNLOAD, FILE_CLICK_ACTION_NOOP, FILE_CLICK_ACTION_OPEN_DASHBOARD } from './editForm/File.edit.file';

import Records from '@/components/Records';
import recordActions from '@/components/Records/actions';
import { ActionTypes } from '@/components/Records/actions/constants';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '@/constants/pageTabs';
import { createDocumentUrl, getDownloadContentUrl, isNewVersionPage } from '@/helpers/urls';
import { t } from '@/helpers/util';

export default class FileComponent extends FormIOFileComponent {
  static schema(...extend) {
    return FormIOFileComponent.schema(
      {
        onFileClick: FILE_CLICK_ACTION_OPEN_DASHBOARD,
        displayElementsJS: {},
        valueDisplayName: {},
        storage: '',
        dir: '',
        fileNameTemplate: '',
        webcam: false,
        defaultKey: '_content',
        fileTypes: [
          {
            label: '',
            value: ''
          }
        ]
      },
      ...extend
    );
  }

  constructor(...params) {
    super(...params);

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-1522
    this.on('change', this.validateOnChange);

    let lastChanged = null;
    const _triggerChange = debounce((...args) => {
      if (this.root) {
        this.root.changing = false;
      }

      if (!args[1] && lastChanged) {
        args[1] = lastChanged;
      }

      lastChanged = null;

      this.onChange(...args);
      this.checkValidation(null, true);
    }, 100);

    this.triggerChange = (...args) => {
      this.onChange({ changeByUser: true });

      if (args[1]) {
        lastChanged = args[1];
      }

      if (this.root) {
        this.root.changing = true;
      }

      return _triggerChange(...args);
    };
  }

  checkValidation = debounce((...args) => {
    this.checkValidity(...args);
  }, 100);

  get defaultSchema() {
    return FileComponent.schema();
  }

  static extractFileRecordRef(file) {
    let recordRef = null;

    if (file.data && file.data.entityRef) {
      recordRef = file.data.entityRef;
    } else if (file.data && file.data.recordRef) {
      recordRef = file.data.recordRef;
    } else if (file.data && file.data.nodeRef) {
      recordRef = file.data.nodeRef;
    } else {
      const documentUrl = file.url;
      const documentUrlParts = documentUrl.split('?');
      if (documentUrlParts.length !== 2) {
        throw new Error("Can't extract recordRef");
      }

      let urlParams = queryString.parse(documentUrlParts[1]);

      if (!urlParams.recordRef && !urlParams.nodeRef && !urlParams.ref) {
        throw new Error("Can't extract recordRef");
      }

      if (urlParams.ref) {
        urlParams.ref = `emodel/${urlParams.ref}`;
      }

      recordRef = urlParams.recordRef || urlParams.nodeRef || urlParams.ref;
    }

    return recordRef;
  }

  static downloadFile(recordRef, fileName) {
    return recordActions
      .execForRecord(recordRef, {
        type: ActionTypes.DOWNLOAD,
        config: {
          filename: fileName
        }
      })
      .catch(e => {
        console.error(`EcosForm File: Failure to download file. Cause: ${e.message}`);
      });
  }

  static buildDocumentUrl(recordRef) {
    return createDocumentUrl(recordRef);
  }

  updateValue(flags, value) {
    super.updateValue(flags, value);

    if (!this._initialized) {
      this._initialized = true;

      this._initialValue = Array.isArray(this.data[this.component.key]) && [...this.data[this.component.key]];
    }
  }

  upload(files) {
    if (!this.component.storage) {
      this.component.storage = 'url';
    }

    if (this.component.storage === 'url' && !this.component.url) {
      this.component.url = this.getFileUrl({});
    }

    super.upload(files);
  }

  getFileUrl(file) {
    const containerType = get(this.root, 'options.typeRef', '');
    // eslint-disable-next-line
    const [_, type] = containerType.split("@");
    return file.url || `/gateway/emodel/api/ecos/webapp/content?containerTypeId=${type}`;
  }

  buildFileProcessingLoader() {
    const isRootLoading = get(this, 'root.loader');
    if (isRootLoading) {
      super.buildFileProcessingLoader();
    }
  }

  checkConditions(data) {
    const result = super.checkConditions(data);

    if (!this.component.displayElementsJS) {
      return result;
    }

    const displayElements = this.evaluate(this.component.displayElementsJS, {}, 'value', true);

    if (!isEqual(displayElements, this.displayElementsValue)) {
      this.displayElementsValue = displayElements;
      this.refreshDOM();
    }

    return result;
  }

  buildFileList() {
    const value = this.dataValue;

    return this.ce(
      'ul',
      {
        class: 'list-group list-group-striped'
      },
      [
        this.ce(
          'li',
          {
            class: 'list-group-item list-group-header hidden-xs hidden-sm'
          },
          this.ce(
            'div',
            {
              class: 'row'
            },
            [
              this.ce('div', {
                class: 'col-md-1'
              }),
              this.ce(
                'div',
                {
                  class: 'col-md-'.concat(this.hasTypes ? '6' : '9')
                },
                this.ce('strong', {}, this.text('File Name'))
              ),
              this.ce(
                'div',
                {
                  class: 'col-md-2'
                },
                this.ce('strong', {}, this.text('Size'))
              ),
              this.hasTypes
                ? this.ce(
                    'div',
                    {
                      class: 'col-md-2'
                    },
                    this.ce('strong', {}, this.text('Type'))
                  )
                : null
            ]
          )
        ),
        Array.isArray(value)
          ? value.map((fileInfo, index) => {
              return this.createFileListItem(fileInfo, index);
            })
          : null
      ]
    );
  }

  createFileListItem(fileInfo, index) {
    const displayElements = this.displayElementsValue || {};
    const shouldShowDeleteIcon = isBoolean(get(displayElements, 'delete')) ? displayElements.delete : true;
    const fileService = this.fileService;

    return this.ce(
      'li',
      { class: 'list-group-item' },
      this.ce('div', { class: 'row' }, [
        this.ce(
          'div',
          { class: 'col-md-1' },
          shouldShowDeleteIcon && !this.disabled && !this.shouldDisable
            ? this.ce('i', {
                class: this.iconClass('remove'),
                onClick: event => {
                  if (fileInfo && (this.component.storage === 'url' || !this.component.storage)) {
                    const url = this.getFileUrl(fileInfo);
                    fileService.makeRequest('', url, 'delete');
                  }
                  event.preventDefault();
                  this.splice(index);
                  this.refreshDOM();
                }
              })
            : null
        ),
        this.ce('div', { class: `col-md-${this.hasTypes ? '6' : '9'}` }, this.createFileLink(fileInfo)),
        this.ce('div', { class: 'col-md-2' }, this.fileSize(fileInfo.size)),
        this.hasTypes ? this.ce('div', { class: 'col-md-3' }, this.createTypeSelect(index, fileInfo)) : null
      ])
    );
  }

  splice(index) {
    const dataValue = this.dataValue || [];

    if (Array.isArray(dataValue) && index === 0 && dataValue.length === 1) {
      this.dataValue = [];
      this.triggerChange();

      return;
    }

    return super.splice(index);
  }

  isValid(data, dirty) {
    let result = super.isValid(data, dirty);

    if (result && this.component.validate.required) {
      result = Boolean((this.dataValue || []).length);
    }

    return result;
  }

  createTypeSelect(index, fileInfo) {
    const disabled = this._initialValue && Array.isArray(this._initialValue) && this._initialValue.includes(fileInfo);

    return this.ce(
      'select',
      {
        class: 'file-type form-control',
        onChange: event => {
          this.replaceValueItemByIndex(index, {
            ...fileInfo,
            fileType: event.target.value
          });
        },
        disabled: disabled || undefined
      },
      this.component.fileTypes.map(type =>
        this.ce(
          'option',
          {
            value: type.value,
            selected: type.value === fileInfo.fileType ? 'selected' : undefined
          },
          type.label
        )
      )
    );
  }

  replaceValueItemByIndex(index, newItem) {
    if (this.hasValue()) {
      if (Array.isArray(this.dataValue) && this.dataValue.hasOwnProperty(index)) {
        this.dataValue = [...this.dataValue.slice(0, index), newItem, ...this.dataValue.slice(index + 1)];
        this.triggerChange();
      }
    }
  }

  calculateFileLinkText({ fileItemElement, originalFileName, recordRef, file }) {
    const component = this.component;
    const valueDisplayName = component.valueDisplayName;

    if (!valueDisplayName) {
      fileItemElement.innerText = originalFileName;
    }

    const calculatedFileName = this.evaluate(
      valueDisplayName,
      {
        record: recordRef ? Records.get(recordRef) : null,
        originalFileName,
        file
      },
      'disp',
      true
    );

    if (calculatedFileName instanceof Promise) {
      calculatedFileName.then(name => {
        fileItemElement.innerText = name;
      });
    } else if (typeof calculatedFileName === 'string') {
      fileItemElement.innerText = calculatedFileName;
    } else {
      fileItemElement.innerText = originalFileName;
    }
  }

  createFileLink(f) {
    const file = cloneDeep(f);
    const originalFileName = file.originalName || file.name;
    let onFileClickAction = this.component.onFileClick;
    let fileItemElement = this.ce('span', {});

    if (!onFileClickAction && this.viewOnly) {
      onFileClickAction = FILE_CLICK_ACTION_OPEN_DASHBOARD;
    }

    if (!onFileClickAction || onFileClickAction === FILE_CLICK_ACTION_NOOP) {
      this.calculateFileLinkText({ fileItemElement, originalFileName, file });
      return fileItemElement;
    }

    let documentUrl = this.getFileUrl(file);
    let recordRef;

    try {
      recordRef = FileComponent.extractFileRecordRef(file);
      documentUrl = FileComponent.buildDocumentUrl(recordRef);
    } catch (e) {
      this.calculateFileLinkText({ fileItemElement, originalFileName, file });
      return fileItemElement;
    }

    const linkAttributes = {
      href: documentUrl,
      target: '_blank'
    };

    if (!isNewVersionPage(documentUrl)) {
      linkAttributes[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
    }

    if (onFileClickAction === FILE_CLICK_ACTION_DOWNLOAD) {
      if (file.url && file.url.indexOf('/share/page/card-details') !== -1) {
        linkAttributes.href = getDownloadContentUrl(recordRef);
      } else {
        linkAttributes.href = file.url || getDownloadContentUrl(recordRef);
        linkAttributes.download = true;
      }
    } else if (onFileClickAction === FILE_CLICK_ACTION_OPEN_DASHBOARD && !this.viewOnly) {
      linkAttributes.onClick = e => {
        const confirmation = window.confirm(t('eform.file.on-click-confirmation'));

        if (!confirmation) {
          e.stopPropagation();
          e.preventDefault();
        }
      };
    }

    fileItemElement = this.ce('a', linkAttributes);
    this.calculateFileLinkText({ fileItemElement, originalFileName, recordRef, file });

    return fileItemElement;
  }

  focus() {
    if (!this.browseLink) {
      return;
    }

    this.browseLink.focus();
  }

  buildUpload() {
    const displayElements = this.displayElementsValue || {};
    const shouldShowUpload = isBoolean(get(displayElements, 'upload')) ? displayElements.upload : true;

    if (!shouldShowUpload) {
      return this.ce('div', {});
    }

    const render = super.buildUpload();
    const allLinks = render.querySelectorAll('a');

    for (let i = 0; i < allLinks.length; i++) {
      allLinks[i].setAttribute(IGNORE_TABS_HANDLER_ATTR_NAME, true);
    }

    return render;
  }

  build() {
    if (this.viewOnly) {
      this.viewOnlyBuild();
      this.attachLogic();
      return;
    }

    this.disabled = this.shouldDisable;

    super.build();

    this.createInlineEditSaveAndCancelButtons();
  }

  createUploadStatus(fileUpload) {
    this.toggleDisableSaveButton(true);

    return super.createUploadStatus(fileUpload);
  }

  setupValueElement(element) {
    if (this.component.unreadable) {
      this.setUnreadableLabel(element);
      return;
    }

    const value = this.getValue();
    const valueView = this.getView(value);

    if (valueView instanceof Element) {
      element.innerHTML = '';
      element.appendChild(valueView);
    } else {
      element.innerHTML = valueView;
    }
  }

  getView(value) {
    if (this.isEmpty(value)) {
      return this.defaultViewOnlyValue;
    }

    const classList = ['file-list-view-mode'];

    if (this.component && this.component.hideLabel) {
      classList.push('file-list-view-mode_hide-label');
    }

    return this.ce(
      'ul',
      { class: classList.join(' ') },
      Array.isArray(value) ? value.map(fileInfo => this.createFileListItemViewMode(fileInfo)) : this.createFileListItemViewMode(value)
    );
  }

  createFileListItemViewMode(fileInfo) {
    return this.ce(
      'li',
      {
        class: 'file-item_view-mode',
        title: fileInfo.originalName || fileInfo.name
      },
      this.createFileLink(fileInfo)
    );
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2667
  setValue(value) {
    if (!isEmpty(value) && !Array.isArray(value)) {
      value = [value];
    }

    super.setValue(value);

    if (!isEmpty(value) && this.isDisabledSaveButton) {
      this.toggleDisableSaveButton(false);
    }
  }

  validateOnChange = () => {
    if (get(this.component, 'validateOn') !== 'change') {
      return;
    }

    if (
      !isEqual(this.dataValue, this.defaultValue) ||
      (this.valueChangedByUser && this.component.validate.required && isEmpty(this.dataValue))
    ) {
      this.checkValidity(null, true);
    }

    if (this.viewOnly) {
      this.setupValueElement(this.valueElement);
    }
  };

  checkValidity(data, dirty, rowData) {
    if (get(this, 'root.options.saveDraft')) {
      return true;
    }

    if (this.valueChangedByUser && dirty === undefined) {
      dirty = true;
    }

    return super.checkValidity(data, dirty, rowData);
  }
}
