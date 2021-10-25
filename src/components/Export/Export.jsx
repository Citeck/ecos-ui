import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import queryString from 'query-string';

import { UserConfigApi } from '../../api/userConfig';
import { URL } from '../../constants';
import { t } from '../../helpers/util';
import { decodeLink } from '../../helpers/urls';
import { Dropdown } from '../common/form';
import { TwoIcoBtn } from '../common/btns';
import { PREDICATE_AND } from '../Records/predicates/predicates';
import { convertAttributeValues } from '../Records/predicates/util';
import ParserPredicate from '../Filters/predicates/ParserPredicate';

import recordActions from '../Records/actions/recordActions';

import './Export.scss';

const api = new UserConfigApi();

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

  export = item => {
    if (item.target) {
      const { journalConfig, grid } = this.props;
      const query = this.getQuery(journalConfig, item.type, grid);

      this.textInput.current.value = JSON.stringify(query);

      const recordsQuery = {
        sourceId: journalConfig.sourceId,
        query: query.predicate,
        language: 'predicate',
        sortBy: query.sortBy
      };
      const action = {
        type: 'records-export',
        config: {
          exportType: query.reportType,
          columns: query.reportColumns,
          download: item.download
        }
      };

      recordActions.execForQuery(recordsQuery, action);
    } else if (typeof item.click === 'function') {
      item.click();
    }
  };

  getSearchPredicate = (grid = {}) => {
    const { search: text, columns, groupBy } = grid || {};

    if (isEmpty(text)) {
      return {};
    }

    return ParserPredicate.getSearchPredicates({ text, columns, groupBy });
  };

  getQuery = (config = {}, reportType, grid = {}) => {
    set(config, 'meta.createVariants', get(config, 'meta.createVariants') || []);

    const reportTitle = get(config, 'meta.createVariants[0].title') || get(config, 'meta.title');
    const columns = get(grid, 'columns') || config.columns || [];
    const reportColumns = columns
      .filter(c => c.default)
      .map(({ attribute, text, newType, newFormatter }) => ({
        attribute,
        name: text,
        type: newType,
        formatter: newFormatter
      }));
    const mainPredicate = get(config, 'predicate', {});
    const gridPredicate = get(grid, 'predicates[0]', {});
    const searchPredicate = get(grid, 'searchPredicate[0]') || this.getSearchPredicate(grid);
    const predicates = [mainPredicate, searchPredicate, gridPredicate];
    const cleanPredicate = ParserPredicate.removeEmptyPredicates([cloneDeep({ t: PREDICATE_AND, val: predicates })]);
    const predicate = convertAttributeValues(cleanPredicate, columns);
    const sortBy = get(grid, 'sortBy') || [{ attribute: '_created', ascending: false }];

    return {
      sortBy,
      predicate: get(predicate, '[0]', null),
      reportType,
      reportTitle,
      reportColumns
    };
  };

  getSelectionFilter = () => {
    const { journalConfig, grid } = this.props;
    const { columns } = journalConfig || {};
    const { groupBy, sortBy, pagination, predicates, search } = grid || {};

    return { columns, groupBy, sortBy, pagination, predicate: get(predicates, [0], {}), search };
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

    api.copyUrlConfig({ data, url });
  };

  render() {
    const { right, className, children, ...props } = this.props;
    const { isOpen } = this.state;
    const attributes = omit(props, ['selectedItems', 'journalConfig', 'dashletConfig', 'grid']);

    return (
      <div {...attributes} className={classNames('ecos-btn-export', className)}>
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
              icons={['icon-download', isOpen ? 'icon-small-up' : 'icon-small-down']}
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
