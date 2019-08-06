import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Separator } from '../common';
import { t } from '../../helpers/util';
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

  className = 'ecos-action-history-card';

  renderValue(column = {}, className = '', defV = '') {
    const { event } = this.props;
    const formatExtraData = column.formatExtraData || {};
    const Formatter = formatExtraData.formatter;
    let cell = event[column.dataField];
    const empty = isEmpty(cell);

    cell = !empty ? cell : defV || 'Нет данных';

    return (
      <div className={classNames(`${this.className}-value`, className, { [`${this.className}-value_none`]: empty })}>
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
      <div className={this.className}>
        <div className={`${this.className}__title`}>
          {this.renderValue(sItem(version), `${this.className}-value_version`, '—')}
          {this.renderValue(sItem(date), `${this.className}-value_date`)}
        </div>
        <div className={`${this.className}__fields`}>
          {this.renderValue(sItem(status), `${this.className}-value_status`)}
          {fColumns.map(item => (
            <React.Fragment key={event.id + item.dataField}>
              <Separator noIndents className={`${this.className}__separator`} />
              <div className={`${this.className}-label`}>{item.text}</div>
              {this.renderValue(item)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
}

export default EventsHistoryCard;
