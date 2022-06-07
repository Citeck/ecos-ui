import React, { Component } from 'react';
import get from 'lodash/get';

import GoToButton from '../../Journals/JournalsDashletEditor/GoToButton';
import { JOURNAL_DASHLET_CONFIG_VERSION } from '../../Journals/constants';

class Settings extends Component {
  get goToButtonName() {
    return get(this.props, ['widget', 'props', 'config', JOURNAL_DASHLET_CONFIG_VERSION, 'goToButtonName']);
  }

  handleChangeGoToButtonName = name => {
    console.warn({ name });
  };

  render() {
    const {} = this.props;

    return (
      <>
        <GoToButton
          // isSmall={this.isSmall}
          value={this.goToButtonName}
          onChange={this.handleChangeGoToButtonName}
        />
      </>
    );
  }
}

export default Settings;
