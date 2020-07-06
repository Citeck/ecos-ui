import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../../../helpers/util';
import { createDocumentUrl } from '../../../../../helpers/urls';
import { AssocLink } from '../../AssocLink';
import { DisplayModes } from '../../../../../forms/components/custom/selectJournal/constants';
import InputView from '../InputView';

import './ViewMode.scss';

class ViewMode extends Component {
  renderTableView() {
    return <InputView {...this.props} hideActionButton />;
  }

  render() {
    if (this.props.viewMode === DisplayModes.TABLE) {
      return this.renderTableView();
    }

    const { selectedRows, placeholder, isSelectedValueAsText } = this.props;

    const placeholderText = placeholder ? placeholder : t('select-journal.placeholder');

    return (
      <>
        {selectedRows.length > 0 ? (
          <ul className="select-journal-view-mode__list">
            {selectedRows.map(item => (
              <li key={item.id}>
                <AssocLink
                  label={item.disp}
                  asText={isSelectedValueAsText}
                  link={createDocumentUrl(item.id)}
                  className="select-journal-view-mode__list-value"
                />
              </li>
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
