import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns/index';
import { Label, Select } from '../../common/form';
import { t, trigger } from '../../../helpers/util';
import { getPredicates, getPredicateInput } from '../../common/form/SelectJournal/predicates';

import './Filter.scss';

export default class Filter extends Component {
  changeValue = val => {
    trigger.call(this, 'onChangeValue', { val: val, index: this.props.index });
  };

  changePredicate = predicate => {
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
      sourceId
    } = this.props;
    const predicates = getPredicates(column);
    const selectedPredicate = this.getSelectedPredicate(predicates, predicate);
    const predicateInput = getPredicateInput(column, sourceId);
    const predicateProps = predicateInput.getProps({
      predicateValue: predicate.val,
      changePredicateValue: this.changeValue,
      datePickerWrapperClasses: 'ecos-filter_width_full',
      selectClassName: 'select_width_full'
    });
    const FilterValueComponent = predicateInput.component;

    return (
      <div className={classNames('ecos-filter', className)}>
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={[{ xl: 3 }, { xl: 4 }, { xl: 4 }, { xl: 1 }]}
          cols={[
            <Label className={'ecos-filter_step label_clear label_nowrap label_bold label_middle-grey'}>{column.text}</Label>,

            <Select
              className={'ecos-filter_step ecos-filter_font_12 select_narrow select_width_full'}
              placeholder={t('journals.default')}
              options={predicates}
              getOptionLabel={option => option.label}
              getOptionValue={option => option.value}
              value={selectedPredicate}
              onChange={this.changePredicate}
            />,

            <div className={'ecos-filter__value-wrapper'}>
              <FilterValueComponent {...predicateProps} />
            </div>,

            <Fragment>
              <IcoBtn
                icon={'icon-delete'}
                className={classNames(btnClasses, 'ecos-btn_hover_t_red ecos-btn_x-step_10')}
                onClick={this.delete}
              />

              <i className={classNames('ecos-btn__i', 'ecos-btn__i_right icon-drag ecos-filter__drag-ico')} />
            </Fragment>
          ]}
        />
      </div>
    );
  }
}
