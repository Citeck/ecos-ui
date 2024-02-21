import React, { Component } from 'react';
import isFunction from 'lodash/isFunction';
import get from 'lodash/get';

import Columns from '../common/templates/Columns/Columns';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';
import { Label, MLText, Well } from '../common/form';
import { EcosModal } from '../common';
import { getMLValue, t } from '../../helpers/util';
import { Filters } from '../Filters';
import { Btn } from '../common/btns';
import { Labels } from '../common/form/SelectJournal/constants';
import { ParserPredicate } from '../Filters/predicates';

class AggregationListItem extends Component {
  constructor(props) {
    super(props);

    const { checked, selected, column, defaultPredicates } = props;
    const customPredicate = column.hasCustomField ? get(column, 'customPredicate', null) : null;
    const groups = ParserPredicate.parse(get(column, 'customPredicate', defaultPredicates), props.columns);

    this.state = {
      isOpen: false,
      checked,
      selected,
      customLabel: column.label || {},
      groups,
      customPredicate
    };
  }

  get aggregationTypes() {
    const { column } = this.props;

    const label = get(column, 'label', '');

    const defaultAggregationType = {
      attribute: column.hasCustomField ? column.attribute : `_${column.attribute}`,
      text: column.label,
      column: column.attribute,
      sortable: column.sortable,
      type: 'NUMBER',
      newFormatter: column.newFormatter || {
        type: 'number'
      },
      newEditor: column.newEditor
    };

    return [
      {
        ...defaultAggregationType,
        schema: `sum(${column.attribute})`,
        name: column.hasCustomField ? column.attribute : `_${column.attribute}`,
        originSchema: column.originAttribute ? `sum(${column.originAttribute})` : null,
        schemaName: { ru: 'Сумма', en: 'Sum' },
        label: {
          ru: `Сумма (${label['ru'] || label})`,
          en: `Sum (${label['en'] || label})`
        }
      },
      {
        ...defaultAggregationType,
        schema: `avg(${column.attribute})`,
        name: column.hasCustomField ? column.attribute : `_${column.attribute}`,
        originSchema: column.originAttribute ? `avg(${column.originAttribute})` : null,
        schemaName: { ru: 'Среднее', en: 'Average' },
        label: {
          ru: `Среднее (${label['ru'] || label})`,
          en: `Average (${label['en'] || label})`
        }
      },
      {
        ...defaultAggregationType,
        schema: `min(${column.attribute})`,
        name: column.hasCustomField ? column.attribute : `_${column.attribute}`,
        originSchema: column.originAttribute ? `min(${column.originAttribute})` : null,
        schemaName: { ru: 'Минимум', en: 'Min' },
        label: {
          ru: `Минимум (${label['ru'] || label})`,
          en: `Min (${label['en'] || label})`
        }
      },
      {
        ...defaultAggregationType,
        schema: `max(${column.attribute})`,
        name: column.hasCustomField ? column.attribute : `_${column.attribute}`,
        originSchema: column.originAttribute ? `sum(${column.originAttribute})` : null,
        schemaName: { ru: 'Максимум', en: 'Max' },
        label: {
          ru: `Максимум (${label['ru'] || label})`,
          en: `Max (${label['en'] || label})`
        }
      }
    ];
  }

  onChangeAggregationType = type => {
    const { column } = this.props;

    let aggregation = { ...column, ...type };

    if (column.hasCustomField) {
      aggregation = {
        ...aggregation,
        schema: column.attribute,
        label: this.state.customLabel,
        text: getMLValue(this.state.customLabel),
        value: column.attribute
      };
    }

    this.setState({ selected: aggregation }, () => {
      isFunction(this.props.onChangeAggregation) &&
        this.props.onChangeAggregation({
          aggregation: aggregation,
          column: this.state.selected
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

  renderModalBody = () => {
    const { columns, defaultPredicates, metaRecord, column } = this.props;
    const { groups } = this.state;

    return (
      <>
        <Label className="ecos-field-col__title ecos-field-col__title_full_width">
          {'Column name'}
          <MLText value={this.state.customLabel} onChange={value => this.setState({ customLabel: value })} />
        </Label>
        {column.hasCustomField && (
          <Filters
            metaRecord={metaRecord}
            predicate={defaultPredicates}
            columns={columns.filter(i => i.attribute !== column.originAttribute)}
            className="ecos-ds-widget-settings__filter"
            groups={groups}
            onChange={customPredicate => {
              this.setState({
                customPredicate,
                groups: ParserPredicate.parse(customPredicate, columns)
              });
            }}
          />
        )}
      </>
    );
  };

  renderModalButtons = () => {
    const { aggregations, column } = this.props;

    return (
      <div className="select-journal-select-modal__buttons">
        <div className="select-journal-select-modal__buttons-space" />
        <Btn className="select-journal-select-modal__buttons-cancel" onClick={() => this.setState({ isOpen: false })}>
          {t(Labels.CANCEL_BUTTON)}
        </Btn>
        <Btn
          className="ecos-btn_blue select-journal-select-modal__buttons-ok"
          onClick={() => {
            this.setState({ isOpen: false }, () => {
              const aggregation = aggregations.find(i => column.column === i.column);

              isFunction(this.props.onChangeAggregation) &&
                aggregation &&
                this.props.onChangeAggregation({
                  aggregation: {
                    ...aggregation,
                    label: this.state.customLabel || aggregation.label,
                    customLabel: this.state.customLabel,
                    customPredicate: this.state.customPredicate
                  },
                  column: this.props.column
                });
            });
          }}
        >
          {t(Labels.SAVE_BUTTON)}
        </Btn>
      </div>
    );
  };

  render() {
    const { column, titleField, metaRecord } = this.props;

    return (
      <>
        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cols={[
            <div className={'two-columns__left columns-setup__column_align '}>
              {column.hasCustomField ? (
                <i className="icon-custom-drag-big columns-setup__icon-drag" />
              ) : (
                <i className="icon-custom-drag-big columns-setup__icon-drag columns-setup__icon-drag__disabled" />
              )}
              <Checkbox
                disabled={column.hasCustomField}
                checked={Boolean(this.state.selected) || column.hasCustomField}
                onChange={this.onCheckColumn}
              />
              {column.hasCustomField && (
                <span
                  className="icon icon-settings"
                  onClick={() => {
                    this.setState({ isOpen: true });
                  }}
                />
              )}
              <Label className={'label_clear label_middle-grey columns-setup__next'}>
                {getMLValue(this.state.customLabel) || column[titleField]}
              </Label>
              {column.hasCustomField && (
                <Label className={'label_clear label_light-grey columns-placeholder__next'}>
                  {`(${getMLValue(column.originColumn.label)})`}
                </Label>
              )}
            </div>,

            <div style={{ display: 'flex', width: '100%', flexDirection: 'row', alignItems: 'center' }}>
              <Select
                options={this.aggregationTypes}
                getOptionLabel={option => (option.schemaName ? getMLValue(option.schemaName) : getMLValue(option.label))}
                getOptionValue={option => (column.hasCustomField ? option.originSchema : option.schema)}
                onChange={this.onChangeAggregationType}
                className={'select_narrow select_width_full'}
                placeholder={t('journals.default')}
                value={this.state.selected}
              />
              {column.hasCustomField && (
                <span
                  className="icon icon-delete"
                  onClick={() => {
                    this.setState({ checked: false, selected: null }, () => {
                      isFunction(this.props.onChangeAggregation) && this.props.onDeleteAggregation(this.props.column.column);
                    });
                  }}
                />
              )}
            </div>
          ]}
        />
        {column.hasCustomField && (
          <EcosModal
            metaRecord={metaRecord}
            isOpen={this.state.isOpen}
            isTopDivider
            isBigHeader
            className="ecos-modal_width-lg ecos-form-modal orgstructure-page-modal"
            title={`${t('grouping.modal_title')} ${getMLValue(get(column, 'originColumn.label'))}`}
            hideModal={() => this.setState({ isOpen: false })}
          >
            <Well className="ecos-journal__settings">
              {this.renderModalBody()}
              {this.renderModalButtons()}
            </Well>
          </EcosModal>
        )}
      </>
    );
  }
}

export default AggregationListItem;
