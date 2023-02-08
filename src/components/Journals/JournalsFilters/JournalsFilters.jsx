import React, { Component } from 'react';
import isFunction from 'lodash/isFunction';

import Filters from '../../Filters/Filters';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t } from '../../../helpers/util';
import { selectFilterGroup } from '../../../selectors/journals';

import './JournalsFilters.scss';

class JournalsFilters extends Component {
  onChangeFilters = predicate => {
    const { setPredicate } = this.props;
    isFunction(setPredicate) && setPredicate(predicate);
  };

  render() {
    const { predicate, columns, sourceId, metaRecord, needUpdate } = this.props;

    return (
      <PanelBar header={t('filter-list.panel-header')} css={{ headerClassName: 'panel-bar__header_upper' }} open>
        <Filters
          predicate={predicate}
          columns={columns}
          sourceId={sourceId}
          metaRecord={metaRecord}
          needUpdate={needUpdate}
          className="ecos-journals-filters"
          onChange={this.onChangeFilters}
          groups={selectFilterGroup(predicate, columns)}
        />
      </PanelBar>
    );
  }
}

export default JournalsFilters;
