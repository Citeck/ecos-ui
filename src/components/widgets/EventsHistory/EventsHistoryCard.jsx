import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

import { Separator } from '../../common/index';
import { Headline } from '../../common/form/index';
import { t } from '../../../helpers/util';
import formatterRegistry from '../../Journals/service/formatters/registry';

const Exclusion = ['creationTime', 'version', 'eventType'];

class EventsHistoryCard extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    columns: PropTypes.array
  };

  static defaultProps = {
    event: {},
    columns: []
  };

  get filteredColumns() {
    const { columns } = this.props;

    return columns.filter(item => !Exclusion.includes(item.dataField));
  }

  getColumnByField = field => {
    const { columns } = this.props;

    return columns.find(item => item.dataField === field);
  };

  renderValue(column = {}, className = '', defaultValue = '') {
    const { event } = this.props;
    const formatExtraData = column.formatExtraData || {};
    let cell = event[column.dataField];
    const empty = isEmpty(cell);
    let Formatter = formatExtraData.formatter;

    if (isEmpty(Formatter) || !isFunction(Formatter)) {
      const formatter = formatterRegistry.getFormatter(get(column, 'newFormatter.type'));

      if (formatter) {
        Formatter = formatter.format.bind(formatter);
      }
    }

    cell = !empty ? cell : defaultValue || t('events-history-widget.info.no-data');

    return (
      <div className={classNames('ecos-event-history-card-value', className, { 'ecos-event-history-card-value_none': empty })}>
        {Formatter && !empty ? <Formatter cell={cell} {...formatExtraData} /> : t(cell)}
      </div>
    );
  }

  render() {
    const { event } = this.props;
    const [date, version, status] = Exclusion;

    return (
      <div className="ecos-event-history-card">
        <Headline>
          {this.renderValue(this.getColumnByField(version), 'ecos-event-history-card-value_version', '—')}
          {this.renderValue(this.getColumnByField(date), 'ecos-event-history-card-value_date')}
        </Headline>
        <div className="ecos-event-history-card__fields">
          {this.renderValue(this.getColumnByField(status), `ecos-event-history-card-value_status`)}
          {this.filteredColumns.map(item => (
            <React.Fragment key={event.id + item.dataField}>
              <Separator noIndents className="ecos-event-history-card__separator" />
              <div className="ecos-event-history-card-label">{item.text}</div>
              {this.renderValue(item)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
}

export default EventsHistoryCard;
