import '../../../forms/style.scss';
import '../../../forms/components';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { getCurrentLocale } from '../../../helpers/util';

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);

const currentLocale = getCurrentLocale();
setDefaultLocale(currentLocale);

//TODO: make normal component

export { default } from '../EcosForm';
