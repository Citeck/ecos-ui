import * as React from 'react';
import { debounce, isEmpty } from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { isLastItem, t } from '../../../helpers/util';
import ClickOutside from '../../ClickOutside';
import { Btn } from '../btns';
import { Input } from '../form';
import { Icon, Loader } from '../';

import './style.scss';

export default class SearchSelect extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    formattedSearchResult: PropTypes.array,
    theme: PropTypes.string,
    autocomplete: PropTypes.bool,
    noResults: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    collapsed: PropTypes.bool,
    collapsible: PropTypes.bool,
    focused: PropTypes.bool,
    onSearch: PropTypes.func,
    openFullSearch: PropTypes.func,
    onToggleFocus: PropTypes.func
  };

  static defaultProps = {
    className: '',
    formattedSearchResult: [],
    autocomplete: false,
    isMobile: false,
    isLoading: false,
    collapsed: false,
    focused: false,
    collapsible: false,
    onSearch: () => undefined,
    openFullSearch: () => undefined
  };

  constructor(props) {
    super(props);

    this.state = {
      searchText: '',
      collapsed: props.collapsed,
      focused: false,
      hiddenPlaceholder: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (state.focused && props.focused !== state.focused) {
      newState.focused = false;
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  runSearch = debounce(() => {
    this.props.onSearch(this.state.searchText);
  }, 500);

  setFocus = debounce(() => {
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }, 100);

  getIsLastInGroup(arr, i) {
    return isLastItem(arr, i) || 'groupName' in arr[i + 1];
  }

  onChange = e => {
    this.setState({ searchText: e.target.value }, this.runSearch);
  };

  onKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        this.openFullSearch();
        break;
      case 'Escape':
        this.resetSearch();
        break;
      case 'ArrowUp':
        e.preventDefault();
        //const searchTextUp = SearchService.getSearchTextFromHistory(true);
        //this.setState({ searchText: searchTextUp }, this.runSearch);
        break;
      case 'ArrowDown':
        e.preventDefault();
        //const searchTextDown = SearchService.getSearchTextFromHistory(false);
        //this.setState({ searchText: searchTextDown }, this.runSearch);
        break;
      default:
        break;
    }
  };

  openFullSearch = () => {
    const searchText = this.state.searchText;

    this.props.openFullSearch(searchText);
    this.resetSearch();

    if (this.inputRef.current) {
      this.inputRef.current.blur();
    }
    this.setFocused(false);
  };

  resetSearch = () => {
    const { collapsed } = this.props;

    this.setState(state => {
      const st = {};

      if (state.searchText) {
        st.searchText = '';
      }

      if (collapsed && !state.collapsed && !state.searchText) {
        st.collapsed = true;
      }

      return st;
    }, this.runSearch.cancel);
  };

  setFocused = isFocused => {
    if (this.state.focused !== isFocused) {
      this.setState({
        focused: isFocused
      });

      if (typeof this.props.onToggleFocus === 'function') {
        this.props.onToggleFocus(isFocused);
      }
    }
  };

  onLoupe = () => {
    if (this.props.collapsible) {
      this.setState({
        collapsed: false,
        hiddenPlaceholder: true
      });
    }

    this.setFocus();
  };

  onClickOutside = () => {
    if (this.props.collapsible && !this.state.collapsed) {
      this.setState({ collapsed: true });
    }

    this.setFocused(false);
  };

  hidePlaceholder = isHidden => {
    if (this.state.hiddenPlaceholder !== isHidden) {
      this.setState({
        hiddenPlaceholder: isHidden
      });
    }
  };

  getInputRef = ref => {
    this.inputRef = ref;
  };

  renderNoResults() {
    return this.props.noResults && this.state.searchText ? (
      <li className="ecos-input-search__no-results">{t('search.no-results')}</li>
    ) : null;
  }

  renderBtnShowAll() {
    const { formattedSearchResult } = this.props;

    return !isEmpty(formattedSearchResult) ? (
      <li className="ecos-input-search__show-all">
        <Btn className="ecos-input-search__show-all-btn ecos-btn_narrow-t_standard" onClick={this.openFullSearch}>
          {t('search.show-more-results')}
        </Btn>
      </li>
    ) : null;
  }

  renderLoader() {
    const { isLoading } = this.props;

    return isLoading ? (
      <div className="ecos-input-search__loader">
        <Loader height={30} width={30} />
      </div>
    ) : null;
  }

  onFocus = () => {
    this.hidePlaceholder(true);
    this.setFocused(true);
  };

  onBlur = () => {
    this.hidePlaceholder(false);
  };

  render() {
    const { searchText, collapsed, hiddenPlaceholder, focused } = this.state;
    const { className, theme, autocomplete, formattedSearchResult, noResults, isLoading, collapsible, isMobile } = this.props;
    const isSearchCollapsed = collapsible && collapsed;
    const stateSearch = isSearchCollapsed ? 'close' : 'open';
    const isOpen = (!isEmpty(formattedSearchResult) || noResults || isLoading) && autocomplete && searchText && focused;

    return (
      <div className={classNames(className, 'ecos-input-search', `ecos-input-search_theme_${theme}`, `ecos-input-search_${stateSearch}`)}>
        <ClickOutside handleClickOutside={this.onClickOutside} className="ecos-input-search__click_outside">
          <Dropdown isOpen={isOpen} toggle={() => null}>
            <DropdownToggle tag="div">
              <Icon
                className={classNames('ecos-input-search__icon ecos-input-search__icon-search icon-search', {
                  'ecos-input-search__icon-search_no-collapse': !collapsible
                })}
                onClick={this.onLoupe}
              />
              <Input
                className={classNames('ecos-input-search__input', {
                  'ecos-input-search__input_empty': !searchText,
                  'ecos-input-search__input_hidden': isSearchCollapsed
                })}
                placeholder={isMobile || hiddenPlaceholder ? '' : t('search.label')}
                value={searchText || ''}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                getInputRef={this.getInputRef}
              />
              <Icon
                className={classNames('ecos-input-search__icon ecos-input-search__icon-clear icon-small-close', {
                  'ecos-input-search__icon_hidden': isSearchCollapsed || (!searchText && !isMobile)
                })}
                onClick={this.resetSearch}
              />
            </DropdownToggle>
            <DropdownMenu className="ecos-input-search__results ecos-dropdown__menu">
              {!noResults && !isEmpty(formattedSearchResult) && formattedSearchResult}
              {this.renderNoResults()}
              {this.renderBtnShowAll()}
              {this.renderLoader()}
            </DropdownMenu>
          </Dropdown>
        </ClickOutside>
      </div>
    );
  }
}
