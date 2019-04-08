import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns/index';
import { Label, Select, Input } from '../../common/form';
import { t, trigger } from '../../../helpers/util';

import './Filter.scss';

export default class Filter extends Component {
  constructor(props) {
    super(props);
    this.state = { val: props.predicate.val };
  }

  changeValue = e => {
    let { index, predicate } = this.props;
    const val = e.target.value;

    this.setState({ val });

    trigger.call(this, 'onChange', {
      predicate: { ...predicate, val },
      index
    });
  };

  changeCriterion = t => {
    let { index, predicate } = this.props;

    trigger.call(this, 'onChange', {
      predicate: {
        ...predicate,
        t: t.value
      },
      index
    });
  };

  delete = () => {
    trigger.call(this, 'onDelete', this.props.index);
  };

  render() {
    const { className, predicate, children } = this.props;
    const btnClasses =
      'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height ecos-btn_hover_t-light-blue';

    return (
      <div className={classNames('ecos-filter', className)}>
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={[{ xl: 2 }, { xl: 9 }, { xl: 1 }]}
          cols={[
            <Label className={'ecos-filter_step label_clear label_nowrap label_bold label_middle-grey'}>{predicate.att}</Label>,

            <Fragment>
              <Select
                className={'ecos-filter_step select_narrow select_width_full'}
                placeholder={t('journals.default')}
                onChange={this.changeCriterion}
              />
              <Input className={'ecos-input_narrow'} value={this.state.val} onChange={this.changeValue} />
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
