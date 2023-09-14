import React from 'react';
import isFunction from 'lodash/isFunction';

import { DashboardApi } from '../../api/dashboard';
import { getDOMElementMeasurer, t } from '../../helpers/util';
import { Checkbox, Field, Label, Select } from '../common/form';

import './style.scss';

export const Labels = {
  LINKED_ATTRIBUTES_FIELD: 'linked-select.linked-attributes-field',
  ONLY_LINKED_FIELD: 'journals.action.only-linked'
};

const api = new DashboardApi();

class LinkedAttributesSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOnlyLinked: props.isOnlyLinked || false,
      attrsToLoad: props.attrsToLoad || [],
      attribuesOptions: []
    };
  }

  componentDidMount() {
    this.fetchAttributes();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.journalId !== this.props.journalId || prevProps.typeRef !== this.props.typeRef) {
      this.fetchAttributes();
    }
  }

  get isSmall() {
    const measurer = getDOMElementMeasurer(this._ref);

    return measurer && !!measurer.width && (measurer.xs || measurer.xxs || measurer.xxxs);
  }

  fetchAttributes = async () => {
    const { typeRef, journalId } = this.props;

    if (!typeRef || !journalId) {
      this.setState({ attribuesOptions: [] });
      return;
    }

    const attribuesOptions = await api.getLinkedAttributesWithJournal(typeRef, journalId);
    this.setState({ attribuesOptions });
  };

  onChange = newParams => {
    const { onChange } = this.props;
    const { isOnlyLinked } = newParams;

    if (isOnlyLinked === false) {
      newParams.attrsToLoad = [];
    }

    this.setState(newParams);

    isFunction(onChange) && onChange(newParams);
  };

  render() {
    const { isOnlyLinked, attribuesOptions, attrsToLoad } = this.state;

    const showLinkedAttributesField = Boolean(isOnlyLinked);

    return (
      <div className="linked-attributes-select">
        <Field className="linked-attributes-select__checkbox field" isSmall={this.isSmall}>
          <Checkbox checked={isOnlyLinked} onClick={isOnlyLinked => this.onChange({ isOnlyLinked })} />
          <Label className="field__label">{t(Labels.ONLY_LINKED_FIELD)}</Label>
        </Field>
        {showLinkedAttributesField && (
          <Field
            className="linked-attributes-select__field"
            label={t(Labels.LINKED_ATTRIBUTES_FIELD)}
            isSmall={this.isSmall}
            isRequired={isOnlyLinked}
          >
            <Select
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              options={attribuesOptions}
              value={attrsToLoad}
              onChange={attrsToLoad => {
                this.onChange({ attrsToLoad });
              }}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              isMulti
            />
          </Field>
        )}
      </div>
    );
  }
}

export default LinkedAttributesSelect;
