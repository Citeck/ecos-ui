import _ from 'lodash';
import { evaluate as formioEvaluate } from 'formiojs/utils/utils';
import { SelectJournal } from '../../../../components/common/form';
import Records from '../../../../components/Records';
import EcosFormUtils from '../../../../components/EcosForm/EcosFormUtils';
import BaseReactComponent from '../base/BaseReactComponent';

export default class SelectJournalComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'SelectJournal',
        key: 'selectJournal',
        type: 'selectJournal',
        customPredicateJs: null,
        presetFilterPredicatesJs: null,
        hideCreateButton: false,
        hideEditRowButton: false,
        hideDeleteRowButton: false,
        isFullScreenWidthModal: false,
        isSelectedValueAsLink: false
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
    if (!_.isEqual(customPredicate, this.customPredicateValue)) {
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
      let presetFilterPredicates = null;
      if (component.presetFilterPredicatesJs) {
        presetFilterPredicates = this.evaluate(component.presetFilterPredicatesJs, {}, 'value', true);
      }

      const reactComponentProps = {
        defaultValue: this.dataValue,
        isCompact: component.isCompact,
        multiple: component.multiple,
        placeholder: component.placeholder,
        disabled: component.disabled,
        journalId: journalId,
        onChange: this.onReactValueChanged,
        viewOnly: this.viewOnly,
        displayColumns: component.displayColumns,
        hideCreateButton: component.hideCreateButton,
        hideEditRowButton: component.hideEditRowButton,
        hideDeleteRowButton: component.hideDeleteRowButton,
        isSelectedValueAsLink: component.isSelectedValueAsLink,
        isFullScreenWidthModal: component.isFullScreenWidthModal,
        presetFilterPredicates,
        searchField: component.searchField,
        computed: {
          valueDisplayName: value => SelectJournalComponent.getValueDisplayName(this.component, value)
        },
        onError: err => {
          // this.setCustomValidity(err, false);
        }
      };

      if (this.customPredicateValue) {
        reactComponentProps.initCustomPredicate = this.customPredicateValue;
      }

      return reactComponentProps;
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

  static getValueDisplayName = (component, value) => {
    let dispNameJs = _.get(component, 'computed.valueDisplayName', null);
    let result = null;

    if (dispNameJs) {
      let model = { _ };

      if (_.isString(value)) {
        let recordId = value[0] === '{' ? EcosFormUtils.initJsonRecord(value) : value;
        model.value = Records.get(recordId);
      } else {
        model.value = value;
      }

      result = formioEvaluate(dispNameJs, model, 'disp', true);
    } else {
      result = Records.get(value).load('.disp');
    }
    return result ? result : value;
  };
}
