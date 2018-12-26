import { showModal } from './modal';
import ModelCreationForm from '../components/BPMNDesigner/ModelCreationForm';

export function showModelCreationForm() {
  return showModal({
    title: 'Создание модели бизнес процесса',
    content: ModelCreationForm(),
    buttons: [
      {
        label: 'Отмена',
        isCloseButton: true,
        className: 'button_light'
      },
      {
        label: 'Создать модель',
        onClick: () => {
          console.log('gdgsdhgds');
        }
      }
    ]
  });
}
