import FormIOEditGridComponent from 'formiojs/components/editgrid/EditGrid';
import Components from 'formiojs/components/Components';
import cloneDeep from 'lodash/cloneDeep';
import clone from 'lodash/clone';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

export default class EditGridComponent extends FormIOEditGridComponent {
  getCancelButton(rowIndex) {
    if (!this.component.cancelRow) {
      return null;
    }

    if (this.component.removeRow) {
      return null;
    }

    return this.ce(
      'button',
      {
        class: 'btn btn-secondary',
        onClick: this.cancelRow.bind(this, rowIndex)
      },
      this.component.cancelRow || 'Cancel'
    );
  }

  createRow(row, rowIndex) {
    const wrapper = this.ce('li', { class: 'list-group-item' });
    const rowTemplate = get(this.component, 'templates.row', EditGridComponent.defaultRowTemplate);

    // Store info so we can detect changes later.
    wrapper.rowData = row.data;
    wrapper.rowIndex = rowIndex;
    wrapper.rowOpen = row.isOpen;
    row.components = [];

    if (wrapper.rowOpen) {
      const editForm = this.component.components.map(comp => {
        const component = cloneDeep(comp);
        const options = clone(this.options);

        options.row = `${this.row}-${rowIndex}`;
        options.name += `[${rowIndex}]`;

        const instance = this.createComponent(component, options, row.data);

        instance.rowIndex = rowIndex;
        row.components.push(instance);

        return instance.element;
      });

      if (!this.options.readOnly) {
        editForm.push(
          this.ce('div', { class: 'editgrid-actions' }, [
            this.ce(
              'button',
              {
                class: 'btn btn-primary',
                onClick: this.saveRow.bind(this, rowIndex)
              },
              this.component.saveRow || 'Save'
            ),
            ' ',
            this.component.removeRow
              ? this.ce(
                  'button',
                  {
                    class: 'btn btn-danger',
                    onClick: this.cancelRow.bind(this, rowIndex)
                  },
                  this.component.removeRow || 'Cancel'
                )
              : null,
            this.getCancelButton.call(this, rowIndex)
          ])
        );
      }

      wrapper.appendChild(this.ce('div', { class: 'editgrid-edit' }, this.ce('div', { class: 'editgrid-body' }, editForm)));
    } else {
      const rowMarkup = this.renderTemplate(
        rowTemplate,
        {
          row: row.data,
          data: this.data,
          rowIndex,
          components: this.component.components,
          getView: (component, data) => Components.create(component, this.options, data, true).getView(data)
        },
        [
          {
            class: 'removeRow',
            event: 'click',
            action: this.removeRow.bind(this, rowIndex)
          },
          {
            class: 'editRow',
            event: 'click',
            action: this.editRow.bind(this, rowIndex)
          }
        ]
      );
      let rowElement;

      if (this.allowReorder) {
        rowElement = this.ce(
          'div',
          {
            class: 'row'
          },
          [
            this.ce(
              'div',
              {
                class: 'col-xs-1 formio-drag-column'
              },
              this.dragButton()
            ),
            this.ce(
              'div',
              {
                class: 'col-xs-11'
              },
              rowMarkup
            )
          ]
        );
      } else {
        rowElement = rowMarkup;
      }

      wrapper.appendChild(rowElement);
    }

    wrapper.appendChild((row.errorContainer = this.ce('div', { class: 'has-error' })));
    this.checkData(this.data, { noValidate: true }, rowIndex);

    if (this.allowReorder) {
      wrapper.dragInfo = {
        index: rowIndex
      };
    }

    return wrapper;
  }

  get isEmptyEditRows() {
    if (isEmpty(this.editRows)) {
      return true;
    }

    return this.editRows.every(row => {
      const { data: { name = '', actions = [], trigger = {} } = {}, isOpen } = row;

      return isOpen && isEmpty(actions) && isEmpty(name) && Object.keys(trigger).every(key => isEmpty(trigger[key]));
    });
  }

  get keysIgnoringBasicValidation() {
    return ['logic'];
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-1212
  checkValidity(data, dirty) {
    if (this.keysIgnoringBasicValidation.includes(this.key) && this.isEmptyEditRows) {
      return true;
    }

    return super.checkValidity.call(this, data, dirty);
  }
}
