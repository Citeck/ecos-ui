import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { resetSearchAutocompleteItems, runSearchAutocompleteItems } from '../../actions/header';
import { isNewVersionPage } from '../../helpers/urls';
import { generateSearchTerm, getEnabledWorkspaces, isLastItem, t } from '../../helpers/util';
import PageService from '../../services/PageService';
import PageTabList from '../../services/pageTabs/PageTabList';
import SearchService from '../../services/search';
import { SearchSelect } from '../common';

import SearchItem from './SearchItem';

const Types = SearchService.SearchAutocompleteTypes;

const mapStateToProps = state => ({
  documents: state.header.search.documents,
  people: state.header.search.people,
  sites: state.header.search.sites,
  workspaces: state.header.search.workspaces,
  noResults: state.header.search.noResults,
  isLoading: state.header.search.isLoading,
  theme: state.view.theme
});

const mapDispatchToProps = dispatch => ({
  runSearchAutocomplete: payload => dispatch(runSearchAutocompleteItems(payload)),
  resetSearchAutocomplete: payload => dispatch(resetSearchAutocompleteItems(payload))
});

const setOutputParams = (array, type, hasAlfresco) => {
  return array.map((item, i) => {
    const res = SearchService.formatSearchAutocompleteResults(item, type, hasAlfresco);

    res.isLast = isLastItem(array, i);
    res.isAvatar = type === Types.PEOPLE;

    return res;
  });
};

class Search extends React.Component {
  static propTypes = {
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isMobile: false
  };

  state = {
    isFocused: false
  };

  _searchSelectRef = React.createRef();

  onSearch = searchText => {
    this.props.resetSearchAutocomplete();

    if (searchText) {
      this.props.runSearchAutocomplete(searchText);
    }
  };

  toggleFocus = isFocused => {
    this.setState({ isFocused });
  };

  openFullSearch = searchText => {
    const { searchPageUrl, hiddenSearchTerms } = this.props;
    let url = searchPageUrl || 'hdp/ws/faceted-search#searchTerm=' + generateSearchTerm(searchText, hiddenSearchTerms) + '&scope=repo';

    if (!isNewVersionPage()) {
      return (window.location.href = url);
    }

    const params = {};

    url += `&search=${generateSearchTerm(searchText, hiddenSearchTerms)}`;

    if (isNewVersionPage(url)) {
      params.openNewTab = true;
    } else {
      params.reopenBrowserTab = true;
    }

    PageService.changeUrlLink(url, params);
  };

  goToResult = data => {
    this.toggleFocus(false);

    if (!isNewVersionPage()) {
      return (window.location.href = data.url);
    }

    const reopenBrowserTab = !isNewVersionPage(data.url);
    const openNewTab = [Types.DOCUMENTS, Types.SITES, Types.PEOPLE, Types.WORKSPACES].includes(data.type) && !reopenBrowserTab;
    const onResetSearch = get(this._searchSelectRef, 'current.resetSearch');
    const needUpdateTabs = !!data.wsName && getEnabledWorkspaces();

    if (needUpdateTabs) {
      PageTabList.setLastActiveTabWs();
    }

    PageService.changeUrlLink(data.url, { openNewTab, reopenBrowserTab, needUpdateTabs });
    this.props.resetSearchAutocomplete();

    if (typeof onResetSearch === 'function') {
      onResetSearch();
    }
  };

  get searchResult() {
    const { documents, people, sites, workspaces, hasAlfresco } = this.props;
    const searchResult = [];

    if (!isEmpty(documents)) {
      searchResult.push({ groupName: t('header.search.documents') });
      searchResult.push(...setOutputParams(documents, Types.DOCUMENTS));
    }

    if (!isEmpty(people)) {
      searchResult.push({ groupName: t('header.search.people') });
      searchResult.push(...setOutputParams(people, Types.PEOPLE));
    }

    if (!isEmpty(sites)) {
      searchResult.push({ groupName: t('header.search.sites') });
      searchResult.push(...setOutputParams(sites, Types.SITES, hasAlfresco));
    }

    if (!isEmpty(workspaces) && getEnabledWorkspaces()) {
      searchResult.push({ groupName: t('header.search.workspaces') });
      searchResult.push(...setOutputParams(workspaces, Types.WORKSPACES));
    }

    return searchResult;
  }

  get formattedSearchResult() {
    const { noResults } = this.props;
    const searchResult = this.searchResult;

    return !noResults && !isEmpty(searchResult)
      ? searchResult.map((item, i, arr) => (
          <SearchItem key={`ecos-header-search-${i}`} data={item} onClick={this.goToResult} maxWidth={815} />
        ))
      : null;
  }

  render() {
    const { noResults, isMobile, theme, isLoading } = this.props;
    const { isFocused } = this.state;

    const classes = classNames('ecos-header-search', `ecos-header-search_theme_${theme}`, {
      'ecos-header-search_focused': isFocused,
      'ecos-header-search_mobile': isMobile
    });

    return (
      <SearchSelect
        ref={this._searchSelectRef}
        isLoading={isLoading}
        className={classes}
        onSearch={this.onSearch}
        openFullSearch={this.openFullSearch}
        theme={theme}
        formattedSearchResult={this.formattedSearchResult}
        autocomplete
        focused={isFocused}
        isMobile={isMobile}
        collapsed={isMobile}
        collapsible={isMobile}
        noResults={noResults}
        onToggleFocus={this.toggleFocus}
      />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Search);
