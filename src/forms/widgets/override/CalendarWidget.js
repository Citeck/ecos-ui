import FormIOCalendarWidget from 'formiojs/widgets/CalendarWidget';
import { convertFormatToMask, convertFormatToMoment } from 'formiojs/utils/utils';
import moment from 'moment';

import { getCurrentLocale } from '../../../helpers/util';
import 'flatpickr/dist/l10n/ru.js';

export default class CalendarWidget extends FormIOCalendarWidget {
  static get defaultSettings() {
    return {
      ...FormIOCalendarWidget.defaultSettings,
      locale: getCurrentLocale() // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2912
    };
  }

  get defaultSettings() {
    return CalendarWidget.defaultSettings;
  }

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

      if (dateInMoment.format(format) !== value) {
        this.calendar.setDate(this.calendar._input.value, true, this.settings.altFormat);
      }

      moment.locale(currentLocale);
    };

    super.attach(input);

    // Bug: https://github.com/flatpickr/flatpickr/issues/2047
    if (this._input) {
      this.setInputMask(this.calendar._input, convertFormatToMask(this.settings.format));

      // Cause: https://citeck.atlassian.net/browse/ECOSUI-1535
      this.removeEventListener(this.calendar._input, 'keydown');
      this.addEventListener(this.calendar._input, 'keydown', event => {
        if (event.keyCode === 13) {
          this.calendar.close();
        }
      });
    }
  }
}
