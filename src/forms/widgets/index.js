import FormIOWidgets from 'formiojs/widgets';

import CalendarWidget from './override/CalendarWidget';

export default {
  ...FormIOWidgets,
  calendar: CalendarWidget
};
