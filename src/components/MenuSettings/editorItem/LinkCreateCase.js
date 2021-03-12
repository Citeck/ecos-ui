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
    error: false
  };

  get title() {
    const { item, type, action } = this.props;

    return action === MS.ActionTypes.CREATE
      ? t(Labels.MODAL_TITLE_ADD, { type: t(type.label) })
      : t(Labels.MODAL_TITLE_EDIT, { type: t(type.label), name: extractLabel(get(item, 'label')) });
  }

  isInvalidForm() {
    const { error, typeRef } = this.state;

    return Boolean(error) || !Boolean(typeRef);
  }

  handleSelectType = typeRef => {
    console.warn({ typeRef });

    this.setState({ isLoading: true, typeRef });

    Records.get(typeRef.replace(SourceId.TYPE, SourceId.RESOLVED_TYPE))
      .load('createVariants[]{id,name}')
      .then(result => {
        console.warn({ result });

        this.setState({ isLoading: false, error: isEmpty(result) });
      });
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

    return (
      <this.wrapperModal>
        {this.renderErrorMessage()}
        <Field label={t('Тип данных')} required>
          <SelectJournal
            onChange={this.handleSelectType}
            // onCancel={onClose}
            journalId={journalId}
            isSelectedValueAsText
            // renderView={() => null}
            // isSelectModalOpen
          />
        </Field>
      </this.wrapperModal>
    );
  }
}
