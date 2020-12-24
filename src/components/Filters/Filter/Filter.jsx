import React, { Component } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import { t, trigger } from '../../../helpers/util';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns/index';
import { Label, Select } from '../../common/form';
import { getPredicateInput, getPredicates } from '../../Records/predicates/predicates';
import ParserPredicate from '../predicates/ParserPredicate';

import './Filter.scss';

export default class Filter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: get(props, 'filter.predicate.val', ''),
      hasDataEntry: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const prevValue = get(prevProps, 'filter.predicate.val', '');
    const currentValue = get(this.props, 'filter.predicate.val', '');
    const { value, hasDataEntry } = this.state;

    if (hasDataEntry) {
      return;
    }

    if (prevValue !== currentValue || currentValue !== value) {
      this.setState({ value: currentValue });
    }
  }

  componentWillUnmount() {
    this.handleChangeValue.cancel();
  }

  predicatesWithoutValue = ParserPredicate.predicatesWithoutValue;

  changeValue = value => {
    this.setState({ value, hasDataEntry: true }, this.handleChangeValue);
  };

  handleChangeValue = debounce(() => {
    trigger.call(this, 'onChangeValue', { val: this.state.value, index: this.props.index });
    this.setState({ isInput: false });
  }, 350);

  changePredicate = predicate => {
    if (predicate.fixedValue !== undefined) {
      trigger.call(this, 'onChangePredicate', { predicate: predicate.value, index: this.props.index });
      this.changeValue(predicate.fixedValue);
      return;
    }

    if (this.predicatesWithoutValue.includes(predicate.value)) {
      this.changeValue('');
    }

    trigger.call(this, 'onChangePredicate', { predicate: predicate.value, index: this.props.index });
  };

  delete = () => {
    trigger.call(this, 'onDelete', this.props.index);
  };

  getSelectedPredicate = (predicates, predicate) => {
    return predicates.filter(p => p.value === predicate.t)[0] || predicates[0];
  };

  render() {
    const btnClasses = 'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height';
    const {
      className,
      children,
      filter: {
        meta: { column },
        predicate
      },
      sourceId,
      metaRecord
    } = this.props;
    const { value } = this.state;
    const predicates = getPredicates(column);
    const selectedPredicate = this.getSelectedPredicate(predicates, predicate);
    const predicateInput = getPredicateInput(column, sourceId, metaRecord, predicate);
    const predicateProps = predicateInput.getProps({
      predicateValue: value,
      changePredicateValue: this.changeValue,
      datePickerWrapperClasses: 'ecos-filter_width_full',
      selectClassName: 'select_width_full'
    });
    const FilterValueComponent = predicateInput.component;
    const isShow = !this.predicatesWithoutValue.includes(predicate.t) && get(selectedPredicate, 'needValue', true);

    return (
      <div className={classNames('ecos-filter', className)}>
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={[{ sm: 3 }, { sm: 4 }, { sm: 4 }, { sm: 1 }]}
          cols={[
            <Label title={column.text} className={'ecos-filter__label ecos-filter_step label_clear label_bold label_middle-grey'}>
              {column.text}
            </Label>,
            <Select
              className={'ecos-filter_step ecos-filter_font_12 select_narrow select_width_full'}
              placeholder={t('journals.default')}
              options={predicates}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              value={selectedPredicate}
              onChange={this.changePredicate}
            />,
            <div className={'ecos-filter__value-wrapper'}>{isShow && <FilterValueComponent {...predicateProps} />}</div>,
            <>
              <IcoBtn
                icon={'icon-delete'}
                className={classNames(btnClasses, 'ecos-btn_hover_t_red ecos-btn_x-step_10')}
                onClick={this.delete}
              />
              <i className={classNames('ecos-btn__i', 'ecos-btn__i_right icon-custom-drag-big ecos-filter__drag-ico')} />
            </>
          ]}
        />
      </div>
    );
  }
}
