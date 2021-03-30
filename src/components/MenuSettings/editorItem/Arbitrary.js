import React from 'react';
import get from 'lodash/get';
import set from 'lodash/set';

import { t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { Input, MLText } from '../../common/form';
import { Labels } from './../utils';
import { Field } from './../Field';
import Base from './Base';

export default class Arbitrary extends Base {
  type = MenuSettings.ItemTypes.ARBITRARY;

  componentDidMount() {
    super.componentDidMount();
    const { label, config } = this.props.item || {};
    const url = get(config, 'url');
    this.setState({ label, url });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { label, url } = this.state;

    this.data.label = label;
    set(this.data, 'config.url', url);

    onSave(this.data);
  }

  isInvalidForm() {
    const { url } = this.state;

    return this.isInvalidLabel || !url;
  }

  setLabel = label => {
    this.setState({ label });
  };

  setUrl = e => {
    this.setState({ url: e.target.value });
  };

  render() {
    const { label, url = '' } = this.state;
    const urlInfo = {
      origin: window.location.origin,
      pathname: window.location.pathname,
      value: url,
      interpolation: { escapeValue: false }
    };

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_NAME_LABEL)}>
          <MLText onChange={this.setLabel} value={label} />
        </Field>
        <Field label={t(Labels.FIELD_URL_LABEL)} required description={t(Labels.FIELD_URL_DESC, urlInfo)}>
          <Input onChange={this.setUrl} value={url} />
        </Field>
        <Field className="ecos-menu-editor-item__field-result">
          {t(
            !url || url.startsWith('http')
              ? Labels.FIELD_URL_RESULT_ABSOLUTE
              : url.startsWith('/')
              ? Labels.FIELD_URL_RESULT_WITH_SLASH
              : Labels.FIELD_URL_RESULT_WITHOUT_SLASH,
            urlInfo
          )}
        </Field>
      </this.wrapperModal>
    );
  }
}
