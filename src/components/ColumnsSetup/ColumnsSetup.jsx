import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '../common/buttons/Button/Button';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';
import Label from '../common/form/Label/Label';
import List from '../common/List/List';
import Columns from '../common/templates/Columns/Columns';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';

import './ColumnsSetup.scss';

class ListItem extends Component {
  onClick = () => {
    const { onClick, row } = this.props;
    //onClick(row);
  };

  render() {
    const { row, titleField } = this.props;

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <i className="icon-drag columns-setup__icon-drag" />
            <Checkbox className={'columns-setup__next'} />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{row[titleField]}</Label>
          </div>,

          <Select className={'select_narrow select_width_full'} />
        ]}
      />
    );
  }
}

export default class ColumnsSetup extends Component {
  getList = rows => {
    const { titleField } = this.props;
    return rows.map(row => <ListItem row={row} titleField={titleField} />);
  };

  render() {
    const { rows } = this.props;

    const props = this.props;
    const cssClasses = classNames('columns-setup', props.className);
    const cssToolbarClasses = classNames('columns-setup__toolbar', props.classNameToolbar);

    return (
      <div className={cssClasses}>
        <div className={cssToolbarClasses}>
          <Columns
            cols={[
              <Button className={'button_narrow button_text-grey button_full'}>{t('columns-setup.order')}</Button>,
              <Button className={'button_narrow button_text-grey button_full'}>{t('columns-setup.sort')}</Button>
            ]}
          />
        </div>

        <div className={'columns-setup__content'}>
          <Scrollbars style={{ height: '100%' }}>
            <List className={'ecos-list-group_hover_off'} list={this.getList(rows)} />
          </Scrollbars>
        </div>
      </div>
    );
  }
}
