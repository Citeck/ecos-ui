import FormIOCalendarWidget from 'formiojs/widgets/CalendarWidget';
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

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-795
  attach(input) {
    this.settings.disableMobile = 'true';

    super.attach(input);
  }
}
