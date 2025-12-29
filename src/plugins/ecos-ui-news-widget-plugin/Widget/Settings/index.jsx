import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Labels, { ERROR_TYPES } from '../../labels';

import DropDown, { DropDownItem } from '@/components/Lexical/ui/DropDown';
import Records from '@/components/Records';
import { InfoText } from '@/components/common';
import Loader from '@/components/common/Loader';
import { Btn } from '@/components/common/btns';
import { Field } from '@/components/common/form';
import { SystemJournals } from '@/constants';
import { t } from '@/helpers/export/util';
import { getDOMElementMeasurer } from '@/helpers/util';

import './settings-style.scss';

class Settings extends Component {
  _ref = null;

  constructor(props) {
    super(props);

    this.state = {
      title: get(props, 'config.title', ''),
      typeId: get(props, 'config.currentType', ''),
      error: null,
      warning: '',
      isLoading: true,
      types: [],
      currentType: ''
    };
  }

  componentDidMount() {
    this.fetchTypes();
  }

  fetchTypes() {
    Records.query(
      {
        language: 'predicate',
        sourceId: 'emodel/type',
        query: {
          t: 'or',
          v: [
            { t: 'eq', a: 'id', v: 'news' },
            { t: 'contains', a: 'parents[]', v: 'emodel/type@news' }
          ]
        }
      },
      {
        id: 'id',
        title: '?disp'
      }
    )
      .then(res => {
        this.setState({
          types: res.records
        });
      })
      .catch(err => {
        this.setState({
          error: err.message
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false
        });
      });
  }

  get isSmall() {
    const measurer = getDOMElementMeasurer(this._ref);

    return measurer && !!measurer.width && (measurer.xs || measurer.xxs || measurer.xxxs);
  }

  setEditorRef = ref => {
    if (ref) {
      this._ref = ref;
    }
  };

  handleChangeTypeId = newType => {
    const { currentType } = this.state;

    if (currentType !== newType.id) {
      this.setState({
        currentType: newType.id,
        title: newType.title
      });
    }
  };

  setError = error => {
    if (ERROR_TYPES[error] || !error) {
      this.setState({ error });
    }
  };

  handleSave = () => {
    const { title, currentType } = this.state;
    const { onSave, config } = this.props;

    if (!title || !currentType) {
      this.setState({
        warning: 'Выберите тип'
      });
      return;
    } else {
      this.setState({
        warning: '',
        isLoading: true
      });
    }

    isFunction(onSave) &&
      onSave({
        title,
        currentType: currentType || config.typeId
      });
  };

  render() {
    const { isLoading, error, types, currentType, warning } = this.state;
    const { onCancel, config } = this.props;

    return (
      <>
        {isLoading && <Loader />}
        {!isLoading && (
          <div className="ecos-charts-settings" ref={this.setEditorRef}>
            <Field labelPosition="top" isSmall={this.isSmall}>
              <DropDown buttonClassName="ecos-charts-settings__type-select" buttonLabel="Выберите тип">
                {types.map(item => {
                  return (
                    <DropDownItem className="ecos-charts-settings__type-elem" key={item.id} onClick={() => this.handleChangeTypeId(item)}>
                      <span>{item.title}</span>
                    </DropDownItem>
                  );
                })}
              </DropDown>

              <span>{currentType}</span>
              {error && <InfoText text={t(error)} className="ecos-charts-settings__validate-message" type="error" />}
            </Field>

            {warning && <InfoText text={t(warning)} className="ecos-charts-settings__validate-message" type="warning" />}
            <div className="ecos-charts-settings__buttons">
              <Btn className="mr-3" onClick={onCancel}>
                {t(Labels.Settings.SETTINGS_BTN_CANCEL)}
              </Btn>
              <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSave} loading={isLoading}>
                {t(Labels.Settings.SETTINGS_BTN_SAVE)}
              </Btn>
            </div>
          </div>
        )}
      </>
    );
  }
}

Settings.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default Settings;
