import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Separator } from '../../common/index';
import { Headline } from '../../common/form/index';
import { t } from '../../../helpers/util';
import { isEmpty } from 'lodash';

class EventsHistoryCard extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    columns: PropTypes.array
  };

  static defaultProps = {
    event: {},
    columns: []
  };

  renderValue(column = {}, className = '', defV = '') {
    const { event } = this.props;
    const formatExtraData = column.formatExtraData || {};
    const Formatter = formatExtraData.formatter;
    let cell = event[column.dataField];
    const empty = isEmpty(cell);

    cell = !empty ? cell : defV || t('events-history-widget.info.no-data');

    return (
      <div className={classNames('ecos-event-history-card-value', className, { 'ecos-event-history-card-value_none': empty })}>
        {Formatter && !empty ? <Formatter cell={cell} {...formatExtraData} /> : t(cell)}
      </div>
    );
  }

  render() {
    const { event, columns } = this.props;
    const exclusion = ['event:date', 'event:documentVersion', 'event:name'];
    const [date, version, status] = exclusion;
    const fColumns = columns.filter(item => !exclusion.includes(item.dataField));
    const sItem = key => columns.find(item => item.dataField === key);

    return (
      <div className="ecos-event-history-card">
        <Headline>
          {this.renderValue(sItem(version), 'ecos-event-history-card-value_version', '—')}
          {this.renderValue(sItem(date), 'ecos-event-history-card-value_date')}
        </Headline>
        <div className="ecos-event-history-card__fields">
          {this.renderValue(sItem(status), `ecos-event-history-card-value_status`)}
          {fColumns.map(item => (
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
