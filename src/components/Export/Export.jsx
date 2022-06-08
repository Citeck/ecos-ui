import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import get from 'lodash/get';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import { instUserConfigApi as api } from '../../api/userConfig';
import { URL } from '../../constants';
import { t } from '../../helpers/util';
import { decodeLink } from '../../helpers/urls';
import { getIconUpDown } from '../../helpers/icon';
import JournalsConverter from '../../dto/journals';
import { Dropdown } from '../common/form';
import { TwoIcoBtn } from '../common/btns';
import ParserPredicate from '../Filters/predicates/ParserPredicate';
import recordActions from '../Records/actions/recordActions';
import RecordsExportAction from '../Records/actions/handler/executor/RecordsExport';
import journalsService from '../Journals/service/journalsService';

import './Export.scss';

export default class Export extends Component {
  static propTypes = {
    className: PropTypes.string,
    dashletConfig: PropTypes.object,
    journalConfig: PropTypes.object,
    grid: PropTypes.object,
    right: PropTypes.bool,
    selectedItems: PropTypes.array
  };

  static defaultProps = {
    className: ''
  };

  #actionsDoing = new Map();

  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.form = React.createRef();
  }

  state = {
    isOpen: false
  };

  get dropdownSource() {
    return [
      { id: 0, title: t('export-component.action.html-read'), type: 'html', download: false, target: '_blank' },
      { id: 1, title: t('export-component.action.html-load'), type: 'html', download: true, target: '_self' },
      { id: 2, title: 'Excel', type: 'xlsx', download: true, target: '_self' },
      { id: 3, title: 'CSV', type: 'csv', download: true, target: '_self' },
      { id: 4, title: t('export-component.action.copy-link'), click: this.onCopyUrl }
    ];
  }

  getStateOpen = isOpen => {
    this.setState({ isOpen });
  };

  export = async item => {
    if (this.#actionsDoing.get(item.id)) {
      return;
    }

    this.#actionsDoing.set(item.id, true);

    if (item.target) {
      const recordsQuery = await this.getQuery();
      const actionConfig = this.getActionConfig(item);
      const action = { type: RecordsExportAction.ACTION_ID, config: actionConfig };

      this.textInput.current.value = JSON.stringify(recordsQuery.query);

      await recordActions.execForQuery(recordsQuery, action);
    } else if (isFunction(item.click)) {
      await item.click();
    }

    this.#actionsDoing.delete(item.id);
  };

  getSearchPredicate = (grid = {}) => {
    const { search: text, columns, groupBy } = grid || {};

    if (isEmpty(text)) {
      return {};
    }

    return ParserPredicate.getSearchPredicates({ text, columns, groupBy });
  };

  getQuery = async () => {
    const { journalConfig, grid, dashletConfig, recordRef } = this.props;
    const settings = JournalsConverter.getSettingsForDataLoaderServer({
      ...grid,
      predicates: JournalsConverter.cleanUpPredicate(grid.predicates),
      onlyLinked: dashletConfig.onlyLinked,
      recordRef
    });
    const query = await journalsService.getRecordsQuery(journalConfig, settings);

    return query;
  };

  getActionConfig = item => {
    const { journalConfig, grid } = this.props;
    const cols = get(grid, 'columns') || journalConfig.columns || [];
    const columns = cols
      .filter(c => c.default)
      .map(({ attribute, text, newType, newFormatter }) => ({
        attribute,
        name: text,
        type: newType,
        formatter: newFormatter
      }));

    const reportTitle = get(journalConfig, 'meta.createVariants[0].title') || get(journalConfig, 'meta.title');

    return {
      exportType: item.type,
      columns,
      download: item.download,
      reportTitle
    };
  };

  getSelectionFilter = () => {
    const { columns } = this.props.journalConfig || {};
    const { groupBy, sortBy, pagination, predicates, search } = this.props.grid || {};

    return { columns, groupBy, sortBy, pagination, predicate: predicates[0], search };
  };

  getSelectionUrl = () => {
    const { dashletConfig, journalConfig } = this.props;
    const { href, host } = window.location;

    if (journalConfig) {
      const journalId = get(journalConfig, 'meta.nodeRef', get(dashletConfig, 'journalId'), '');

      return decodeLink(`${host}${URL.JOURNAL}?${queryString.stringify({ journalId })}`);
    }

    const objectUrl = queryString.parseUrl(href);
    const { journalId } = objectUrl.query;

    return `${objectUrl.url}?${queryString.stringify({ journalId })}`;
  };

  onCopyUrl = () => {
    const data = this.getSelectionFilter();
    const url = this.getSelectionUrl();

    if (!isEmpty(this.props.selectedItems)) {
      data.selectedItems = this.props.selectedItems;
    }

    return api.copyUrlConfig({ data, url });
  };

  render() {
    const { right, className, children, ...props } = this.props;
    const { isOpen } = this.state;
    const attributes = omit(props, ['selectedItems', 'journalConfig', 'dashletConfig', 'grid']);

    return (
      <div {...attributes} className={classNames('ecos-btn-export', { [className]: !!className })}>
        <Dropdown
          source={this.dropdownSource}
          value={0}
          valueField={'id'}
          titleField={'title'}
          isButton
          onChange={this.export}
          right={right}
          getStateOpen={this.getStateOpen}
        >
          {children || (
            <TwoIcoBtn
              icons={['icon-download', getIconUpDown(isOpen)]}
              className="ecos-btn_grey ecos-btn_settings-down ecos-btn_x-step_10"
            />
          )}
        </Dropdown>

        <form ref={this.form} method="post" encType="multipart/form-data">
          <input ref={this.textInput} type="hidden" name="jsondata" value="" />
        </form>
      </div>
    );
  }
}
