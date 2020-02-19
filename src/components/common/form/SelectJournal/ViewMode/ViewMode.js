import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl } from '../../../../../helpers/urls';
import PageService from '../../../../../services/PageService';

import './ViewMode.scss';

class ViewMode extends Component {
  renderValue(item) {
    const { isSelectedValueAsLink } = this.props;
    const url = createDocumentUrl(item.id);
    const onClick = () => {
      if (isSelectedValueAsLink) {
        PageService.changeUrlLink(url, { openNewBrowserTab: true });
      }
    };

    return (
      <span
        onClick={onClick}
        className={classNames('select-journal-view-mode__list-value', {
          'select-journal-view-mode__list-value_link': isSelectedValueAsLink
        })}
      >
        {item.disp}
      </span>
    );
  }

  render() {
    const { selectedRows, placeholder } = this.props;

    const placeholderText = placeholder ? placeholder : t('select-journal.placeholder');

    return (
      <>
        {selectedRows.length > 0 ? (
          <ul className="select-journal-view-mode__list">
            {selectedRows.map(item => (
              <li key={item.id}>{this.renderValue(item)}</li>
            ))}
          </ul>
        ) : (
          <p>{placeholderText}</p>
        )}
      </>
    );
  }
}

ViewMode.propTypes = {
  selectedRows: PropTypes.array,
  placeholder: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func
};

export default ViewMode;
