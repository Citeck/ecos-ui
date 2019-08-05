import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Separator } from '../common';
import { getOutputFormat, t } from '../../helpers/util';
import { get, isEmpty, isObject } from 'lodash';

class EventsHistoryCard extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    columns: PropTypes.array
  };

  static defaultProps = {
    event: {},
    columns: []
  };

  className = 'ecos-action-history-card';

  renderValue(value, format, className, defaultV) {
    const empty = isEmpty(value);

    value = isObject(value) ? get(value, 'displayName') : value;

    return (
      <div className={classNames(`${this.className}-value`, className, { [`${this.className}-value_none`]: empty })}>
        {!empty ? getOutputFormat(format, value) : defaultV || t('Нет данных')}
      </div>
    );
  }

  render() {
    const { event, columns } = this.props;
    const exclusion = ['event:date', 'event:documentVersion', 'event:name'];
    const [date, version, status] = exclusion;
    const fColumns = columns.filter(item => !exclusion.includes(item.dataField));

    return (
      <div className={this.className}>
        <div className={`${this.className}__title`}>
          {this.renderValue(event[version], '', `${this.className}-value_version`, '—')}
          {this.renderValue(event[date], 'datetime', `${this.className}-value_date`)}
        </div>
        <div className={`${this.className}__fields`}>
          <div className={`${this.className}-label`}>{event[status]}</div>
          <Separator noIndents className={`${this.className}__separator`} />
          {fColumns.map(item => (
            <React.Fragment key={event.id + item.dataField}>
              <div className={`${this.className}-label`}>{item.text}</div>
              {this.renderValue(event[item.dataField], item.type)}
              <Separator noIndents className={`${this.className}__separator`} />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
}

export default EventsHistoryCard;
