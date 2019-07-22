import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { generateSearchTerm, isLastItem, t } from '../../helpers/util';
import { SearchSelect } from '../common';
import { resetSearchAutocompleteItems, runSearchAutocompleteItems } from '../../actions/header';
import SearchService from '../../services/search';
import SearchItem from './SearchItem';
import { changeUrlLink } from '../PageTabs/PageTabs';
import { isNewVersionPage } from '../../helpers/urls';

const Types = SearchService.SearchAutocompleteTypes;

const mapStateToProps = state => ({
  documents: state.header.search.documents,
  people: state.header.search.people,
  sites: state.header.search.sites,
  noResults: state.header.search.noResults,
  isLoading: state.header.search.isLoading
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
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isSmallMode: false,
    isMobile: false
  };

  className = 'ecos-header-search';

  onSearch = searchText => {
    this.props.resetSearchAutocomplete();

    if (searchText) {
      this.props.runSearchAutocomplete(searchText);
    }
  };

  openFullSearch = searchText => {
    const { searchPageUrl, hiddenSearchTerms } = this.props;
    const url = searchPageUrl || 'hdp/ws/faceted-search#searchTerm=' + generateSearchTerm(searchText, hiddenSearchTerms) + '&scope=repo';

    changeUrlLink(window.Alfresco.constants.URL_PAGECONTEXT + url, { reopenBrowserTab: true });
  };

  goToResult = data => {
    const reopenBrowserTab = !isNewVersionPage(data.url);
    const openNewTab = [Types.DOCUMENTS, Types.SITES].includes(data.type) && !reopenBrowserTab;

    changeUrlLink(data.url, { openNewTab, reopenBrowserTab });
    this.props.resetSearchAutocomplete();
  };

  get searchResult() {
    const { documents, sites, people } = this.props;
    const searchResult = [];

    if (!isEmpty(documents)) {
      searchResult.push({ groupName: t('Документы') });
      searchResult.push(...setOutputParams(documents, Types.DOCUMENTS));
    }
    if (!isEmpty(sites)) {
      searchResult.push({ groupName: t('Разделы') });
      searchResult.push(...setOutputParams(sites, Types.SITES));
    }
    if (!isEmpty(people)) {
      searchResult.push({ groupName: t('Люди') });
      searchResult.push(...setOutputParams(people, Types.PEOPLE));
    }

    return searchResult;
  }

  get formattedSearchResult() {
    const { noResults } = this.props;
    const searchResult = this.searchResult;

    return !noResults && !isEmpty(searchResult)
      ? searchResult.map((item, i, arr) => <SearchItem key={`${this.className}-${i}`} data={item} onClick={this.goToResult} />)
      : null;
  }

  render() {
    const { noResults, isMobile, isSmallMode } = this.props;

    return (
      <SearchSelect
        className={this.className}
        onSearch={this.onSearch}
        openFullSearch={this.openFullSearch}
        theme={'dark'}
        formattedSearchResult={this.formattedSearchResult}
        autocomplete
        collapsed={isMobile || isSmallMode}
        collapsible={isMobile || isSmallMode}
        noResults={noResults}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
