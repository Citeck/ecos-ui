import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns/index';
import { Label, Select, Input } from '../../common/form';
import { ParserPredicate } from '../predicates';
import { t, trigger } from '../../../helpers/util';

import './Filter.scss';
import { getPredicates } from '../../common/form/SelectJournal/predicates';

export default class Filter extends Component {
  constructor(props) {
    super(props);

    const {
      filter: {
        meta: { column },
        predicate
      }
    } = this.props;
    const conditions = getPredicates(column);

    this.state = {
      conditions,
      val: predicate.val,
      selectedCondition: this.getSelectedCondition(conditions, predicate)
    };
  }

  changeValue = e => {
    const val = e.target.value;
    let {
      index,
      filter: { predicate }
    } = this.props;
    this.setState({ val });

    trigger.call(this, 'onChange', {
      predicate: ParserPredicate.createPredicate({ att: predicate.att, t: this.state.selectedCondition.value, val }),
      index
    });
  };

  changeCondition = selectedCondition => {
    let {
      index,
      filter: { predicate }
    } = this.props;
    this.setState({ selectedCondition });

    trigger.call(this, 'onChange', {
      predicate: ParserPredicate.createPredicate({ att: predicate.att, t: selectedCondition.value, val: this.state.val }),
      index
    });
  };

  delete = () => {
    trigger.call(this, 'onDelete', this.props.index);
  };

  getSelectedCondition = (conditions, predicate) => {
    return conditions.filter(condition => condition.value === predicate.t)[0] || conditions[0];
  };

  render() {
    const { conditions, selectedCondition } = this.state;
    const {
      className,
      children,
      filter: {
        meta: { column }
      }
    } = this.props;
    const btnClasses =
      'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height ecos-btn_hover_t-light-blue';

    return (
      <div className={classNames('ecos-filter', className)}>
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={[{ xl: 2 }, { xl: 9 }, { xl: 1 }]}
          cols={[
            <Label className={'ecos-filter_step label_clear label_nowrap label_bold label_middle-grey'}>{column.text}</Label>,

            <Fragment>
              <Select
                className={'ecos-filter_step ecos-filter_font_12 select_narrow select_width_full'}
                placeholder={t('journals.default')}
                options={conditions}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                value={selectedCondition}
                onChange={this.changeCondition}
              />
              <Input className={'ecos-input_narrow ecos-filter_font_12'} value={this.state.val} onChange={this.changeValue} />
            </Fragment>,

            <Fragment>
              <IcoBtn icon={'icon-delete'} className={btnClasses} onClick={this.delete} />
              <IcoBtn icon={'icon-drag'} className={btnClasses} />
            </Fragment>
          ]}
        />
      </div>
    );
  }
}
