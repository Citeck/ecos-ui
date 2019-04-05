import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import Columns from '../../common/templates/Columns/Columns';
import { IcoBtn } from '../../common/btns/index';
import { Label, Select } from '../../common/form/index';
import { t } from '../../../helpers/util';

import './Filter.scss';

export default class Filter extends Component {
  render() {
    const { className, label, children } = this.props;
    const btnClasses =
      'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height ecos-btn_hover_t-light-blue';

    return (
      <div className={classNames('ecos-filter', className)}>
        {children}

        <Columns
          classNamesColumn={'columns_height_full columns-setup__column_align'}
          cfgs={[{ xl: 2 }, { xl: 9 }, { xl: 1 }]}
          cols={[
            <Label className={'ecos-filter_step label_clear label_nowrap label_bold label_middle-grey'}>{label}</Label>,

            <Fragment>
              <Select className={'ecos-filter_step select_narrow select_width_full'} placeholder={t('journals.default')} />
              <Select className={'select_narrow select_width_full'} placeholder={t('journals.default')} />
            </Fragment>,

            <Fragment>
              <IcoBtn icon={'icon-delete'} className={btnClasses} />
              <IcoBtn icon={'icon-drag'} className={btnClasses} />
            </Fragment>
          ]}
        />
      </div>
    );
  }
}
