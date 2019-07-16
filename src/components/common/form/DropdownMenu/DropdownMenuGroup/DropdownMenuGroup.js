import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import DropdownMenuItem from '../DropdownMenuItem';
import { t } from '../../../../../helpers/util';
import Separator from '../../../Separator/Separator';

export default class DropdownMenuGroup extends React.Component {
  static propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    items: PropTypes.array,
    hideLabel: PropTypes.bool,
    hideSeparator: PropTypes.bool
  };

  static defaultProps = {
    hideLabel: false,
    hideSeparator: false
  };

  render() {
    const { id, label, items, hideLabel, hideSeparator } = this.props;
    const groupItems = isEmpty(items)
      ? []
      : items.map((item, key) => {
          return <DropdownMenuItem key={key} data={item} />;
        });

    return (
      <React.Fragment>
        {!hideLabel && <div className={'ecos-header-dropdown__group-label'}>{t(label)}</div>}
        {groupItems}
        {!hideSeparator && <Separator noIndents />}
      </React.Fragment>
    );
  }
}
