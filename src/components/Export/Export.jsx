import React, { Component } from 'react';
import classNames from 'classnames';
import omit from 'lodash/omit';
import queryString from 'query-string';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { NotificationManager } from 'react-notifications';
import { PROXY_URI } from '../../constants/alfresco';
import { URL } from '../../constants';
import { Dropdown } from '../common/form';
import { TwoIcoBtn } from '../common/btns';
import { t } from '../../helpers/util';
import { decodeLink } from '../../helpers/urls';

import './Export.scss';

export default class ColumnsSetup extends Component {
  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.form = React.createRef();
  }

  export = item => {
    if (item.target) {
      this.textInput.current.value = JSON.stringify(this.getQuery(this.props.journalConfig, item.type, this.props.grid));

      let form = this.form.current;

      form.action = `${PROXY_URI}report/criteria-report?download=${item.download}`;
      form.target = item.target;

      form.submit();
    }
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

  getSelectionFilterUrl = () => {
    const {
      grid: { predicates = [] },
      dashletConfig
    } = this.props;
    const { search, host } = window.location;
    const urlParams = {
      ...queryString.parse(search),
      filter: '',
      journalSettingId: '',
      selectionFilter: predicates.length ? JSON.stringify(predicates[0]) : ''
    };

    return decodeLink(
      `${host}${URL.JOURNAL}?${queryString.stringify(
        dashletConfig ? { ...urlParams, journalId: dashletConfig.journalId, journalsListId: dashletConfig.journalsListId } : urlParams
      )}`
    );
  };

  onCopyUrl = () => {
    NotificationManager.success('', t('journals.action.to-buffer'), 3000);
  };

  render() {
    const { right, ...props } = this.props;
    const cssClasses = classNames('export', props.className);
    const attributes = omit(props, ['journalConfig', 'dashletConfig', 'grid']);

    return (
      <div {...attributes} className={cssClasses}>
        <Dropdown
          menuClassName={right ? 'ecos-dropdown__menu_right' : ''}
          source={[
            { id: 0, title: t('export.list.html-read'), type: 'html', download: false, target: '_blank' },
            { id: 1, title: t('export.list.html-load'), type: 'html', download: true, target: '_self' },
            { id: 2, title: 'Excel', type: 'xlsx', download: true, target: '_self' },
            { id: 3, title: 'CSV', type: 'csv', download: true, target: '_self' },
            {
              id: 4,
              title: (
                <CopyToClipboard text={this.getSelectionFilterUrl()} onCopy={this.onCopyUrl}>
                  <div>{t('journals.action.copy-link')}</div>
                </CopyToClipboard>
              )
            }
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

        <form ref={this.form} method="post" encType="multipart/form-data">
          <input ref={this.textInput} type="hidden" name="jsondata" value="" />
        </form>
      </div>
    );
  }
}
