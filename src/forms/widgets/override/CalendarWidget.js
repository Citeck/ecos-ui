import FromIOCalendarWidget from 'formiojs/widgets/CalendarWidget';
import { getCurrentLocale } from '../../../helpers/util';

export default class CalendarWidget extends FromIOCalendarWidget {
  static get defaultSettings() {
    return {
      ...FromIOCalendarWidget.defaultSettings,
      locale: getCurrentLocale() // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2912
    };
  }

  get defaultSettings() {
    return CalendarWidget.defaultSettings;
  }
}
