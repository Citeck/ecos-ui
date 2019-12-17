import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { getFormList } from '../../actions/properties';

import './style.scss';
import { Dropdown } from '../common/form';
import { Btn, IcoBtn } from '../common/btns';

const Labels = {
  WIDGET_TITLE: 'properties-widget.title'
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

  onChange = () => {};

  onCancel = () => {};
  onSave = () => {};

  render() {
    const { forms, isLoading } = this.props;
    const arr = forms.map((text, id) => ({ text, id }));
    arr.unshift({ id: null, text: 'Не выбрано' });
    const selected = null;

    return (
      <div className="ecos-properties-settings">
        <div className="ecos-properties-settings__title">Настройки виджета</div>
        <div className="ecos-properties-settings__subtitle">Какие свойства отображать в виджете</div>
        <div className="ecos-properties-settings__form-list">
          <Dropdown
            source={arr}
            value={selected}
            valueField={'id'}
            titleField={'text'}
            onChange={this.onChange}
            hideSelected
            hasEmpty
            className="ecos-properties-settings__form-list-dropdown"
          >
            <IcoBtn invert icon={'icon-down'} className="ecos-properties-settings__form-list-btn" loading={isLoading} />
          </Dropdown>
        </div>
        <div className="ecos-properties-settings__buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.handleCancel}>
            Отмена
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.onSave}>
            Сохранить
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
    isLoading: get(stateCurrent, 'forms.isLoading', [])
  };
};

const mapDispatchToProps = dispatch => ({
  getFormList: payload => dispatch(getFormList(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PropertiesSettings);
