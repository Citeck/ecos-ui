import React, { Component } from 'react';
import classNames from 'classnames';
import Columns from '../common/templates/Columns/Columns';
import { Label } from '../common/form';
import { Dnd2List, List } from '../common/List';
import { Scrollbars } from 'react-custom-scrollbars';
import { t, trigger } from '../../helpers/util';

import './Grouping.scss';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';

class ListItem extends Component {
  render() {
    const { item, titleField } = this.props;
    return (
      <div className={'two-columns__left columns-setup__column_align '}>
        <i className="icon-drag columns-setup__icon-drag" />
        <Label className={'label_clear label_middle-grey columns-setup__next'}>{item[titleField]}</Label>
      </div>
    );
  }
}

class AggregationListItem extends Component {
  changeVisible = e => {
    this.props.column.default = e.checked;
    trigger.call(this, 'onChangeVisible', e);
  };

  changeSortBy = e => {
    trigger.call(this, 'onChangeSortBy', {
      ascending: e.value,
      attribute: this.props.column.attribute
    });
  };

  render() {
    const { column, titleField } = this.props;

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <Checkbox checked={column.default} onChange={this.changeVisible} />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField]}</Label>
          </div>,

          <Select
            options={[{ title: 'По возрастанию', value: true }, { title: 'По убыванию', value: false }]}
            getOptionLabel={option => option.title}
            getOptionValue={option => option.value}
            onChange={this.changeSortBy}
            className={'select_narrow select_width_full'}
            placeholder={t('journals.default')}
          />
        ]}
      />
    );
  }
}

export default class Grouping extends Component {
  onGrouping = state => {
    trigger.call(this, 'onGrouping', state.second);
  };

  getList = list => {
    const { grouping, valueField } = this.props;
    return list.filter(item => !grouping.filter(groupingItem => groupingItem[valueField] === item[valueField])[0]);
  };

  getListItem = item => {
    const { titleField } = this.props;
    return <ListItem item={item} titleField={titleField} />;
  };

  getAggregationList = () => {
    return this.props.list.map(column => (
      <AggregationListItem
        column={column}
        titleField={this.props.titleField}
        onChangeVisible={this.onChangeVisible}
        onChangeSortBy={this.onChangeSortBy}
      />
    ));
  };

  render() {
    const { list, className, grouping } = this.props;

    return (
      <div className={classNames('grouping', className)}>
        <div className={'grouping__toolbar'}>
          <Columns
            cols={[
              <span className={'grouping__desc'}>{t('grouping.what')}</span>,
              <span className={'grouping__desc'}>{t('grouping.how')}</span>
            ]}
          />
        </div>

        <div className={'grouping__content'}>
          <Dnd2List first={this.getList(list)} second={grouping} tpl={this.getListItem} onMove={this.onGrouping} />
        </div>

        <div className={'grouping__toolbar grouping__toolbar_aggregation'}>
          <Columns
            cols={[
              <span className={'grouping__desc'}>{t('aggregation.columns')}</span>,
              <span className={'grouping__desc'}>{t('aggregation.type')}</span>
            ]}
          />
        </div>

        <div className={'grouping__content grouping__content_aggregation'}>
          <Scrollbars style={{ height: '100%' }}>
            <List list={this.getAggregationList()} />
          </Scrollbars>
        </div>
      </div>
    );
  }
}
