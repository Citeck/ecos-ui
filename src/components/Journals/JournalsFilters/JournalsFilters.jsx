import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import React, { Component } from 'react';

import { t } from '../../../helpers/util';
import { selectFilterGroup } from '../../../selectors/journals';
import Filters from '../../Filters/Filters';
import PanelBar from '../../common/PanelBar/PanelBar';

import './JournalsFilters.scss';

class JournalsFilters extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: selectFilterGroup(props.predicate, props.columns),
      columns: props.columns,
      predicate: props.predicate,
      metaRecord: props.metaRecord,
      sourceId: props.sourceId,
      needUpdate: props.needUpdate
    };
  }

  componentDidUpdate(prevProps) {
    const { predicate, columns, needUpdate, metaRecord, sourceId } = this.props;

    if (
      !isEqual(prevProps.predicate, predicate) ||
      !isEqual(prevProps.columns, columns) ||
      !isEqual(prevProps.needUpdate, needUpdate) ||
      !isEqual(prevProps.metaRecord, metaRecord) ||
      !isEqual(prevProps.sourceId, sourceId)
    ) {
      this.setState({
        predicate,
        columns,
        needUpdate,
        metaRecord,
        sourceId,
        groups: selectFilterGroup(predicate, columns)
      });
    }
  }

  onChangeFilters = predicate => {
    const { setPredicate } = this.props;
    isFunction(setPredicate) && setPredicate(predicate);
  };

  handlePredicate = () => {
    const { predicate } = this.state;

    if (isArray(predicate)) {
      return predicate.find(p => get(p, 'att') !== '_type' && isObject(p) && isArray(get(p, 'val'))) || predicate;
    }

    return predicate;
  };

  render() {
    const { groups, columns, needUpdate, metaRecord, sourceId } = this.state;
    const predicate = this.handlePredicate();

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
          groups={groups}
        />
      </PanelBar>
    );
  }
}

export default JournalsFilters;
