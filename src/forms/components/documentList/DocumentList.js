import _ from 'lodash';
import BaseComponent from 'formiojs/components/base/Base';
import { boolValue } from 'formiojs/utils/utils';

export default class DocumentList extends BaseComponent {
  static schema(...extend) {
    return BaseComponent.schema(
      {
        type: 'documentList',
        label: 'Document list',
        key: 'documentList',
        documents: []
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Document list',
      group: 'advanced',
      icon: 'fa fa-list',
      weight: 170,
      // documentation: 'http://help.form.io/userguide/#survey', // TODO
      schema: DocumentList.schema()
    };
  }

  get defaultSchema() {
    return DocumentList.schema();
  }

  refreshDOM() {
    // Don't refresh before the initial render.
    if (this.tbody) {
      const newTbody = this.ce('tbody');

      // TODO: rid of _.each
      _.each(this.component.documents, doc => {
        const tr = this.buildRowItem(doc);
        newTbody.appendChild(tr);
      });

      this.table.replaceChild(newTbody, this.tbody);
      this.tbody = newTbody;
    }
  }

  build() {
    if (this.viewOnly) {
      this.viewOnlyBuild();
    } else {
      this.createElement();
      const labelAtTheBottom = this.component.labelPosition === 'bottom';
      if (!labelAtTheBottom) {
        this.createLabel(this.element);
      }
      this.table = this.ce('table', {
        class: 'table table-striped table-bordered'
      });
      this.setInputStyles(this.table);

      // Build the body.
      this.tbody = this.ce('tbody');

      // TODO: rid of _.each
      _.each(this.component.documents, doc => {
        const tr = this.buildRowItem(doc);
        this.tbody.appendChild(tr);
      });

      this.table.appendChild(this.tbody);
      this.element.appendChild(this.table);

      this.errorContainer = this.element;
      if (labelAtTheBottom) {
        this.createLabel(this.element);
      }

      this.createDescription(this.element);
      this.restoreValue();
      if (this.shouldDisable) {
        this.disabled = true;
      }
      this.autofocus();
    }

    this.attachLogic();
  }

  buildRowItem(doc) {
    const that = this;

    const tr = this.ce('tr', {
      class: 'document-list__item',
      onDragover(event) {
        this.className = 'document-list__item_dragover';
        event.preventDefault();
      },
      onDragleave(event) {
        this.className = '';
        event.preventDefault();
      },
      onDrop(event) {
        this.className = '';
        event.preventDefault();

        that.upload(event.dataTransfer.files, doc);
      }
    });

    const td = this.ce('td');
    td.appendChild(this.text(doc.label));
    tr.appendChild(td);

    if (that.dataValue[doc.value]) {
      const infoText = this.ce('span', {}, that.dataValue[doc.value][0].name);
      const cancelFileButton = this.buildCancelFile(doc.value);

      tr.appendChild(
        this.ce(
          'td',
          {
            style: 'text-align: center;'
          },
          infoText
        )
      );

      tr.appendChild(
        this.ce(
          'td',
          {
            style: 'text-align: center;'
          },
          cancelFileButton
        )
      );
    } else {
      const td2 = this.ce('td', {
        style: 'text-align: center;'
      });

      const input = this.ce('input', {
        type: 'file',
        style: 'opacity: 0; position: absolute;',
        tabindex: -1, // prevent focus
        name: this.getInputName(doc),
        onChange: () => {
          that.upload(input.files, doc);
        }
      });
      const uploadButton = this.buildUploadButton(input);
      this.addInput(input, td2);
      td2.appendChild(uploadButton);
      tr.appendChild(this.ce('td'));
      tr.appendChild(td2);
    }

    return tr;
  }

  buildCancelFile(docValue) {
    return this.ce(
      'a',
      {
        href: '#',
        onClick: event => {
          event.preventDefault();
          // There is no direct way to trigger a file dialog. To work around this, create an input of type file and trigger
          // a click event on it.
          delete this.dataValue[docValue];
          this.triggerChange();
          this.refreshDOM();
        },
        class: 'cancel-button'
      },
      this.text('Cancel')
    );
  }

  buildUploadButton(input) {
    return this.ce(
      'a',
      {
        href: '#',
        onClick: event => {
          event.preventDefault();
          // There is no direct way to trigger a file dialog. To work around this, create an input of type file and trigger
          // a click event on it.
          if (typeof input.trigger === 'function') {
            input.trigger('click');
          } else {
            input.click();
          }
        },
        class: 'upload-button'
      },
      this.text('Upload')
    );
  }

  upload(files, doc) {
    this.dataValue[doc.value] = files;
    this.triggerChange();
    this.refreshDOM();
  }

  get emptyValue() {
    return {};
  }

  getValue() {
    return this.dataValue;
  }

  setValue(value) {
    console.log('setValue', value);
    this.dataValue = value || [];
    this.refreshDOM();
  }

  validateRequired(setting, value) {
    if (!boolValue(setting)) {
      return true;
    }
    return this.component.documents.reduce((result, doc) => result && Boolean(value[doc.value]), true);
  }

  getInputName(doc) {
    return `${this.options.name}[${doc.value}]`;
  }
}
