import React from 'react';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/export/util';
import { SourcesId as SourceId, SystemJournals } from '../../../constants';
import { MenuSettings as MS } from '../../../constants/menu';
import { SelectJournal, Dropdown } from '../../common/form';
import { Labels } from '../utils';
import { Field } from '../Field';
import Records from '../../Records';
import Base from './Base';
import { extractLabel } from '../../../helpers/util';

export default class LinkCreateCase extends Base {
  state = {
    ...super.state,
    typeRef: '',
    createVariants: [],
    selectedVariant: {},
    error: false
  };

  componentDidMount() {
    const { item } = this.props;
    const typeRef = get(item, 'config.recordRef') || get(item, 'config.typeRef');

    super.componentDidMount();

    this.setState({ typeRef });

    if (typeRef) {
      this.getCreateVariants(typeRef, get(item, 'config.variantId'), get(item, 'config.variantTypeRef'));
    }
  }

  get title() {
    const { item, type, action } = this.props;

    return action === MS.ActionTypes.CREATE
      ? t(Labels.MODAL_TITLE_ADD, { type: t(type.label) })
      : t(Labels.MODAL_TITLE_EDIT, { type: t(type.label), name: extractLabel(get(item, 'label')) });
  }

  getCreateVariants(typeRef, variantId, variantTypeRef) {
    if (!typeRef) {
      return;
    }

    const resolvedType = typeRef.replace(SourceId.TYPE, SourceId.RESOLVED_TYPE);

    this.setState({ isLoading: true });

    Records.get(resolvedType)
      .load('createVariants[]{id,mlName:name?json,name,typeRef:typeRef?id}')
      .then(result => this.handleSetVariants(result, variantId, variantTypeRef));
  }

  isInvalidForm() {
    const { error, typeRef, selectedVariant } = this.state;

    return Boolean(error) || !Boolean(typeRef) || isEmpty(selectedVariant);
  }

  clearData() {
    this.setState({
      typeRef: '',
      createVariants: [],
      selectedVariant: {}
    });
  }

  handleSetVariants = (result, variantId, variantTypeRef) => {
    const createVariants = result.map(item => ({
      ...item,
      uniqueKey: `${item.typeRef}.${item.id}`
    }));
    this.setState({
      isLoading: false,
      error: isEmpty(createVariants),
      createVariants
    });

    if (!isEmpty(createVariants)) {
      this.setState({
        selectedVariant: variantId
          ? createVariants.find(item => item.id === variantId && item.typeRef === variantTypeRef)
          : get(createVariants, '[0]')
      });
    }
  };

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { typeRef, selectedVariant } = this.state;

    set(this.data, 'config.typeRef', typeRef);
    set(this.data, 'config.variantId', selectedVariant.id);
    set(this.data, 'config.variantTypeRef', selectedVariant.typeRef);
    set(this.data, 'type.key', selectedVariant);

    // todo: for getting dynamic label, need to save ref or add needed
    //  attribute into fetchExtraItemInfo api/menu.js
    set(this.data, 'label', get(selectedVariant, 'mlName'));

    onSave(this.data);
  }

  handleSelectType = typeRef => {
    if (!typeRef) {
      this.clearData();
      return;
    }

    this.setState({ typeRef });
    this.getCreateVariants(typeRef);
  };

  handleSelectVariant = selectedVariant => {
    this.setState({ selectedVariant });
  };

  renderErrorMessage() {
    const { error } = this.state;

    if (!error) {
      return null;
    }

    return (
      <div className="alert alert-danger" role="alert">
        {t(Labels.TYPE_NOT_CREATED)}
      </div>
    );
  }

  renderSelectVariant() {
    const { createVariants, selectedVariant } = this.state;

    if (isEmpty(createVariants) || createVariants.length < 2) {
      return null;
    }

    return (
      <Field label={t(Labels.FIELD_CREATE_METHOD)} required>
        <Dropdown
          value={get(selectedVariant, 'uniqueKey')}
          source={createVariants}
          valueField="uniqueKey"
          titleField="name"
          controlClassName="ecos-btn_drop-down ecos-btn_white2"
          hideSelected
          onChange={this.handleSelectVariant}
        />
      </Field>
    );
  }

  render() {
    const { typeRef } = this.state;

    return (
      <this.wrapperModal>
        {this.renderErrorMessage()}

        <Field label={t(Labels.FIELD_DATA_TYPE)} required>
          <SelectJournal defaultValue={typeRef} onChange={this.handleSelectType} journalId={SystemJournals.TYPES} isSelectedValueAsText />
        </Field>

        {this.renderSelectVariant()}
      </this.wrapperModal>
    );
  }
}
