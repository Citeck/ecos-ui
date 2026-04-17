import get from 'lodash/get';

import Records from '../../../../components/Records';
import SelectHierarchicalComponent from '../../../../components/common/form/SelectHierarchical';
import BaseReactComponent from '../base/BaseReactComponent';

export default class SelectHierarchicalFormComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        label: 'Select Hierarchical',
        key: 'selectHierarchical',
        type: 'selectHierarchical',
        input: true,
        typeRef: '',
        multiple: false,
        defaultValue: ''
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: 'Select Hierarchical',
      icon: 'fa fa-sitemap',
      group: 'advanced',
      weight: 5,
      schema: SelectHierarchicalFormComponent.schema()
    };
  }

  get defaultSchema() {
    return SelectHierarchicalFormComponent.schema();
  }

  get emptyValue() {
    return this.component.multiple ? [] : '';
  }

  getComponentToRender() {
    return SelectHierarchicalComponent;
  }

  async resolveTypeRef() {
    let typeRef = this.component.typeRef || get(this.root, 'options.typeRef');

    if (!typeRef) {
      try {
        typeRef = await this.getRecord().load('_type?id');
      } catch (e) {
        console.error('[SelectHierarchical] failed to resolve record type', e);
      }
    }

    return typeRef || '';
  }

  async loadAssociations(typeRef) {
    if (!typeRef) {
      return [];
    }

    try {
      const attributes = await Records.get(typeRef).load('model.attributes[]{id,type,config.typeRef}');

      if (!Array.isArray(attributes)) {
        return [];
      }

      return attributes.filter(attr => attr && attr.type === 'ASSOC');
    } catch (e) {
      console.error('[SelectHierarchical] failed to load associations', e);
      return [];
    }
  }

  async getInitialReactProps() {
    const attributeName = this.getAttributeToEdit();
    const hasExplicitTypeRef = !!this.component.typeRef;
    const builderMode = !!(this.options && this.options.builder);

    const typeRef = await this.resolveTypeRef();
    const associations = typeRef ? await this.loadAssociations(typeRef) : [];

    // Read value AFTER async work so we get the freshest dataValue at render time
    const baseProps = {
      value: this.dataValue == null ? this.emptyValue : this.dataValue,
      multiple: !!this.component.multiple,
      disabled: this.disabled,
      viewOnly: !!this.viewOnly,
      builderMode,
      attribute: attributeName,
      onChange: this.onReactValueChanged
    };

    if (!typeRef) {
      return { ...baseProps, error: 'TYPE_NOT_RESOLVED' };
    }

    // When typeRef is explicitly set, prefer matching the form field key first
    // (disambiguates when the type has multiple self-associations like 'parent' and
    // 'children'), then fall back to any self-association on the type.
    // When typeRef is implicit (resolved from the record's own type), strictly
    // require the form field key to match an association on that type.
    let association;
    if (hasExplicitTypeRef) {
      const byName = associations.find(a => a && a.id === attributeName);
      association = byName && byName.config === typeRef
        ? byName
        : associations.find(a => a && a.config === typeRef);
    } else {
      association = associations.find(a => a && a.id === attributeName);
    }

    if (!association) {
      return { ...baseProps, typeRef, error: 'ASSOCIATION_NOT_FOUND' };
    }

    const associationTarget = association.config;

    if (associationTarget !== typeRef) {
      return { ...baseProps, typeRef, error: 'ASSOCIATION_NOT_SELF', associationTarget };
    }

    // Pass the self-association's attribute id to the React component so it
    // can query children correctly (e.g. "children[]?id" for hasChildren check).
    return { ...baseProps, typeRef, selfAssociation: association, attribute: association.id };
  }

  setReactValue(component, value) {
    this.setReactProps({ value: value == null ? this.emptyValue : value });
  }
}
