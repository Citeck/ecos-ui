import React from 'react';
import { showModal } from './modal';
import ModelCreationForm from '../components/BPMNDesigner/ModelCreationForm';

export function showModelCreationForm(categoryId) {
  // TODO добавить проверку на существование хотя бы одной категории !!!

  return showModal({
    title: 'Создание модели бизнес процесса',
    content: <ModelCreationForm categoryId={categoryId} />
  });
}
