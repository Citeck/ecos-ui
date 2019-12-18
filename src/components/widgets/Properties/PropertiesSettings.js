import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { getFormList } from '../../../actions/properties';
import { Caption, Dropdown } from '../../common/form';
import { Btn, IcoBtn } from '../../common/btns';

import './style.scss';

const Labels = {
  SETTINGS_TITLE: 'properties-widget.settings.title',
  SETTINGS_BTN_CANCEL: 'properties-widget.settings.btn.cancel',
  SETTINGS_BTN_SAVE: 'properties-widget.settings.btn.save',
  DISPLAYED_PROPERTIES: 'properties-widget.settings.displayed-properties',
  FORM_NOT_CHOSEN: 'properties-widget.settings.form-not-chosen'
};

class PropertiesSettings extends React.Component {
  static propTypes = {
    record: PropTypes.string,
    stateId: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    const { stateId, record } = this.props;

    this.props.getFormList({ stateId, record });
  }

  onChangeForm = () => {};

  onCancel = () => {};

  onSave = () => {};

  render() {
    const { forms, isLoading } = this.props;
    const arr = forms.slice();
    arr.unshift({ id: null, title: t(Labels.FORM_NOT_CHOSEN) });
    const selected = null;

    return (
      <div className="ecos-properties-settings">
        <Caption middle className="ecos-properties-settings__title">
          {t(Labels.SETTINGS_TITLE)}
        </Caption>
        <div className="ecos-properties-settings__subtitle">{t(Labels.DISPLAYED_PROPERTIES)}</div>
        <div className="ecos-properties-settings__form-list">
          <Dropdown
            source={arr}
            value={selected}
            valueField={'id'}
            titleField={'title'}
            onChange={this.onChangeForm}
            hideSelected
            hasEmpty
            className="ecos-properties-settings__form-list-dropdown"
          >
            <IcoBtn invert icon={'icon-down'} className="ecos-properties-settings__form-list-btn" loading={isLoading} />
          </Dropdown>
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
