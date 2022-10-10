import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import get from 'lodash/get';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import { NotificationManager } from 'react-notifications';

import { instUserConfigApi as api } from '../../api/userConfig';
import { URL } from '../../constants';
import { t } from '../../helpers/util';
import { decodeLink } from '../../helpers/urls';
import JournalsConverter from '../../dto/journals';
import recordActions from '../Records/actions/recordActions';
import RecordsExportAction from '../Records/actions/handler/executor/RecordsExport';
import journalsService from '../Journals/service/journalsService';
import { Dropdown } from '../common/form';

import './Export.scss';

export default class Export extends Component {
  static propTypes = {
    className: PropTypes.string,
    classNameBtn: PropTypes.string,
    recordRef: PropTypes.string,
    dashletConfig: PropTypes.object,
    journalConfig: PropTypes.object,
    grid: PropTypes.object,
    right: PropTypes.bool,
    selectedItems: PropTypes.array
  };

  static defaultProps = {
    className: '',
    dashletConfig: {}
  };

  #actionsDoing = new Map();

  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.form = React.createRef();
  }

  get dropdownSource() {
    return [
      { id: 0, title: t('export-component.action.html-read'), type: 'html', download: false, target: '_blank' },
      { id: 1, title: t('export-component.action.html-load'), type: 'html', download: true, target: '_self' },
      { id: 2, title: 'Excel', type: 'xlsx', download: true, target: '_self' },
      { id: 3, title: 'CSV', type: 'csv', download: true, target: '_self' },
      { id: 4, title: t('export-component.action.copy-link'), click: this.handleCopyUrl }
    ];
  }

  handleExport = async item => {
    if (this.#actionsDoing.get(item.id)) {
      NotificationManager.warning(t('ecos-form.export.attention'));
      return;
    }

    this.#actionsDoing.set(item.id, true);

    if (item.target) {
      const { journalConfig } = this.props;
      const recordsQuery = await journalsService.getRecordsQuery(journalConfig, this.getJSettings());
      const actionConfig = this.getActionConfig(item);
      const action = recordActions.getActionInfo({ type: RecordsExportAction.ACTION_ID, config: actionConfig });

      this.textInput.current.value = JSON.stringify(recordsQuery.query);

      await recordActions.execForQuery(recordsQuery, action);
    } else if (isFunction(item.click)) {
      await item.click();
    }

    this.#actionsDoing.delete(item.id);
  };

  handleCopyUrl = async () => {
    const data = await this.getSelectionFilter();
    const url = this.getSelectionUrl();

    if (!isEmpty(this.props.selectedItems)) {
      data.selectedItems = this.props.selectedItems;
    }

    return api.copyUrlConfig({ data, url });
  };

  getJSettings = () => {
    const { grid, dashletConfig, recordRef } = this.props;

    return JournalsConverter.getSettingsForDataLoaderServer({
      ...grid,
      predicates: JournalsConverter.cleanUpPredicate(grid.predicates),
      onlyLinked: get(dashletConfig, 'onlyLinked'),
      recordRef
    });
  };

  getActionConfig = item => {
    const { journalConfig, grid } = this.props;
    const cols = get(grid, 'columns') || journalConfig.columns || [];
    const columns = cols
      .filter(c => c.default)
      .map(({ attribute, text, newType, newFormatter, multiple }) => ({
        attribute,
        name: text,
        type: newType,
        formatter: newFormatter,
        multiple: multiple
      }));

    const reportTitle = get(journalConfig, 'meta.createVariants[0].title') || get(journalConfig, 'meta.title');

    return {
      exportType: item.type,
      columns,
      title: item.title,
      download: item.download,
      reportTitle
    };
  };

  getSelectionFilter = async () => {
    const { grid, journalConfig } = this.props;
    const { columns } = journalConfig || {};
    const { groupBy, sortBy, pagination, search } = grid || {};
    const predicate = await journalsService.getPredicates(journalConfig, this.getJSettings());

    return { columns, groupBy, sortBy, pagination, predicate, search };
  };

  getSelectionUrl = () => {
    const { dashletConfig, journalConfig } = this.props;
    const { href, host } = window.location;

    if (journalConfig) {
      const journalId = get(journalConfig, 'meta.nodeRef', get(dashletConfig, 'journalId')) || '';

      return decodeLink(`${host}${URL.JOURNAL}?${queryString.stringify({ journalId })}`);
    }

    const objectUrl = queryString.parseUrl(href);
    const { journalId, url } = objectUrl.query;

    return `${url}?${queryString.stringify({ journalId })}`;
  };

  render() {
    const { right, className, children, classNameBtn, ...props } = this.props;
    const attributes = omit(props, ['selectedItems', 'journalConfig', 'dashletConfig', 'grid', 'recordRef']);

    return (
      <div {...attributes} className={classNames('ecos-btn-export', { [className]: !!className })}>
        <Dropdown
          isButton
          hasEmpty
          isStatic={!children}
          right={right}
          source={this.dropdownSource}
          valueField={'id'}
          titleField={'title'}
          controlIcon="icon-download"
          controlClassName={classNames('ecos-btn_grey ecos-btn_settings-down', classNameBtn)}
          onChange={this.handleExport}
        >
          {children}
        </Dropdown>

        <form ref={this.form} method="post" encType="multipart/form-data">
          <input ref={this.textInput} type="hidden" name="jsondata" value="" />
        </form>
      </div>
    );
  }
}
