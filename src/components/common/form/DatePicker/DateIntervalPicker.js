import React, { Component } from 'react';
import classNames from 'classnames';
import { Tooltip, Popover, UncontrolledPopover, PopoverHeader, PopoverBody } from 'reactstrap';

import { Select, Input, DatePicker } from '../';
import { prepareTooltipId } from '../../../../helpers/util';
import { t } from '../../../../helpers/export/util';

import './DateIntervalPicker.scss';

const DateInputs = {
  START: 'start',
  END: 'end'
};
const DateTypes = {
  RELATIVE: 'RELATIVE',
  ABSOLUTE: 'ABSOLUTE',
  CUSTOM: 'CUSTOM',
  TODAY: 'TODAY',
  NOW: 'NOW'
};
const Labels = {
  DATE_TYPE_RELATIVE: 'interval-picker.date-type.relative',
  DATE_TYPE_ABSOLUTE: 'interval-picker.date-type.absolute',
  DATE_TYPE_CUSTOM: 'interval-picker.date-type.custom',
  DATE_TYPE_TODAY: 'interval-picker.date-type.today',
  DATE_TYPE_NOW: 'interval-picker.date-type.now',

  DATE_INPUTS_START: 'interval-picker.date-inputs.start',
  DATE_INPUTS_END: 'interval-picker.date-inputs.end'
};

class DateIntervalPicker extends Component {
  state = {
    start: '',
    end: '',
    selectedPart: undefined,
    selectedType: DateTypes.RELATIVE
  };

  #tooltipId = prepareTooltipId();

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

  handleClick = selectedPart => {
    if (selectedPart !== this.state.selectedPart) {
      this.setState({ selectedPart: undefined }, () => this.setState({ selectedPart }));
      return;
    }

    this.setState({ selectedPart });
  };

  handleClosePopover = () => {
    if (this.state.selectedPart) {
      this.setState({ selectedPart: undefined });
    }
  };

  handleChangeDateType = selectedType => {
    this.setState({ selectedType });
  };

  renderIntervalSelector() {
    const { selectedPart, selectedType } = this.state;

    if (!selectedPart) {
      return;
    }

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
        container={document.querySelector(`#wrapper-${this.#tooltipId}`)}
        toggle={this.handleClosePopover}
      >
        <PopoverHeader>{this.popoverLabel}</PopoverHeader>
        <PopoverBody>
          <Select options={this.dateTypeOptions} value={selectedType} onChange={this.handleChangeDateType} />
          Legacy is a reactstrap special trigger value (outside of bootstrap's spec/standard). Before reactstrap correctly supported click
          and focus, it had a hybrid which was very useful and has been brought back as trigger="legacy". One advantage of the legacy
          trigger is that it allows the popover text to be selected while also closing when clicking outside the triggering element and
          popover itself.
        </PopoverBody>
      </UncontrolledPopover>
    );
  }

  render() {
    const { selectedPart } = this.state;

    return (
      <div className="ecos-dp-interval" id={'wrapper-' + this.#tooltipId}>
        <div id={this.#tooltipId} className="ecos-dp-interval__inputs">
          <Input
            className={classNames('ecos-dp-interval__inputs-item ecos-dp-interval__inputs-item_start', {
              'ecos-dp-interval__inputs-item_selected': selectedPart === DateInputs.START
            })}
            align="center"
            readOnly
            placeholder="- - -"
            onClick={() => this.handleClick(DateInputs.START)}
          />
          <Input
            className={classNames('ecos-dp-interval__inputs-item ecos-dp-interval__inputs-item_end', {
              'ecos-dp-interval__inputs-item_selected': selectedPart === DateInputs.END
            })}
            align="center"
            readOnly
            placeholder="- - -"
            onClick={() => this.handleClick(DateInputs.END)}
          />
        </div>

        {this.renderIntervalSelector()}
      </div>
    );
  }
}

export default DateIntervalPicker;
