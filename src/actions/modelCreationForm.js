import React from 'react';
import { showModal } from './modal';
import ModelCreationForm from '../components/BPMNDesigner/ModelCreationForm';

export function showModelCreationForm() {
  return showModal({
    title: 'Создание модели бизнес процесса',
    content: <ModelCreationForm />
  });
}
