import '../../../src/forms/style.scss';
import customFormComponents from '../../../src/forms/components';
import { linkBuilderEditForms } from '../../../src/forms/components/builder';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { getCurrentLocale } from '../../../src/helpers/util';

import { EcosForm } from '../../../src/components/EcosForm/EcosForm';

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);

const currentLocale = getCurrentLocale();
setDefaultLocale(currentLocale);

// TODO export linkEditForms
linkBuilderEditForms(customFormComponents);

export default EcosForm;
