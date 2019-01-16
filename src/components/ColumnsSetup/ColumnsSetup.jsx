import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '../common/buttons/Button/Button';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';
import Label from '../common/form/Label/Label';
import List from '../common/List/List';
import Columns from '../common/templates/Columns/Columns';

import './ColumnsSetup.scss';

export default class ColumnsSetup extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('columns-setup', props.className);

    return (
      <div {...props} className={cssClasses}>
        <div className={'columns-setup__toolbar'}>
          <Columns
            cols={[
              <Button className={'button_narrow button_text-grey button_full'}>Порядок и отображение колонк</Button>,

              <Button className={'button_narrow button_text-grey button_full'}>Сортировка в колонке</Button>
            ]}
          />
        </div>

        <div className={'columns-setup__content'}>
          <List
            list={[
              <Columns
                cols={[
                  <div className={'two-columns__left columns-setup__column_align '}>
                    <i className="icon-drag columns-setup__icon-drag" />
                    <Checkbox className={'columns-setup__next'} />
                    <Label className={'label_clear label_middle-grey columns-setup__next'}>Дата создания</Label>
                  </div>,

                  <Select className={'select_narrow'} />
                ]}
              />,

              <Columns
                cols={[
                  <div className={'two-columns__left columns-setup__column_align '}>
                    <i className="icon-drag columns-setup__icon-drag" />
                    <Checkbox className={'columns-setup__next'} />
                    <Label className={'label_clear label_middle-grey columns-setup__next'}>Номер договора</Label>
                  </div>,

                  <Select className={'select_narrow'} />
                ]}
              />,

              <Columns
                cols={[
                  <div className={'two-columns__left columns-setup__column_align '}>
                    <i className="icon-drag columns-setup__icon-drag" />
                    <Checkbox className={'columns-setup__next'} />
                    <Label className={'label_clear label_middle-grey columns-setup__next'}>Контрагент</Label>
                  </div>,

                  <Select className={'select_narrow'} />
                ]}
              />,

              <Columns
                cols={[
                  <div className={'two-columns__left columns-setup__column_align '}>
                    <i className="icon-drag columns-setup__icon-drag" />
                    <Checkbox className={'columns-setup__next'} />
                    <Label className={'label_clear label_middle-grey columns-setup__next'}>Статус</Label>
                  </div>,

                  <Select className={'select_narrow'} />
                ]}
              />
            ]}
          />
        </div>
      </div>
    );
  }
}
