import { cloneDeep, isEmpty } from 'lodash';
import FormIOFileComponent from 'formiojs/components/file/File';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../../constants/pageTabs';
import { isNewVersionPage } from '../../../../helpers/urls';
import { URL } from '../../../../constants';

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
    if (this.viewOnly) {
      return this.viewOnlyBuild();
    }

    this.disabled = this.shouldDisable;

    super.build();

    this.createInlineSaveButton();
  }

  setupValueElement(element) {
    const value = this.getValue();
    const valueView = this.getView(value);

    if (valueView instanceof Element) {
      element.innerHTML = '';
      element.appendChild(valueView);
    } else {
      element.innerHTML = valueView;
    }
  }

  getView(value) {
    if (this.isEmpty(value)) {
      return this.defaultViewOnlyValue;
    }

    const classList = ['file-list-view-mode'];

    if (this.component && this.component.hideLabel) {
      classList.push('file-list-view-mode_hide-label');
    }

    return this.ce(
      'ul',
      { class: classList.join(' ') },
      Array.isArray(value) ? value.map(fileInfo => this.createFileListItemViewMode(fileInfo)) : this.createFileListItemViewMode(value)
    );
  }

  createFileListItemViewMode(fileInfo) {
    return this.ce('li', { class: 'file-item_view-mode' }, this.createFileLinkViewMode(fileInfo));
  }

  createFileLinkViewMode(f) {
    const file = cloneDeep(f);

    if (isNewVersionPage()) {
      file.url = file.url.replace(/\/share\/page\/(.*\/)?card-details/, URL.DASHBOARD);
      file.url = file.url.replace('nodeRef', 'recordRef');
    }

    if (this.options.uploadOnly) {
      return file.originalName || file.name;
    }

    const linkAttributes = {
      href: file.url,
      target: '_blank'
    };

    if (!isNewVersionPage(file.url)) {
      linkAttributes[IGNORE_TABS_HANDLER_ATTR_NAME] = true;
    }

    return this.ce('a', linkAttributes, file.originalName || file.name);
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2667
  setValue(value) {
    if (!isEmpty(value) && !Array.isArray(value)) {
      value = [value];
    }
    super.setValue(value);
  }
}
