import Flatpickr from 'flatpickr';
import l10n from 'flatpickr/dist/l10n';
import { convertFormatToMask, convertFormatToMoment } from 'formiojs/utils/utils';
import FormIOCalendarWidget from 'formiojs/widgets/CalendarWidget';
import get from 'lodash/get';
import moment from 'moment';

import { DateFormats } from '@/constants';
import { getCurrentLocale } from '@/helpers/util';

const CALENDAR_ICON_CLASSNAME = 'glyphicon-calendar';

export default class CalendarWidget extends FormIOCalendarWidget {
  static get defaultSettings() {
    return {
      ...FormIOCalendarWidget.defaultSettings,
      locale: l10n[getCurrentLocale()] || l10n.en
    };
  }

  get defaultSettings() {
    return CalendarWidget.defaultSettings;
  }

  onScrollWindow = () => {
    this.calendar.isOpen && this.calendar._positionCalendar.call(this.calendar);
  };

  getValue() {
    const value = super.getValue();
    if (!value) {
      return value;
    }

    if (this.settings.format && this.settings.format === DateFormats.DATE) {
      return moment(value).utcOffset(0, true).format();
    }

    return value;
  }

  resetStateCalendar = (selected, instance) => {
    const calendar = instance || this.calendar;
    const selectedDates = selected || get(calendar, 'selectedDates');

    if (calendar && selectedDates) {
      if (selectedDates.length === 0) {
        calendar.jumpToDate(new Date(), true);
      } else {
        const selectedDate = selectedDates[0];
        const currentMonth = calendar.currentMonth;
        const currentYear = calendar.currentYear;
        if (selectedDate.getMonth() !== currentMonth || selectedDate.getFullYear() !== currentYear) {
          calendar.jumpToDate(selectedDate, true);
        }
      }
    }
  };

  attach(input) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-795
    this.settings.disableMobile = 'true';

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-1456
    this.settings.onValueUpdate = () => {
      const format = convertFormatToMoment(this.settings.format);
      const value = this.calendar._input.value;
      const currentLocale = moment.locale();

      moment.locale('en');

      const dateInMoment = moment(value, format);

      if (dateInMoment.format(format) !== value && !format.toLowerCase().includes('a')) {
        this.calendar.setDate(this.calendar._input.value, true, this.settings.altFormat);
      }

      moment.locale(currentLocale);
    };

    this.settings.onClose = (selectedDates, dateStr, instance) => {
      this.resetStateCalendar(selectedDates, instance);
    };

    super.attach(input);

    this.settings.parseDate = (inputDate, format) => {
      this.enteredDate = inputDate;

      if (this.calendar) {
        this.calendar.clear();
      }

      const result = Flatpickr.parseDate(inputDate, format);
      if (result) {
        return result;
      }

      if (this.calendar) {
        this.calendar.close();
      }

      return result;
    };

    // Bug: https://github.com/flatpickr/flatpickr/issues/2047
    if (this._input) {
      this.calendar = new Flatpickr(this._input, this.settings);

      this.setInputMask(this.calendar._input, convertFormatToMask(this.settings.format));

      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1535
      this.removeEventListener(this.calendar._input, 'keydown');
      this.addEventListener(this.calendar._input, 'keydown', event => {
        if (event.keyCode === 13) {
          this.calendar.close();
        }
      });

      window.addEventListener('scroll', this.onScrollWindow, true);

      const icon = this._input.parentNode.querySelector(`.${CALENDAR_ICON_CLASSNAME}`);

      this.handleClickOutside = event => {
        if (
          this.calendar.isOpen &&
          !this.calendar._input.contains(event.target) &&
          !this.calendar.calendarContainer.contains(event.target) &&
          (!icon || (icon && !icon.contains(event.target)))
        ) {
          this.resetStateCalendar();
          this.calendar.close();
        }
      };

      document.addEventListener('click', this.handleClickOutside);
    }
  }

  destroy() {
    super.destroy();

    window.removeEventListener('scroll', this.onScrollWindow, true);

    if (this.handleClickOutside) {
      document.removeEventListener('click', this.handleClickOutside);
    }
  }
}
