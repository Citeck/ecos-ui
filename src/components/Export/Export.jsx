import React, { Component } from 'react';
import classNames from 'classnames';
import omit from 'lodash/omit';
import { PROXY_URI } from '../../constants/alfresco';
import { Dropdown } from '../common/form';
import { TwoIcoBtn } from '../common/btns';
import { t } from '../../helpers/util';

import './Export.scss';

export default class ColumnsSetup extends Component {
  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.form = React.createRef();
  }

  export = item => {
    this.textInput.current.value = JSON.stringify(this.getQuery(this.props.config, item.type, this.props.grid));

    let form = this.form.current;

    form.action = `${PROXY_URI}report/criteria-report?download=${item.download}`;
    form.target = item.target;

    form.submit();
  };

  getQuery = (config, type, grid) => {
    grid = grid || {};
    config = config || {};
    config.meta = config.meta || {};
    config.meta.createVariants = config.meta.createVariants || [];

    const name = (config.meta.createVariants[0] || {}).title || config.meta.title;
    const reportColumns = (grid.columns || config.columns || [])
      .filter(c => c.default)
      .map(column => {
        return {
          attribute: column.attribute,
          title: column.text
        };
      });

    let query = {
      sortBy: [
        {
          attribute: 'cm:created',
          order: 'desc'
        }
      ],
      reportType: type,
      reportTitle: name,
      reportColumns: reportColumns,
      reportFilename: `${name}.${type}`
    };

    (config.meta.criteria || []).forEach((criterion, idx) => {
      query['field_' + idx] = criterion.field;
      query['predicate_' + idx] = criterion.predicate;
      query['value_' + idx] = criterion.value;
    });

    return query;
  };

  render() {
    const { right, ...props } = this.props;
    const cssClasses = classNames('export', props.className);
    const attributes = omit(props, ['config']);

    return (
      <div {...attributes} className={cssClasses}>
        <Dropdown
          menuClassName={right ? 'ecos-dropdown__menu_right' : ''}
          source={[
            { id: 0, title: t('export.list.html-read'), type: 'html', download: false, target: '_blank' },
            { id: 1, title: t('export.list.html-load'), type: 'html', download: true, target: '_self' },
            { id: 2, title: 'Excel', type: 'xlsx', download: true, target: '_self' },
            { id: 3, title: 'CSV', type: 'csv', download: true, target: '_self' }
          ]}
          value={0}
          valueField={'id'}
          titleField={'title'}
          isButton={true}
          onChange={this.export}
        >
          {props.children || (
            <TwoIcoBtn icons={['icon-load', 'icon-down']} className={'ecos-btn_grey ecos-btn_settings-down ecos-btn_x-step_10'} />
          )}
        </Dropdown>

        <form ref={this.form} id="export-form" action="" method="post" encType="multipart/form-data" target="">
          <input ref={this.textInput} type="hidden" name="jsondata" value="" />
        </form>
      </div>
    );
  }
}
