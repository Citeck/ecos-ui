import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import React, { Component } from 'react';

import ListItem from '../Journals/JournalsPresets/ListItem';
import { Labels } from '../Journals/constants';
import journalsService from '../Journals/service/journalsService';
import RecordsExportAction from '../Records/actions/handler/executor/RecordsExport';
import recordActions from '../Records/actions/recordActions';
import { CollapsibleList } from '../common';
import { Dropdown, Well } from '../common/form';

import { instUserConfigApi as api } from '@/api/userConfig';
import { URL } from '@/constants';
import JournalsConverter from '@/dto/journals';
import { decodeLink } from '@/helpers/urls';
import { getTextByLocale, t } from '@/helpers/util';
import ConfigService, { ALFRESCO_ENABLED } from '@/services/config/ConfigService';
import LicenseService from '@/services/license/LicenseService';
import { NotificationManager } from '@/services/notifications';

import './Export.scss';

export default class Export extends Component {
  static propTypes = {
    className: PropTypes.string,
    classNameBtn: PropTypes.string,
    recordRef: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    dashletConfig: PropTypes.object,
    journalConfig: PropTypes.object,
    grid: PropTypes.object,
    isViewNewJournal: PropTypes.bool,
    isMobile: PropTypes.bool,
    loading: PropTypes.bool,
    right: PropTypes.bool,
    selectedItems: PropTypes.array,
    getStateOpen: PropTypes.func
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

    this.state = {
      isOpenDropdown: false,
      hasAlfresco: false,
      hasGroupActionsLicense: false
    };
  }

  componentDidMount() {
    ConfigService.getValue(ALFRESCO_ENABLED).then(value => {
      this.setState({
        hasAlfresco: value
      });
    });
    LicenseService.hasGroupActionsFeature().then(hasFeature => {
      if (hasFeature) {
        this.setState({
          hasGroupActionsLicense: true
        });
      }
    });
  }

  dropdownSourceVariants(hasAlfresco, hasGroupActionsLicense) {
    const variants = [];
    if (hasAlfresco || hasGroupActionsLicense) {
      variants.push({ id: 0, title: t('export-component.action.html-read'), type: 'html', download: false, target: '_blank' });
      variants.push({ id: 1, title: t('export-component.action.html-load'), type: 'html', download: true, target: '_self' });
      variants.push({ id: 2, title: 'Excel', type: 'xlsx', download: true, target: '_self' });
      variants.push({ id: 3, title: 'CSV', type: 'csv', download: true, target: '_self' });
    }
    variants.push({ id: 4, title: t('export-component.action.copy-link'), click: this.handleCopyUrl });

    return variants;
  }

  handleItem = item => {
    return {
      ...item,
      id: `export-${get(item, 'id', '')}`,
      displayName: get(item, 'title', '')
    };
  };

  get renderList() {
    const { hasAlfresco, hasGroupActionsLicense } = this.state;

    return (this.dropdownSourceVariants(hasAlfresco, hasGroupActionsLicense) || []).map(item => (
      <ListItem key={get(item, 'id')} onClick={() => this.handleExport(item)} item={this.handleItem(item)} />
    ));
  }

  handleExport = async item => {
    if (this.#actionsDoing.get(item.id)) {
      NotificationManager.warning(t('ecos-form.export.attention'));
      return;
    }

    this.#actionsDoing.set(item.id, true);

    if (item.target) {
      const { journalConfig, grid } = this.props;
      const recordsQuery = await journalsService.getRecordsQuery(journalConfig, this.getJSettings());
      const actionConfig = this.getActionConfig(item);
      const action = recordActions.getActionInfo({ type: RecordsExportAction.ACTION_ID, config: actionConfig });

      this.textInput.current.value = JSON.stringify(recordsQuery.query);

      const actionContext = {
        journalColumns: get(grid, 'columns', []),
        journalName: getTextByLocale(get(journalConfig, 'name')),
        journalId: get(grid, 'journalId')
      };

      await recordActions.execForQuery(recordsQuery, action, actionContext);
    } else if (isFunction(item.click)) {
      await item.click();
    }

    this.#actionsDoing.delete(item.id);
  };

  handleCopyUrl = async () => {
    const data = this.getSelectionFilter();
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

    const journalName = get(journalConfig, 'meta.title') || '';
    const reportTitle = get(journalConfig, 'meta.createVariants[0].title') || journalName;

    return {
      exportType: item.type,
      columns,
      title: item.title,
      download: item.download,
      reportTitle,
      journalName
    };
  };

  getSelectionFilter = () => {
    const { grid, journalConfig, journalSetting } = this.props;
    const { columns } = journalConfig || {};
    const { predicate } = journalSetting || {};
    const { groupBy, sortBy, pagination, search, grouping } = grid || {};

    return { columns, groupBy, sortBy, pagination, predicate, search, grouping };
  };

  getSelectionUrl = () => {
    const { dashletConfig, journalConfig } = this.props;
    const { href, host, protocol } = window.location;

    if (journalConfig) {
      const journalId = get(journalConfig, 'meta.nodeRef', get(dashletConfig, 'journalId')) || '';

      return decodeLink(`${protocol}//${host}${URL.JOURNAL}?${queryString.stringify({ journalId })}`);
    }

    const objectUrl = queryString.parseUrl(href);
    const { journalId, url } = objectUrl.query;

    return `${url}?${queryString.stringify({ journalId })}`;
  };

  changeIsOpen = isOpenDropdown => {
    if (isBoolean(isOpenDropdown)) {
      this.setState({ isOpenDropdown });
      isFunction(this.props.getStateOpen) && this.props.getStateOpen(isOpenDropdown);
    }
  };

  render() {
    const { hasAlfresco, hasGroupActionsLicense, isOpenDropdown } = this.state;
    const { right, className, children, classNameBtn, isMobile, isViewNewJournal, loading, ...props } = this.props;
    const attributes = omit(props, [
      'selectedItems',
      'journalConfig',
      'dashletConfig',
      'grid',
      'recordRef',
      'getStateOpen',
      'journalSetting'
    ]);

    if (isMobile && isViewNewJournal) {
      return (
        <Well className="ecos-journal-menu__presets">
          <CollapsibleList
            loading={loading}
            needScrollbar={false}
            className="ecos-journal-menu__collapsible-list"
            classNameList="ecos-list-group_mode_journal"
            list={this.renderList}
            emptyText={t(Labels.Menu.EMPTY_LIST)}
            selected={false}
          >
            {t('journals.bar.btn.export')}
          </CollapsibleList>
        </Well>
      );
    }

    return (
      <div {...attributes} className={classNames('ecos-btn-export', { [className]: !!className })}>
        <Dropdown
          isButton
          hasEmpty
          isStatic={!children}
          right={right}
          source={this.dropdownSourceVariants(hasAlfresco, hasGroupActionsLicense)}
          valueField={'id'}
          titleField={'title'}
          controlIcon="icon-download"
          controlClassName={classNames('ecos-btn_grey ecos-btn_settings-down', classNameBtn, {
            'ecos-journal__btn_new_focus': isOpenDropdown && isViewNewJournal
          })}
          onChange={this.handleExport}
          getStateOpen={this.changeIsOpen}
          isViewNewJournal={isViewNewJournal}
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
