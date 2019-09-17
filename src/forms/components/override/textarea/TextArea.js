import Formio from 'formiojs/Formio';
import FormIOTextAreaComponent from 'formiojs/components/textarea/TextArea';
const ACEJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.1/ace.js';

export default class TextAreaComponent extends FormIOTextAreaComponent {
  addCKE(element, settings, onChange) {
    /*
     * Cause: https://citeck.atlassian.net/browse/ECOSCOM-2477
     *
     * В Base.js в методе addCKE происходит подключение библиотеки ckeditor через функцию Formio.requireLibrary
     * По какой-то причине объект ClassicEditor из библиотеки ckeditor не попадает в глобальную область видимости,
     * в функции requireLibrary запускается бесконечный setInterval, ожидающий появление ClassicEditor в window.
     *
     * Запуск Formio.requireLibrary('ace', 'ace', ACEJS_URL, true); перед super.addCKE
     * магическим образом решает эту проблему. Пока оставляю этот хак.
     *
     * TODO: найти причину такого поведения
     */
    Formio.requireLibrary('ace', 'ace', ACEJS_URL, true);
    return super.addCKE(element, settings, onChange);
  }

  addQuill(element, settings, onChange) {
    /*
     * Cause: https://citeck.atlassian.net/browse/ECOSCOM-2477
     * См. this.addCKE
     * Здесь аналогичная ситуация, только для Quill
     */
    Formio.requireLibrary('ace', 'ace', ACEJS_URL, true);
    return super.addQuill(element, settings, onChange);
  }
}
