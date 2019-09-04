import FormIOFileComponent from 'formiojs/components/file/File';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../../constants/pageTabs';

export default class FileComponent extends FormIOFileComponent {
  createFileLink(file) {
    return file.originalName || file.name;

    // If we need a download link, uncomment this
    // const fileLink = super.createFileLink(file);
    // fileLink.setAttribute(IGNORE_TABS_HANDLER_ATTR_NAME, true);
    // return fileLink;
  }

  buildUpload() {
    const render = super.buildUpload();
    const allLinks = render.querySelectorAll('a');

    for (let i = 0; i < allLinks.length; i++) {
      allLinks[i].setAttribute(IGNORE_TABS_HANDLER_ATTR_NAME, true);
    }

    return render;
  }

  build() {
    this.disabled = this.shouldDisable;

    super.build();
  }
}
