import React, { Component } from 'react';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';

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

    const customPredicate = isEmpty(props.column.customPredicate)
      ? ParserPredicate.parse(props.defaultPredicates, props.columns)
      : props.column.customPredicate;

    this.state = {
      checked: props.checked,
      isOpen: false,
      selected: props.selected,
      customLabel: props.column.label || {},
      customPredicate
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

  renderModalBody = () => {
    const { columns, defaultPredicates, metaRecord, column } = this.props;
    const { customPredicate } = this.state;

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
            columns={columns}
            needUpdate={false}
            className="ecos-ds-widget-settings__filter"
            groups={customPredicate}
            onChange={predicates => {
              this.setState({ customPredicate: ParserPredicate.parse(predicates, columns) });
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
                    customLabel: getMLValue(this.state.customLabel),
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
              <i className="icon-custom-drag-big columns-setup__icon-drag" />
              <Checkbox
                disabled={column.hasCustomField}
                checked={Boolean(this.state.selected) || column.hasCustomField}
                onChange={this.onCheckColumn}
              />
              <span
                className="icon icon-settings"
                onClick={() => {
                  this.setState({ isOpen: true });
                }}
              />
              <Label className={'label_clear label_middle-grey columns-setup__next'}>
                {getMLValue(this.state.customLabel) || column[titleField]}
              </Label>
            </div>,

            <div style={{ display: 'flex', width: '100%', flexDirection: 'row', alignItems: 'center' }}>
              <Select
                isDisabled={column.hasCustomField}
                isClearable={true}
                options={this.aggregationTypes}
                getOptionLabel={option => getMLValue(option.label)}
                getOptionValue={option => option.schema}
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
        <EcosModal
          metaRecord={metaRecord}
          isOpen={this.state.isOpen}
          isTopDivider
          isBigHeader
          className="ecos-modal_width-lg ecos-form-modal orgstructure-page-modal"
          title={`Filter: ${column.label}`}
          hideModal={() => this.setState({ isOpen: false })}
        >
          <Well className="ecos-journal__settings">
            {this.renderModalBody()}
            {this.renderModalButtons()}
          </Well>
        </EcosModal>
      </>
    );
  }
}

export default AggregationListItem;
