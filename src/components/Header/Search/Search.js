import React from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import SearchDropdown from './SearchDropdown';
import SearchAutocomplete from './SearchAutocomplete';
import ClickOutside from '../../ClickOutside';
import {
  getSearchTextFromHistory,
  toggleAutocompleteVisibility,
  fetchAutocompleteItems,
  fetchMoreAutocompleteDocuments
} from '../../../actions/header';
import { t, generateSearchTerm } from '../../../helpers/util';

const mapStateToProps = state => ({
  autocompleteIsVisible: state.header.search.autocomplete.isVisible
});

const mapDispatchToProps = dispatch => ({
  fetchAutocomplete: (payload, callback) => dispatch(fetchAutocompleteItems(payload, callback)),
  fetchMoreDocuments: payload => dispatch(fetchMoreAutocompleteDocuments(payload)),
  showAutocomplete: payload => dispatch(toggleAutocompleteVisibility(true)),
  hideAutocomplete: payload => dispatch(toggleAutocompleteVisibility(false)),
  getSearchTextFromHistory: (isDesc, callback) => {
    dispatch(getSearchTextFromHistory(isDesc, callback));
  }
});

class Search extends React.Component {
  searchPlaceholder = t('search.label');
  clearButtonTitle = t('search.clear');

  state = {
    searchText: ''
  };

  onKeyDown = e => {
    const { searchPageUrl, hiddenSearchTerms, hideAutocomplete } = this.props;
    const { searchText } = this.state;

    switch (e.key) {
      case 'Enter':
        let url = searchPageUrl || 'hdp/ws/faceted-search#searchTerm=' + generateSearchTerm(searchText, hiddenSearchTerms) + '&scope=repo';
        window.location = window.Alfresco.constants.URL_PAGECONTEXT + url;
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setSearchTextFromHistory(true);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.setSearchTextFromHistory(false);
        break;
      case 'Escape':
        hideAutocomplete();
        break;
      default:
        break;
    }
  };

  setSearchTextFromHistory = isDesc => {
    const { getSearchTextFromHistory } = this.props;
    getSearchTextFromHistory(isDesc, newSearchText => {
      this.setState({ searchText: newSearchText }, this.fetchAutocomplete);
    });
  };

  onSearchClearClick = () => {
    this.setState({ searchText: '' }, () => {
      this.props.fetchAutocomplete(this.state.searchText);
      this.inputRef.focus();
    });
  };

  onTextChange = e => {
    this.setState({ searchText: e.target.value }, this.fetchAutocomplete);
  };

  fetchAutocomplete = debounce(() => {
    this.props.fetchAutocomplete(this.state.searchText, () => {
      const { autocompleteIsVisible, showAutocomplete } = this.props;
      !autocompleteIsVisible && showAutocomplete();
    });
  }, 500);

  render() {
    const { showAutocomplete, hideAutocomplete, autocompleteIsVisible, fetchMoreDocuments } = this.props;
    const { searchText } = this.state;
    return (
      <div id="HEADER_SEARCH_BOX" className="alfresco-header-SearchBox share-header-search">
        <div className="alfresco-header-SearchBox-inner share-header-search__inner">
          <SearchDropdown />
          <ClickOutside
            handleClickOutside={autocompleteIsVisible && hideAutocomplete}
            className="share-header-search__click_outside_wrapper"
          >
            <input
              id="HEADER_SEARCHBOX_FORM_FIELD"
              className="alfresco-header-SearchBox-text"
              type="text"
              placeholder={this.searchPlaceholder}
              onChange={this.onTextChange}
              value={searchText}
              onKeyDown={this.onKeyDown}
              onFocus={showAutocomplete}
              ref={el => (this.inputRef = el)}
            />
            <SearchAutocomplete
              fetchMoreDocuments={() => {
                fetchMoreDocuments(searchText);
              }}
            />
          </ClickOutside>
          <div className="share-header-search__clear-button" title={this.clearButtonTitle} onClick={this.onSearchClearClick}>
            <i className={'fa fa-times-circle'} />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
