import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';
import queryString from 'query-string';
import FormIOFileComponent from 'formiojs/components/file/File';

import recordActions, { ActionTypes } from '../../../../components/Records/actions';

import Records from '../../../../components/Records';
import { createDocumentUrl, getDownloadContentUrl, isNewVersionPage } from '../../../../helpers/urls';
import { t } from '../../../../helpers/util';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../../constants/pageTabs';
import { FILE_CLICK_ACTION_DOWNLOAD, FILE_CLICK_ACTION_NOOP, FILE_CLICK_ACTION_OPEN_DASHBOARD } from './editForm/File.edit.file';

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

  get defaultSchema() {
    return FileComponent.schema();
  }

  static extractFileRecordRef(file) {
    let recordRef = null;
    if (file.data && file.data.recordRef) {
      recordRef = file.data.recordRef;
    } else if (file.data && file.data.nodeRef) {
      recordRef = file.data.nodeRef;
    } else {
      const documentUrl = file.url;
      const documentUrlParts = documentUrl.split('?');
      if (documentUrlParts.length !== 2) {
        throw new Error("Cant't extract recordRef");
      }

      const queryPart = documentUrlParts[1];
      const urlParams = queryString.parse(queryPart);
      if (!urlParams.recordRef && !urlParams.nodeRef) {
        throw new Error("Cant't extract recordRef");
      }

      recordRef = urlParams.recordRef || urlParams.nodeRef;
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

  checkConditions(data) {
    let result = super.checkConditions(data);

    if (!this.component.displayElementsJS) {
      return result;
    }

    let displayElements = this.evaluate(this.component.displayElementsJS, {}, 'value', true);
    if (!isEqual(displayElements, this.displayElementsValue)) {
      this.displayElementsValue = displayElements;
      this.refreshDOM();
    }

    return result;
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
                  if (fileInfo && this.component.storage === 'url') {
                    fileService.makeRequest('', fileInfo.url, 'delete');
                  }
                  event.preventDefault();
                  this.splice(index);
                  this.refreshDOM();
                }
              })
            : null
        ),
        this.ce('div', { class: `col-md-${this.hasTypes ? '7' : '9'}` }, this.createFileLink(fileInfo)),
        this.ce('div', { class: 'col-md-2' }, this.fileSize(fileInfo.size)),
        this.hasTypes ? this.ce('div', { class: 'col-md-2' }, this.createTypeSelect(index, fileInfo)) : null
      ])
    );
  }

  createTypeSelect(index, fileInfo) {
    return this.ce(
      'select',
      {
        class: 'file-type',
        onChange: event => {
          this.replaceValueItemByIndex(index, {
            ...fileInfo,
            fileType: event.target.value
          });
        }
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

    let documentUrl = file.url;
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
      linkAttributes.href = getDownloadContentUrl(recordRef);
      linkAttributes.download = true;
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
      return this.viewOnlyBuild();
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
}
