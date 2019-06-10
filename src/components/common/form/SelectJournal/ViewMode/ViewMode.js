import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { t } from '../../../../../helpers/util';
import './ViewMode.scss';

class ViewMode extends Component {
  render() {
    const { selectedRows, placeholder } = this.props;

    const placeholderText = placeholder ? placeholder : t('select-journal.placeholder');

    return (
      <Fragment>
        {selectedRows.length > 0 ? (
          <ul className="select-journal-view-mode__list">
            {selectedRows.map(item => (
              <li key={item.id}>
                <span>{item.disp}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{placeholderText}</p>
        )}
      </Fragment>
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
