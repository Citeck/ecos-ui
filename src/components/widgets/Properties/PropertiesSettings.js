import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { getFormList } from '../../../actions/properties';
import { InfoText } from '../../common';
import { Caption, Dropdown } from '../../common/form';
import { Btn, IcoBtn } from '../../common/btns';

import './style.scss';

const Labels = {
  SETTINGS_TITLE: 'properties-widget.settings.title',
  SETTINGS_BTN_CANCEL: 'properties-widget.settings.btn.cancel',
  SETTINGS_BTN_SAVE: 'properties-widget.settings.btn.save',
  DISPLAYED_PROPERTIES: 'properties-widget.settings.displayed-properties',
  DEFAULT_FORM: 'properties-widget.settings.default-form',
  FORM_NOT_EXISTED: 'properties-widget.settings.form-not-existed-in-list'
};

class PropertiesSettings extends React.Component {
  static propTypes = {
    record: PropTypes.string,
    stateId: PropTypes.string,
    formId: PropTypes.string,
    onSave: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    formId: null
  };

  constructor(props) {
    super(props);

    this.state = {
      formId: props.formId
    };
  }

  componentDidMount() {
    const { stateId, record } = this.props;

    this.props.getFormList({ stateId, record });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId && this.state.formId !== this.props.formId) {
      return { formId: this.props.formId };
    }
  }

  onChangeForm = form => {
    this.setState({ formId: form.id || null });
  };

  onCancel = () => {
    this.props.onCancel();
  };

  onSave = () => {
    const { formId } = this.state;

    this.props.onSave({ formId });
  };

  render() {
    const { forms, isLoading } = this.props;
    const { formId } = this.state;
    const arrForms = forms.slice();

    arrForms.unshift({ id: null, title: t(Labels.DEFAULT_FORM) });

    const isExist = arrForms.find(form => form.id === formId);

    return (
      <div className="ecos-properties-settings">
        <Caption middle className="ecos-properties-settings__title">
          {t(Labels.SETTINGS_TITLE)}
        </Caption>
        <div className="ecos-properties-settings__block">
          <div className="ecos-properties-settings__subtitle">{t(Labels.DISPLAYED_PROPERTIES)}</div>
          <div className="ecos-properties-settings__form-list">
            <Dropdown
              source={arrForms}
              value={formId}
              valueField={'id'}
              titleField={'title'}
              onChange={this.onChangeForm}
              hideSelected
              hasEmpty
              className="ecos-properties-settings__form-list-dropdown"
              toggleClassName="ecos-properties-settings__form-list-toggle"
              full
            >
              <IcoBtn invert icon="icon-down" className="ecos-properties-settings__form-list-btn" loading={isLoading} />
            </Dropdown>
          </div>
          {!isExist && <InfoText text={t(Labels.FORM_NOT_EXISTED)} type="warn" noIndents className="ecos-properties-settings__msg" />}
        </div>
        <div className="ecos-properties-settings__buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.onCancel}>
            {t(Labels.SETTINGS_BTN_CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.onSave}>
            {t(Labels.SETTINGS_BTN_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, context) => {
  const stateCurrent = get(state, ['properties', context.stateId], {});

  return {
    forms: get(stateCurrent, 'forms.list', []),
    isLoading: get(stateCurrent, 'forms.isLoading', false)
  };
};

const mapDispatchToProps = dispatch => ({
  getFormList: payload => dispatch(getFormList(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PropertiesSettings);
