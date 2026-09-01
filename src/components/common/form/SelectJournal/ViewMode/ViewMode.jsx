import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { AssocLink } from '../../AssocLink';
import InputView from '../InputView';
import Loader from '@/components/common/Loader/Loader';
import PointsLoader from '@/components/common/PointsLoader/PointsLoader';
import { Labels } from '@/components/common/form/SelectJournal/constants';

import { getFormattedLink, getFormatter } from '@/components/common/form/SelectJournal/helpers';
import { DisplayModes } from '@/forms/components/custom/selectJournal/constants';
import { getEnabledWorkspaces, t } from '@/helpers/util';

import './ViewMode.scss';

class ViewMode extends Component {
  renderTableView() {
    return (
      <>
        <InputView {...this.props} hideActionButton />
        {this.props.isLoading && <Loader blur type="points" />}
      </>
    );
  }

  render() {
    const { selectedRows, selectedQueryInfo, placeholder, isSelectedValueAsText, linkFormatter, isLoading, valueError } = this.props;
    const enabledWorkspaces = getEnabledWorkspaces();

    const formatterFunc = getFormatter(linkFormatter);

    if (selectedQueryInfo) {
      return <p>{selectedQueryInfo}</p>;
    }

    if (this.props.viewMode === DisplayModes.TABLE) {
      return this.renderTableView();
    }

    if (!isEmpty(selectedRows)) {
      return (
        <ul className="select-journal-view-mode__list">
          {selectedRows.map(item => {
            const props = {};

            if (!isSelectedValueAsText) {
              const link = getFormattedLink({
                item,
                formatterFunc
              });

              props.link = link;
              props.paramsLink = { openNewBrowserTab: false };

              const newUrl = new URL(link, window.location.origin);
              const searchParams = new URLSearchParams(newUrl.search);

              if (enabledWorkspaces) {
                props.paramsLink = {
                  ...props.paramsLink,
                  workspaceId: searchParams.get('ws')
                };
              }
            }

            return (
              <li key={item.id}>
                <AssocLink label={item.disp} asText={isSelectedValueAsText} className="select-journal-view-mode__list-value" {...props} />
              </li>
            );
          })}
        </ul>
      );
    }

    // Still resolving what is selected: showing the not-selected text next to a stray loader
    // reads as "the value is «None»" about a value nobody has seen yet. The dots take the value's
    // own place until the answer arrives (COREDEV-429).
    if (isLoading) {
      return <PointsLoader className="select-journal-view-mode__loader" color="light-blue" />;
    }

    // A failed resolution: the record does hold a value, claiming «None» would be a lie.
    if (valueError) {
      return <p className="select-journal-view-mode__error">{t('error')}</p>;
    }

    return <p>{placeholder || t(Labels.PLACEHOLDER)}</p>;
  }
}

ViewMode.propTypes = {
  selectedRows: PropTypes.array,
  isLoading: PropTypes.bool,
  placeholder: PropTypes.string,
  error: PropTypes.instanceOf(Error),
  valueError: PropTypes.instanceOf(Error),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  editValue: PropTypes.func,
  deleteValue: PropTypes.func,
  openSelectModal: PropTypes.func,
  linkFormatter: PropTypes.string
};

export default ViewMode;
