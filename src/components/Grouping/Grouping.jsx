import React, { Component } from 'react';
import classNames from 'classnames';
import Columns from '../common/templates/Columns/Columns';
import { Label } from '../common/form';
import { Dnd2List } from '../common/List';
import { t, trigger } from '../../helpers/util';

import './Grouping.scss';

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
      </div>
    );
  }
}
