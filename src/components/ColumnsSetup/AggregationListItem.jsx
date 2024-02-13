import React, { Component } from 'react';
import isFunction from 'lodash/isFunction';

import Columns from '../common/templates/Columns/Columns';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';
import { Label } from '../common/form';
import { getMLValue, t } from '../../helpers/util';
import { EcosModal } from '../common';
import { Filters } from '../Filters';

class AggregationListItem extends Component {
  constructor(props) {
    super(props);

    const defaultAggregationType = {
      attribute: `_${props.column.attribute}`,
      text: props.column.label,
      column: props.column.attribute,
      sortable: props.column.sortable,
      type: 'NUMBER',
      newFormatter: props.column.newFormatter || {
        type: 'number'
      },
      newEditor: props.column.newEditor
    };

    this.aggregationTypes = [
      {
        ...defaultAggregationType,
        schema: `sum(${props.column.attribute})`,
        label: {
          ru: `Сумма (${props.column.label})`,
          en: `Sum (${props.column.label})`
        }
      },
      {
        ...defaultAggregationType,
        schema: `avg(${props.column.attribute})`,
        label: {
          ru: `Среднее (${props.column.label})`,
          en: `Average (${props.column.label})`
        }
      },
      {
        ...defaultAggregationType,
        schema: `min(${props.column.attribute})`,
        label: {
          ru: `Минимум (${props.column.label})`,
          en: `Min (${props.column.label})`
        }
      },
      {
        ...defaultAggregationType,
        schema: `max(${props.column.attribute})`,
        label: {
          ru: `Максимум (${props.column.label})`,
          en: `Max (${props.column.label})`
        }
      }
    ];

    this.state = {
      checked: props.checked,
      isOpen: false,
      selected: props.selected
    };
  }

  onChangeAggregationType = type => {
    this.setState({ selected: type }, () => {
      isFunction(this.props.onChangeAggregation) &&
        this.props.onChangeAggregation({
          aggregation: type,
          column: this.props.column
        });
    });
  };

  onCheckColumn = e => {
    this.setState({ checked: e.checked, selected: e.checked ? this.state.selected : null }, () => {
      isFunction(this.props.onChangeAggregation) &&
        this.props.onChangeAggregation({
          aggregation: this.state.selected,
          column: this.props.column
        });
    });
  };

  render() {
    const { column, titleField } = this.props;

    return (
      <>
        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cols={[
            <div className={'two-columns__left columns-setup__column_align '}>
              <i className="icon-custom-drag-big columns-setup__icon-drag" />
              <Checkbox checked={Boolean(this.state.selected)} onChange={this.onCheckColumn} />
              <span
                className="icon icon-settings"
                onClick={() => {
                  this.setState({ isOpen: true });
                }}
              />
              <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField]}</Label>
            </div>,

            <div style={{ display: 'flex', width: '100%', flexDirection: 'row', alignItems: 'center' }}>
              <Select
                disable={!this.state.checked}
                isClearable={true}
                options={this.aggregationTypes}
                getOptionLabel={option => getMLValue(option.label)}
                getOptionValue={option => option.schema}
                onChange={this.onChangeAggregationType}
                className={'select_narrow select_width_full'}
                placeholder={t('journals.default')}
                value={this.state.selected}
              />
              <span className="icon icon-delete" onClick={() => {}} />
            </div>
          ]}
        />
        <EcosModal
          isOpen={this.state.isOpen}
          isTopDivider
          isBigHeader
          className="ecos-modal_width-lg ecos-form-modal orgstructure-page-modal"
          title={`Filter: ${column.label}`}
        >
          <Filters columns={this.props.columns} />
        </EcosModal>
      </>
    );
  }
}

export default AggregationListItem;
