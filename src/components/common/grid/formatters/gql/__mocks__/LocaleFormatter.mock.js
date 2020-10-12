import LocaleServiceApi from '../../../../../../services/LocaleServiceApi';

jest.spyOn(LocaleServiceApi, 'getServerMessage').mockImplementation(({ value }) => {
  let label;

  switch (value) {
    case 'cancel':
      label = 'Отменить нормоконтроль';
      break;
    case 'exit':
      label = 'Завершить задачу';
      break;
    case 'answer':
      label = 'Вернуть на нормоконтроль';
      break;
    default:
      label = '';
  }

  return Promise.resolve(label);
});
