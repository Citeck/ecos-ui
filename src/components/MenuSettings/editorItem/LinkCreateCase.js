import React from 'react';
import set from 'lodash/set';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';

import { t } from '../../../helpers/export/util';
import { SourcesId as SourceId, SystemJournals } from '../../../constants';
import { MenuSettings as MS, MenuSettings } from '../../../constants/menu';
import { Input, SelectJournal, Textarea } from '../../common/form';
import { Labels } from './../utils';
import { Field } from './../Field';
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

    super.componentDidMount();

    this.setState({ typeRef });

    if (typeRef) {
      this.getCreateVariants(typeRef);
    }
  }

  get title() {
    const { item, type, action } = this.props;

    return action === MS.ActionTypes.CREATE
      ? t(Labels.MODAL_TITLE_ADD, { type: t(type.label) })
      : t(Labels.MODAL_TITLE_EDIT, { type: t(type.label), name: extractLabel(get(item, 'label')) });
  }

  getCreateVariants(typeRef) {
    if (!typeRef) {
      return;
    }

    const resolvedType = typeRef.replace(SourceId.TYPE, SourceId.RESOLVED_TYPE);

    this.setState({ isLoading: true });

    Records.get(resolvedType)
      .load('createVariants[]{id,name}')
      .then(createVariants => {
        console.warn({ createVariants });

        this.setState({
          isLoading: false,
          error: isEmpty(createVariants),
          createVariants
        });

        if (!isEmpty(createVariants) && createVariants.length === 1) {
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

  handleSelectType = typeRef => {
    console.warn({ typeRef });

    if (!typeRef) {
      this.clearData();
      return;
    }

    this.setState({ typeRef });
    this.getCreateVariants(typeRef);
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

  render() {
    const { onSave, onClose, journalId } = this.props;
    const { typeRef } = this.state;

    return (
      <this.wrapperModal>
        {this.renderErrorMessage()}
        <Field label={t('Тип данных')} required>
          <SelectJournal
            defaultValue={typeRef}
            onChange={this.handleSelectType}
            // onCancel={onClose}
            journalId={SystemJournals.TYPES}
            isSelectedValueAsText
            // renderView={() => null}
            // isSelectModalOpen
          />
        </Field>
      </this.wrapperModal>
    );
  }
}
