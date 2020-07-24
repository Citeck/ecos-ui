import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { resetSearchAutocompleteItems, runSearchAutocompleteItems } from '../../actions/header';
import { generateSearchTerm, isLastItem, t } from '../../helpers/util';
import { isNewVersionPage } from '../../helpers/urls';
import { URL_PAGECONTEXT } from '../../constants/alfresco';
import SearchService from '../../services/search';
import PageService from '../../services/PageService';
import { SearchSelect } from '../common';
import SearchItem from './SearchItem';

const Types = SearchService.SearchAutocompleteTypes;

const mapStateToProps = state => ({
  documents: state.header.search.documents,
  people: state.header.search.people,
  sites: state.header.search.sites,
  noResults: state.header.search.noResults,
  isLoading: state.header.search.isLoading,
  theme: state.view.theme
});

const mapDispatchToProps = dispatch => ({
  runSearchAutocomplete: payload => dispatch(runSearchAutocompleteItems(payload)),
  resetSearchAutocomplete: payload => dispatch(resetSearchAutocompleteItems(payload))
});

const setOutputParams = (array, type) => {
  return array.map((item, i) => {
    const res = SearchService.formatSearchAutocompleteResults(item, type);

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

    if (!isNewVersionPage(url)) {
      url = URL_PAGECONTEXT + url;
    }

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
    const openNewTab = [Types.DOCUMENTS, Types.SITES, Types.PEOPLE].includes(data.type) && !reopenBrowserTab;

    PageService.changeUrlLink(data.url, { openNewTab, reopenBrowserTab });
    this.props.resetSearchAutocomplete();
  };

  get searchResult() {
    const { documents, sites, people } = this.props;
    const searchResult = [];

    if (!isEmpty(documents)) {
      searchResult.push({ groupName: t('search.documents') });
      searchResult.push(...setOutputParams(documents, Types.DOCUMENTS));
    }
    if (!isEmpty(sites)) {
      searchResult.push({ groupName: t('search.sites') });
      searchResult.push(...setOutputParams(sites, Types.SITES));
    }
    if (!isEmpty(people)) {
      searchResult.push({ groupName: t('search.people') });
      searchResult.push(...setOutputParams(people, Types.PEOPLE));
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
    const { noResults, isMobile, theme } = this.props;
    const { isFocused } = this.state;

    const classes = classNames('ecos-header-search', `ecos-header-search_theme_${theme}`, {
      'ecos-header-search_focused': isFocused
    });

    return (
      <SearchSelect
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
