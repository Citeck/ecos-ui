import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '../common/buttons/Button/Button';
import Label from '../common/form/Label/Label';
import List from '../common/List/List';
import Columns from '../common/templates/Columns/Columns';

import './Grouping.scss';

export default class ColumnsSetup extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('grouping', props.className);

    return (
      <div {...props} className={cssClasses}>
        <div className={'grouping__toolbar'}>
          <Columns
            cols={[
              <Button className={'button_narrow button_text-grey button_full'}>Что группировать</Button>,

              <Button className={'button_narrow button_text-grey button_full'}>Как группировать</Button>
            ]}
          />
        </div>

        <div className={'grouping__content'}>
          <Columns
            cols={[
              <div className={'grouping__list'}>
                <List
                  className={'list-group_no-border'}
                  list={[
                    <div className={'two-columns__left columns-setup__column_align '}>
                      <i className="icon-drag columns-setup__icon-drag" />
                      <Label className={'label_clear label_middle-grey columns-setup__next'}>Дата создания</Label>
                    </div>,

                    <div className={'two-columns__left columns-setup__column_align '}>
                      <i className="icon-drag columns-setup__icon-drag" />
                      <Label className={'label_clear label_middle-grey columns-setup__next'}>Контрагент</Label>
                    </div>,

                    <div className={'two-columns__left columns-setup__column_align '}>
                      <i className="icon-drag columns-setup__icon-drag" />
                      <Label className={'label_clear label_middle-grey columns-setup__next'}>Статус</Label>
                    </div>
                  ]}
                />
              </div>,

              <div className={'grouping__target'}>
                <div className={'grouping__target-note'}>{'Посмотреть принцип действия группировки'}</div>
              </div>
            ]}
          />
        </div>
      </div>
    );
  }
}
