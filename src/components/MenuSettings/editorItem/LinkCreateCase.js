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
    variantId: '',
    error: false
  };

  componentDidMount() {
    const { item } = this.props;
    const typeRef = get(item, 'config.recordRef') || get(item, 'config.typeRef');
    const variantId = get(item, 'config.variantId');

    super.componentDidMount();

    this.setState({ typeRef, variantId });

    if (typeRef) {
      this.getCreateVariants(typeRef, variantId);
    }
  }

  get title() {
    const { item, type, action } = this.props;

    return action === MS.ActionTypes.CREATE
      ? t(Labels.MODAL_TITLE_ADD, { type: t(type.label) })
      : t(Labels.MODAL_TITLE_EDIT, { type: t(type.label), name: extractLabel(get(item, 'label')) });
  }

  getCreateVariants(typeRef, defaultVariantId) {
    if (!typeRef) {
      return;
    }

    const resolvedType = typeRef.replace(SourceId.TYPE, SourceId.RESOLVED_TYPE);

    this.setState({ isLoading: true });

    Records.get(resolvedType)
      .load('createVariants[]{id,name}')
      .then(createVariants => {
        this.setState({
          isLoading: false,
          error: isEmpty(createVariants),
          createVariants
        });

        if (!isEmpty(createVariants) && !defaultVariantId) {
          this.setState({ variantId: get(createVariants, '[0].id') });
        }
      });
  }

  isInvalidForm() {
    const { error, typeRef, variantId } = this.state;

    return Boolean(error) || !Boolean(typeRef) || !Boolean(variantId);
  }

  clearData() {
    this.setState({
      typeRef: '',
      createVariants: [],
      variantId: ''
    });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { typeRef, variantId, createVariants } = this.state;

    set(this.data, 'config.typeRef', typeRef);
    set(this.data, 'config.variantId', variantId);
    set(this.data, 'type.key', variantId);

    // todo: for getting dynamic label, need to save ref or add needed
    //  attribute into fetchExtraItemInfo api/menu.js
    set(this.data, 'label', get(createVariants.find(item => item.id === variantId), 'name'));

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

  handleSelectVariant = variant => {
    this.setState({ variantId: variant.id });
  };

  renderErrorMessage() {
    const { error } = this.state;

    if (!error) {
      return null;
    }

    return (
      <div className="alert alert-danger" role="alert">
        {t('выбранный тип создать нельзя ')}
      </div>
    );
  }

  renderSelectVariant() {
    const { createVariants, variantId } = this.state;

    if (isEmpty(createVariants) || createVariants.length < 2) {
      return null;
    }

    return (
      <Field label={t('Способ создания')} required>
        <Dropdown
          value={variantId}
          source={createVariants}
          valueField="id"
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

        <Field label={t('Тип данных')} required>
          <SelectJournal defaultValue={typeRef} onChange={this.handleSelectType} journalId={SystemJournals.TYPES} isSelectedValueAsText />
        </Field>

        {this.renderSelectVariant()}
      </this.wrapperModal>
    );
  }
}
