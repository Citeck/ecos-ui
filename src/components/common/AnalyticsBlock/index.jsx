import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { t } from '../../../helpers/util';

import EcosProgressBar from '../EcosProgressBar';

import './styles.scss';

export default class AnalyticsBlock extends Component {
  static propTypes = {
    style: PropTypes.object,
    value: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    renderChart: PropTypes.func.isRequired,
    max: PropTypes.number.isRequired,
    color: PropTypes.string,
    percentageFixedCount: PropTypes.number
  };

  render() {
    const { max, value, title, renderChart, color, data, style, percentageFixedCount: fixedCount } = this.props;

    return (
      <div className="analytics-block" style={style ? { ...style } : {}}>
        <div className="analytics-block__row">
          <span className="analytics-block__indicator" style={{ backgroundColor: color }} />
          <p className="analytics-block__title" style={{ flexGrow: 1 }}>
            {title}
          </p>
          <p className="analytics-block__title" style={{ color }}>
            {value}
          </p>
        </div>
        <div className="analytics-block__row" style={{ justifyContent: 'center' }}>
          {renderChart({ max, value, filledColor: color, showPercentage: true, fixedCount })}
        </div>
        <table className="analytics-block__data">
          <tbody>
            {data.map(el => (
              <tr key={el.id} className="analytics-block__data-row">
                <td style={{ verticalAlign: 'middle', minWidth: 178 }}>
                  {(el.name ? el.name + ': ' : '') + (el.status ? el.status : t('report-widget.records.no-status'))}
                </td>
                <td align="center" style={{ verticalAlign: 'middle' }}>
                  {el.count}
                </td>
                <td className="analytics-block__data-progress">
                  <EcosProgressBar max={value} value={Number(el.count)} filledColor="#444444" emptyColor="transparent" б height={3} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
