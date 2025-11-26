import { debounce } from 'lodash';
import React, { Component } from 'react';

import { Search } from '@/components/common';
import './styles.scss';

interface SearchWorkspaceSidebarProps {
  onSearch: (text: string) => void;
}

export default class SearchWorkspaceSidebar extends Component<SearchWorkspaceSidebarProps> {
  onChange = debounce(text => {
    this.props.onSearch(text);
  }, 500);

  render() {
    return <Search onSearch={this.props.onSearch} onChange={this.onChange} cleaner className="citeck-workspace-sidebar__search" />;
  }
}
