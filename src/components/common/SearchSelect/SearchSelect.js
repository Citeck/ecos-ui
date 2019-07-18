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

const Themes = {
  DARK: 'dark',
  LIGHT: 'light'
};

export default class SearchSelect extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    formattedSearchResult: PropTypes.array,
    theme: PropTypes.oneOf([Themes.DARK, Themes.LIGHT]),
    autocomplete: PropTypes.bool,
    noResults: PropTypes.bool,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    onSearch: PropTypes.func,
    onKeyDown: PropTypes.func,
    openFullSearch: PropTypes.func
  };

  static defaultProps = {
    className: '',
    formattedSearchResult: [],
    autocomplete: false,
    isSmallMode: false,
    isMobile: false,
    isLoading: false,
    onSearch: () => {},
    openFullSearch: () => {},
    onKeyDown: () => {}
  };

  className = 'ecos-input-search';

  state = {
    searchText: ''
  };

  runSearch = debounce(() => {
    this.props.onSearch(this.state.searchText);
  }, 500);

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
  };

  resetSearch = data => {
    this.setState({ searchText: '' });
    this.props.onSearch('');
  };

  renderNoResults() {
    const { noResults } = this.props;

    return noResults ? <li className={`${this.className}__no-results`}>{t('Ничего не найдено')}</li> : null;
  }

  renderBtnShowAll() {
    const { formattedSearchResult } = this.props;

    return !isEmpty(formattedSearchResult) ? (
      <li className={`${this.className}__show-all`}>
        <Btn className={`${this.className}__show-all-btn ecos-btn_narrow-t_standart`} onClick={this.openFullSearch}>
          {t('Показать все результаты')}
        </Btn>
      </li>
    ) : null;
  }

  renderLoading() {
    const { isLoading } = this.props;

    return isLoading ? (
      <li className={`${this.className}__loader`}>
        <Loader height="30" width="30" />
      </li>
    ) : null;
  }

  render() {
    const { searchText } = this.state;
    const { className, theme, autocomplete, formattedSearchResult, noResults, isLoading } = this.props;
    const classNameField = classNames(this.className, `${this.className}_${theme}`);
    const commonIcon = `${this.className}__icon`;
    const isOpen = (!isEmpty(formattedSearchResult) || noResults || isLoading) && autocomplete;

    return (
      <ClickOutside handleClickOutside={this.resetSearch} className={`${this.className}__click_outside`}>
        <Dropdown className={`${className} ${this.className} ecos-header-dropdown`} isOpen={isOpen} toggle={() => {}}>
          <DropdownToggle tag="div">
            <div className={classNameField}>
              <Icon className={classNames(commonIcon, `${commonIcon}-search`, 'icon-search')} />
              <Input
                className={classNames(`${this.className}__input`)}
                placeholder={t('Найти файл, человека или сайт')}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
                value={searchText || ''}
              />
              {searchText && <Icon className={classNames(commonIcon, `${commonIcon}-clear`, 'icon-close')} onClick={this.resetSearch} />}
            </div>
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__results ecos-dropdown__menu`}>
            {!noResults && !isEmpty(formattedSearchResult) && formattedSearchResult}
            {this.renderNoResults()}
            {this.renderBtnShowAll()}
            {this.renderLoading()}
          </DropdownMenu>
        </Dropdown>
      </ClickOutside>
    );
  }
}
