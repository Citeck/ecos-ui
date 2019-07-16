import React from 'react';
import { isEmpty } from 'lodash';
import { t } from '../../../../../helpers/util';
import DropdownMenuItem from '../DropdownMenuItem';

export default class DropdownMenuCascade extends React.Component {
  renderMenuItem() {
    const { items } = this.props;

    if (isEmpty(items)) {
      return null;
    }

    return items.map((item, key) => {
      return <DropdownMenuItem key={key} data={item} />;
    });
  }

  render() {
    const { id, label, items } = this.props;
    return (
      <React.Fragment>
        <div>{t(label)}</div>
        <div>{this.renderMenuItem()}</div>
      </React.Fragment>
    );
  }
}
