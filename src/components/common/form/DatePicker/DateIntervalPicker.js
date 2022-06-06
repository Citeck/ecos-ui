import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { UncontrolledPopover, PopoverHeader, PopoverBody } from 'reactstrap';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import moment from 'moment';

import { Select, Input, DatePicker } from '../';
import { num2str, prepareTooltipId } from '../../../../helpers/util';
import { t } from '../../../../helpers/export/util';
import { datePredicateVariables } from '../../../Records/predicates/predicates';
import { DateFormats } from '../../../../constants';

import './DateIntervalPicker.scss';

const DateInputs = {
  START: 'start',
  END: 'end'
};
const DateTypes = {
  RELATIVE: 'RELATIVE',
  ABSOLUTE: 'ABSOLUTE',
  CUSTOM: 'CUSTOM',
  get TODAY() {
    return datePredicateVariables.TODAY;
  },
  get NOW() {
    return datePredicateVariables.NOW;
  }
};
const Labels = {
  DATEPICKER_PLACEHOLDER: 'interval-picker.placeholder',

  DATE_TYPE_RELATIVE: 'interval-picker.date-type.relative',
  DATE_TYPE_ABSOLUTE: 'interval-picker.date-type.absolute',
  DATE_TYPE_CUSTOM: 'interval-picker.date-type.custom',
  DATE_TYPE_TODAY: 'interval-picker.date-type.today',
  DATE_TYPE_NOW: 'interval-picker.date-type.now',

  DATE_INPUTS_START: 'interval-picker.date-inputs.start',
  DATE_INPUTS_END: 'interval-picker.date-inputs.end',

  TIME_AGO_DAYS: 'interval-picker.time-ago.days',
  TIME_AGO_HOURS: 'interval-picker.time-ago.hours',

  HOUR_F1: 'hour-form1',
  HOUR_F2: 'hour-form2',
  HOUR_F3: 'hour-form3',
  DAY_F1: 'day-form1',
  DAY_F2: 'day-form2',
  DAY_F3: 'day-form3',

  RESULT_LABEL_AGO: 'interval-picker.labels.ago'
};

class DateIntervalPicker extends Component {
  static propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func
  };

  #componentRef = React.createRef();
  #tooltipId = prepareTooltipId();

  state = {
    [DateInputs.START]: '',
    [DateInputs.END]: '',
    selectedPart: undefined,
    selectedType: this.dateTypeOptions[0],
    selectedTimeAgo: this.timeAgoOptions[0]
  };

  constructor(props) {
    super(props);

    this.portal = this.createDateEditorContainer();
  }

  componentDidMount() {
    const component = get(this.#componentRef, 'current');

    if (component) {
      const wrapper = component.closest('.ecos-inline-filter__value');

      if (wrapper) {
        wrapper.style.minWidth = '300px';
      }
    }

    this.splitIntervalToParts();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.value !== this.props.value) {
      this.splitIntervalToParts();
    }
  }

  componentWillUnmount() {
    const component = get(this.#componentRef, 'current');

    if (component) {
      const wrapper = component.closest('.ecos-inline-filter__value');

      if (wrapper) {
        wrapper.style.minWidth = 'unset';
      }
    }
  }

  get popoverLabel() {
    const { selectedPart } = this.state;

    switch (selectedPart) {
      case DateInputs.START:
        return t(Labels.DATE_INPUTS_START);
      case DateInputs.END:
        return t(Labels.DATE_INPUTS_END);
      default:
        return '';
    }
  }

  get timeAgoOptions() {
    return [
      {
        label: t(Labels.TIME_AGO_DAYS),
        value: datePredicateVariables.DAY
      },
      {
        label: t(Labels.TIME_AGO_HOURS),
        value: datePredicateVariables.HOUR
      }
    ];
  }

  get dateTypeOptions() {
    return [
      {
        label: t(Labels.DATE_TYPE_RELATIVE),
        value: DateTypes.RELATIVE
      },
      {
        label: t(Labels.DATE_TYPE_ABSOLUTE),
        value: DateTypes.ABSOLUTE
      },
      {
        label: t(Labels.DATE_TYPE_TODAY),
        value: DateTypes.TODAY
      },
      {
        label: t(Labels.DATE_TYPE_NOW),
        value: DateTypes.NOW
      },
      {
        label: t(Labels.DATE_TYPE_CUSTOM),
        value: DateTypes.CUSTOM
      }
    ];
  }

  get selectedType() {
    return get(this.state, 'selectedType.value');
  }

  get selectedTimeAgo() {
    return get(this.state, 'selectedTimeAgo.value');
  }

  get date() {
    const { selectedPart } = this.state;

    return get(this.state, [selectedPart], '');
  }

  getNumberFromDate(date = this.date) {
    if (typeof date === 'string') {
      return date.replace(/\D/gim, '');
    }

    return '';
  }

  get unitOfTime() {
    const date = this.date;

    return date[date.length - 1] || '';
  }

  get startLabel() {
    return this.parseToLabel(get(this.state, [DateInputs.START]));
  }

  get endLabel() {
    return this.parseToLabel(get(this.state, [DateInputs.END]));
  }

  createDateEditorContainer = () => {
    const div = document.createElement('div');

    div.classList.add('date-editor-container');
    document.body.appendChild(div);

    return div;
  };

  splitIntervalToParts = (props = this.props) => {
    const { value } = props;

    if (isEmpty(value)) {
      return;
    }

    const { start, end } = this.state;
    const [_start, _end] = value.split('/');

    if (start !== _start && !isEmpty(_start)) {
      this.setState({ start: _start });
    }

    if (end !== _end && !isEmpty(_end)) {
      this.setState({ end: _end });
    }
  };

  parseToLabel(date) {
    if (isEmpty(date)) {
      return '';
    }

    const count = this.getNumberFromDate(date);

    if (this.checkIsDays(date)) {
      return t(Labels.RESULT_LABEL_AGO, {
        count,
        unit: t(num2str(count, [Labels.DAY_F1, Labels.DAY_F2, Labels.DAY_F3]))
      });
    }

    if (this.checkIsHours(date)) {
      return t(Labels.RESULT_LABEL_AGO, {
        count,
        unit: t(num2str(count, [Labels.HOUR_F1, Labels.HOUR_F2, Labels.HOUR_F3]))
      });
    }

    if (this.checkIsISO8601(date)) {
      return moment(date).format(DateFormats.DATETIME);
    }

    if (date === DateTypes.TODAY) {
      return t(Labels.DATE_TYPE_TODAY);
    }

    if (date === DateTypes.NOW) {
      return t(Labels.DATE_TYPE_NOW);
    }

    return date;
  }

  checkIsDays(date) {
    return date.match(/-P\d+D/) !== null;
  }

  checkIsHours(date) {
    return date.match(/-PT\d+H/) !== null;
  }

  checkIsISO8601(date) {
    return date.match(/^([12])(.*?)Z$/) !== null;
  }

  parseDate = () => {
    const { selectedPart } = this.state;
    const date = this.date;

    if (!selectedPart || !date) {
      this.setState({
        selectedType: this.dateTypeOptions[0],
        selectedTimeAgo: this.timeAgoOptions[0]
      });
      return;
    }

    if (date.match(/^([12])(.*?)Z$/) !== null) {
      this.setState({
        selectedType: this.dateTypeOptions.find(item => item.value === DateTypes.ABSOLUTE)
      });
      return;
    }

    if (this.checkIsDays(date) || this.checkIsHours(date)) {
      this.setState({
        selectedType: this.dateTypeOptions.find(item => item.value === DateTypes.RELATIVE),
        selectedTimeAgo: this.timeAgoOptions.find(item => item.value === this.unitOfTime)
      });
      return;
    }

    if (date === DateTypes.NOW) {
      this.setState({
        selectedType: this.dateTypeOptions.find(item => item.value === DateTypes.NOW)
      });
      return;
    }

    if (date === DateTypes.TODAY) {
      this.setState({
        selectedType: this.dateTypeOptions.find(item => item.value === DateTypes.TODAY)
      });
      return;
    }

    this.setState({
      selectedType: this.dateTypeOptions.find(item => item.value === DateTypes.CUSTOM)
    });
  };

  sendDate = () => {
    const { onChange } = this.props;
    const { start, end } = this.state;

    if (start && end && isFunction(onChange)) {
      onChange(`${start}/${end}`);
    }
  };

  handleClick = selectedPart => {
    if (selectedPart === this.state.selectedPart) {
      return;
    }

    this.setState({ selectedPart: undefined }, () => this.setState({ selectedPart }, this.parseDate));
  };

  handleClosePopover = () => {
    if (this.state.selectedPart) {
      this.setState({ selectedPart: undefined });
    }
  };

  handleChangeDateType = selectedType => {
    let selectedPartValue = '';

    if ([DateTypes.TODAY, DateTypes.NOW].includes(selectedType.value)) {
      selectedPartValue = selectedType.value;
    }

    this.setState(
      {
        selectedType,
        [this.state.selectedPart]: selectedPartValue
      },
      this.sendDate
    );
  };

  handleChangeTimeAgo = selectedTimeAgo => {
    this.setState({ selectedTimeAgo }, () => this.handleSelectDate(this.getNumberFromDate()));
  };

  handleSelectDate = value => {
    const { selectedPart } = this.state;
    let result = value;

    if (!selectedPart) {
      return;
    }

    switch (this.selectedType) {
      case DateTypes.RELATIVE: {
        if (this.selectedTimeAgo === datePredicateVariables.DAY) {
          result = `-P${value}D`;
        }

        if (this.selectedTimeAgo === datePredicateVariables.HOUR) {
          result = `-PT${value}H`;
        }

        break;
      }
      case DateTypes.ABSOLUTE: {
        result = moment(result).toISOString();
        break;
      }
      default:
        break;
    }

    this.setState({ [selectedPart]: result }, this.sendDate);
  };

  renderInput() {
    const { selectedTimeAgo } = this.state;

    switch (this.selectedType) {
      case DateTypes.RELATIVE:
        return (
          <>
            <Input narrow type="number" value={this.getNumberFromDate()} onChange={event => this.handleSelectDate(event.target.value)} />
            <Select narrow options={this.timeAgoOptions} value={selectedTimeAgo} onChange={this.handleChangeTimeAgo} />
          </>
        );
      case DateTypes.ABSOLUTE:
        return (
          <DatePicker
            inline
            showTimeSelect
            selected={this.date}
            placeholderText={t(Labels.DATEPICKER_PLACEHOLDER)}
            popperContainer={({ children }) => ReactDOM.createPortal(children, this.portal)}
            onChange={this.handleSelectDate}
          />
        );
      case DateTypes.NOW:
      case DateTypes.TODAY:
        return <Input readOnly narrow disabled value={moment().format(DateFormats.DATETIME)} />;
      case DateTypes.CUSTOM:
        return <Input narrow value={this.date} onChange={event => this.handleSelectDate(event.target.value)} />;
      default:
        return null;
    }
  }

  renderIntervalSelector() {
    const { selectedPart, selectedType } = this.state;

    if (!selectedPart) {
      return;
    }

    // todo: Поправить позицию выпадашки (левее сделать)
    return (
      <UncontrolledPopover
        className="ecos-dp-interval__popover"
        innerClassName="ecos-dp-interval__popover-inner"
        popperClassName="ecos-dp-interval__popover-popper"
        arrowClassName={classNames('ecos-dp-interval__popover-arrow', {
          'ecos-dp-interval__popover-arrow_end': selectedPart === DateInputs.END
        })}
        defaultOpen={!!this.state.selectedPart}
        target={this.#tooltipId}
        placement="bottom"
        trigger="legacy"
        container={get(this.#componentRef, 'current', document.body)}
        toggle={this.handleClosePopover}
      >
        <PopoverHeader>{this.popoverLabel}</PopoverHeader>
        <PopoverBody
          className={classNames(
            'ecos-dp-interval__popover-content',
            `ecos-dp-interval__popover-content_${this.selectedType.toLowerCase()}`
          )}
        >
          <Select narrow options={this.dateTypeOptions} value={selectedType} onChange={this.handleChangeDateType} />
          {this.renderInput()}
        </PopoverBody>
      </UncontrolledPopover>
    );
  }

  render() {
    const { selectedPart } = this.state;

    return (
      <div ref={this.#componentRef} className="ecos-dp-interval">
        <div id={this.#tooltipId} className="ecos-dp-interval__inputs">
          <Input
            className={classNames('ecos-dp-interval__inputs-item ecos-dp-interval__inputs-item_start', {
              'ecos-dp-interval__inputs-item_selected': selectedPart === DateInputs.START
            })}
            align="center"
            readOnly
            narrow
            placeholder="- - -"
            value={this.startLabel}
            onClick={() => this.handleClick(DateInputs.START)}
          />
          <Input
            className={classNames('ecos-dp-interval__inputs-item ecos-dp-interval__inputs-item_end', {
              'ecos-dp-interval__inputs-item_selected': selectedPart === DateInputs.END
            })}
            align="center"
            readOnly
            narrow
            placeholder="- - -"
            value={this.endLabel}
            onClick={() => this.handleClick(DateInputs.END)}
          />
        </div>

        {this.renderIntervalSelector()}
      </div>
    );
  }
}

export default DateIntervalPicker;
