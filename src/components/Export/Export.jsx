import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import queryString from 'query-string';

import { UserConfigApi } from '../../api/userConfig';
import { URL } from '../../constants';
import { ALFRESCO, PROXY_URI } from '../../constants/alfresco';
import { t } from '../../helpers/util';
import { decodeLink } from '../../helpers/urls';
import { Dropdown } from '../common/form';
import { TwoIcoBtn } from '../common/btns';
import { PREDICATE_AND } from '../common/form/SelectJournal/predicates';
import ParserPredicate from '../Filters/predicates/ParserPredicate';

import './Export.scss';

const api = new UserConfigApi();

export default class Export extends Component {
  static propTypes = {
    className: PropTypes.string,
    dashletConfig: PropTypes.object,
    journalConfig: PropTypes.object,
    grid: PropTypes.object,
    right: PropTypes.bool
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

  get isShow() {
    const sourceId = get(this.props, 'journalConfig.sourceId') || '';
    const [first, second] = sourceId.split('/');

    return !second || first === ALFRESCO;
  }

  getStateOpen = isOpen => {
    this.setState({ isOpen });
  };

  export = item => {
    if (item.target) {
      const { journalConfig, grid } = this.props;
      const query = this.getQuery(journalConfig, item.type, grid);

      this.textInput.current.value = JSON.stringify(query);

      const form = this.form.current;

      form.action = `${PROXY_URI}report/predicate-report?download=${item.download}`;
      form.target = item.target;

      form.submit();
    } else if (typeof item.click === 'function') {
      item.click();
    }
  };

  getSearchPredicate = (grid = {}) => {
    const { search: text, columns, groupBy } = grid;

    if (isEmpty(text)) {
      return {};
    }

    return ParserPredicate.getSearchPredicates({ text, columns, groupBy });
  };

  getQuery = (config, type, grid) => {
    grid = grid || {};
    config = config || {};
    config.meta = config.meta || {};
    config.meta.createVariants = config.meta.createVariants || [];

    const name = (config.meta.createVariants[0] || {}).title || config.meta.title;
    const reportColumns = (grid.columns || config.columns || [])
      .filter(c => c.default)
      .map(column => ({ attribute: column.attribute, title: column.text }));
    const gridPredicate = get(grid, ['predicates', 0], {});
    const mainPredicate = get(grid, 'predicate', {});
    const searchPredicate = this.getSearchPredicate(grid);
    const predicates = [mainPredicate, searchPredicate, gridPredicate];
    const predicate = cloneDeep({ t: PREDICATE_AND, val: predicates });

    const query = {
      sortBy: grid.sortBy || [{ attribute: 'cm:created', order: 'desc' }],
      predicate: ParserPredicate.removeEmptyPredicates([predicate])[0] || null,
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

  getSelectionFilter = () => {
    const { columns } = this.props.journalConfig || {};
    const { groupBy, sortBy, pagination, predicates } = this.props.grid || {};

    return { columns, groupBy, sortBy, pagination, predicate: predicates[0] };
  };

  getSelectionUrl = () => {
    const { dashletConfig } = this.props;
    const { href, host } = window.location;

    if (dashletConfig) {
      const { journalId, journalsListId } = dashletConfig;

      return decodeLink(`${host}${URL.JOURNAL}?${queryString.stringify({ journalId, journalsListId })}`);
    }

    const objectUrl = queryString.parseUrl(href);
    const { journalId, journalsListId } = objectUrl.query;

    return `${objectUrl.url}?${queryString.stringify({ journalId, journalsListId })}`;
  };

  onCopyUrl = () => {
    const data = this.getSelectionFilter();
    const url = this.getSelectionUrl();

    api.copyUrlConfig({ data, url });
  };

  render() {
    const { right, className, children, ...props } = this.props;
    const { isOpen } = this.state;
    const attributes = omit(props, ['journalConfig', 'dashletConfig', 'grid']);

    return this.isShow ? (
      <div {...attributes} className={classNames('ecos-btn-export', className)}>
        <Dropdown
          source={this.dropdownSource}
          value={0}
          valueField={'id'}
          titleField={'title'}
          isButton={true}
          onChange={this.export}
          right={right}
          getStateOpen={this.getStateOpen}
        >
          {children || (
            <TwoIcoBtn
              icons={['icon-upload', isOpen ? 'icon-small-up' : 'icon-small-down']}
              className="ecos-btn_grey ecos-btn_settings-down ecos-btn_x-step_10"
            />
          )}
        </Dropdown>

        <form ref={this.form} method="post" encType="multipart/form-data">
          <input ref={this.textInput} type="hidden" name="jsondata" value="" />
        </form>
      </div>
    ) : null;
  }
}
