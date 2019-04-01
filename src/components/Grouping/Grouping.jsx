import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '../common/buttons/Button/Button';
import Label from '../common/form/Label/Label';
import List from '../common/List/List';
import Columns from '../common/templates/Columns/Columns';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';

import './Grouping.scss';

class ListItem extends Component {
  onClick = () => {
    const { onClick, item } = this.props;
    onClick(item);
  };

  render() {
    const { item, titleField } = this.props;
    return (
      <div className={'two-columns__left columns-setup__column_align '} onClick={this.onClick}>
        <i className="icon-drag columns-setup__icon-drag" />
        <Label className={'label_clear label_middle-grey columns-setup__next'}>{item[titleField]}</Label>
      </div>
    );
  }
}

export default class Grouping extends Component {
  constructor(props) {
    super(props);
    this.grouping = [];
  }

  onListClick = item => {
    this.grouping.push(item);
    this.triggerOnGrouping(this.grouping);
  };

  onGroupingClick = item => {
    const { valueField } = this.props;
    this.grouping = this.grouping.filter(groupingItem => groupingItem[valueField] !== item[valueField]);
    this.triggerOnGrouping(this.grouping);
  };

  triggerOnGrouping = grouping => {
    const { onGrouping } = this.props;
    if (typeof onGrouping === 'function') {
      onGrouping(grouping);
    }
  };

  getList = list => {
    const { titleField, grouping, valueField } = this.props;
    list = list.filter(item => !grouping.filter(groupingItem => groupingItem[valueField] === item[valueField])[0]);
    return list.map(item => <ListItem onClick={this.onListClick} item={item} titleField={titleField} />);
  };

  getGroupingList = grouping => {
    const { titleField } = this.props;
    return grouping.map(item => <ListItem onClick={this.onGroupingClick} item={item} titleField={titleField} />);
  };

  render() {
    const { list, className, grouping } = this.props;

    return (
      <div className={classNames('grouping', className)}>
        <div className={'grouping__toolbar'}>
          <Columns
            cols={[
              <Button className={'button_narrow button_text-grey button_full'}>{t('grouping.what')}</Button>,
              <Button className={'button_narrow button_text-grey button_full'}>{t('grouping.how')}</Button>
            ]}
          />
        </div>

        <div className={'grouping__content'}>
          <Columns
            cols={[
              <div className={'grouping__list'}>
                <Scrollbars style={{ height: '100%' }}>
                  <List className={'list-group_no-border'} list={this.getList(list)} />
                </Scrollbars>
              </div>,

              <div className={'grouping__target'}>
                <Scrollbars style={{ height: '100%' }}>
                  <List className={'list-group_no-border'} list={this.getGroupingList(grouping)} />
                </Scrollbars>
              </div>
            ]}
          />
        </div>
      </div>
    );
  }
}
