import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { t } from '../../../helpers/util';
import { SearchSelect } from '../../common';
import { resetSearchAutocompleteItems, runSearchAutocompleteItems } from '../../../actions/header';
import SearchService from '../../../services/search';

const mapStateToProps = state => ({
  documents: state.header.search.documents,
  people: state.header.search.people,
  sites: state.header.search.sites,
  noResults: state.header.search.noResults
});

const mapDispatchToProps = dispatch => ({
  runSearchAutocomplete: payload => dispatch(runSearchAutocompleteItems(payload)),
  resetSearchAutocomplete: payload => dispatch(resetSearchAutocompleteItems(payload))
});

const setOutputParams = (array, type) => {
  return array.map(item => SearchService.formatSearchAutocompleteResults(item, type));
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

  // onKeyDown = e => {
  //   const { searchPageUrl, hiddenSearchTerms, hideAutocomplete } = this.props;
  //   const { searchText } = this.state;
  //
  //   switch (e.key) {
  //     case 'Enter':
  //       let url = searchPageUrl || 'hdp/ws/faceted-search#searchTerm=' + generateSearchTerm(searchText, hiddenSearchTerms) + '&scope=repo';
  //       window.location = window.Alfresco.constants.URL_PAGECONTEXT + url;
  //       break;
  //     case 'ArrowUp':
  //       e.preventDefault();
  //       this.setSearchTextFromHistory(true);
  //       break;
  //     case 'ArrowDown':
  //       e.preventDefault();
  //       this.setSearchTextFromHistory(false);
  //       break;
  //     case 'Escape':
  //       hideAutocomplete();
  //       break;
  //     default:
  //       break;
  //   }
  // };

  onSearch = searchText => {
    if (searchText) {
      this.props.runSearchAutocomplete(searchText);
    } else {
      this.props.resetSearchAutocomplete();
    }
  };

  get searchResult() {
    const { documents, sites, people } = this.props;
    const searchResult = [];
    const Types = SearchService.SearchAutocompleteTypes;

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

    //searchResult.slice(0, 8);

    return searchResult;
  }

  render() {
    const { noResults } = this.props;

    return (
      <SearchSelect
        className={`${this.className}__field`}
        onSearch={this.onSearch}
        theme={'dark'}
        searchResult={this.searchResult}
        autocomplete
        noResults={noResults}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
