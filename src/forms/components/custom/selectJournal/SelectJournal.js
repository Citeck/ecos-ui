import BaseReactComponent from '../base/BaseReactComponent';
import SelectJournal from '../../../../components/common/form/SelectJournal';
import isEqual from 'lodash/isEqual';

export default class SelectJournalComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'SelectJournal',
        key: 'selectJournal',
        type: 'selectJournal',
        customPredicateJs: null
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Journal',
      icon: 'fa fa-th-list',
      group: 'advanced',
      weight: 0,
      schema: SelectJournalComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectJournalComponent.schema();
  }

  checkConditions(data) {
    let result = super.checkConditions(data);

    if (!this.component.customPredicateJs) {
      return result;
    }

    let customPredicate = this.evaluate(this.component.customPredicateJs, {}, 'value', true);
    if (!isEqual(customPredicate, this.customPredicateValue)) {
      this.customPredicateValue = customPredicate;
      this.updateReactComponent(component => component.setCustomPredicate(customPredicate));
    }

    return result;
  }

  getComponentToRender() {
    return SelectJournal;
  }

  getInitialReactProps() {
    let resolveProps = journalId => {
      let component = this.component;

      return {
        defaultValue: component.defaultValue,
        isCompact: component.isCompact,
        multiple: component.multiple,
        placeholder: component.placeholder,
        disabled: component.disabled,
        journalId: journalId,
        onChange: this.onReactValueChanged,
        viewOnly: this.viewOnly,
        displayColumns: component.displayColumns,
        hideCreateButton: component.hideCreateButton,
        onError: err => {
          // this.setCustomValidity(err, false);
        }
      };
    };

    let journalId = this.component.journalId;

    if (!journalId) {
      let attribute = this.getAttributeToEdit();
      return this.getRecord()
        .loadEditorKey(attribute)
        .then(editorKey => {
          return resolveProps(editorKey);
        })
        .catch(() => {
          return resolveProps(null);
        });
    } else {
      return resolveProps(journalId);
    }
  }
}
