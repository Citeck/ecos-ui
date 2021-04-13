import React from 'react';
import ReactDOM from 'react-dom';
import ecosFetch from '../../helpers/ecosFetch';
import Records from '../../components/Records';
import { getSearchParams, t } from '../../helpers/util';
import DialogManager from '../../components/common/dialogs/Manager';
import EcosModal from '../../components/common/EcosModal';
import { i18nInit } from '../../i18n';
import CopyToClipboard from '../../helpers/copyToClipboard';

const EDITOR_REC_SOURCE_PREFIX = 'alfresco/cmmn-legacy-editor@';

let savingInProgress = false;

export default class LegacyCmmnEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    };
  }

  componentDidMount() {
    this._initEditorHeader();

    const { editorRootId } = this.props;

    const cancelBtn = document.getElementById('legacy-cmmn-editor-cancel-btn');
    cancelBtn.onclick = () => this._onCancelButtonClick();
    cancelBtn.innerText = t('legacy-cmmn-editor.button.cancel.label');

    this._initEditorRequirements()
      .then(({ ko, koutils, templateNodeRef }) => {
        const Activity = koutils.koclass('cases.activities.Activity');
        const activity = new Activity({
          nodeRef: templateNodeRef,
          startable: false,
          stoppable: false,
          editable: true,
          removable: false,
          composite: true
        });

        ko.applyBindings(activity, document.getElementById(editorRootId));
        window.Alfresco.util.createTwister(`${editorRootId}-heading`, 'case-activities', { panel: `${editorRootId}-body` });
        window.YAHOO.Bubbling.on('metadataRefresh', function() {
          activity.reload(true);
        });

        const saveBtn = document.getElementById('legacy-cmmn-editor-save-btn');
        saveBtn.onclick = () => this._onSaveButtonClick();
        saveBtn.innerText = t('legacy-cmmn-editor.button.save.label');
        saveBtn.removeAttribute('hidden');

        const copyTemplateNodeRefBtn = document.getElementById('legacy-cmmn-editor-copy-tmpl-node-ref-btn');
        copyTemplateNodeRefBtn.onclick = () => this._onCopyTemplateNodeRefButtonClick();
        copyTemplateNodeRefBtn.innerText = t('legacy-cmmn-editor.button.copy-tmpl-node-ref.label');

        this.setState({
          isLoading: false,
          templateNodeRef
        });
      })
      .catch(e => {
        console.log('CMMN template loading error', e);
        this.setState({
          isLoading: false
        });
        DialogManager.showInfoDialog({
          title: 'legacy-cmmn-editor.loading.error.title',
          text: 'legacy-cmmn-editor.loading.error.text'
        });
      });
  }

  async _initEditorRequirements() {
    const createVarsPromise = this._initCreateVariants();
    const templateNodeRefPromise = this._initNodeRefToEdit();

    return new Promise((resolve, reject) => {
      // messages.js doesn't load until we load any share page
      ecosFetch('/share/page/dev-tools')
        .then(r => r.text())
        .then(() => {
          const scripts = [
            '/share/service/messages.js?locale=ru',
            '/share/res/js/alfresco.js',
            '/share/res/modules/editors/tiny_mce.js',
            '/share/res/modules/editors/yui_editor.js',
            '/share/res/js/forms-runtime.js'
          ];

          const scriptsPromise = new Promise((resolve, reject) => {
            const requireScriptByIdx = idx => {
              if (idx >= scripts.length) {
                resolve();
              } else {
                window.require(
                  [scripts[idx]],
                  () => {
                    requireScriptByIdx(idx + 1);
                  },
                  e => reject(e)
                );
              }
            };
            requireScriptByIdx(0);
          });

          scriptsPromise
            .then(() => {
              window.require(
                [
                  'lib/knockout',
                  'citeck/utils/knockout.utils',
                  'citeck/utils/knockout.yui',
                  'citeck/components/form/constraints',
                  '/legacy/cmmn-editor/case-activities.js'
                ],
                (ko, koutils) => {
                  Promise.all([templateNodeRefPromise, createVarsPromise])
                    .then(([templateNodeRef]) => {
                      resolve({
                        ko,
                        koutils,
                        templateNodeRef
                      });
                    })
                    .catch(e => reject(e));
                },
                e => reject(e)
              );
            })
            .catch(e => reject(e));
        })
        .catch(e => reject(e));
    });
  }

  async _onCopyTemplateNodeRefButtonClick() {
    const { templateNodeRef } = this.state;
    CopyToClipboard.copy(templateNodeRef);
  }

  async _onCancelButtonClick() {
    if (this.state.templateNodeRef) {
      try {
        await Records.remove(EDITOR_REC_SOURCE_PREFIX + this.state.templateNodeRef);
      } catch (e) {
        // successful deleting of temp node is not mandatory condition to close editor
      }
    }
    this._closeEditor();
  }

  async _onSaveButtonClick() {
    if (savingInProgress) {
      return;
    }
    savingInProgress = true;

    this.setState({ isLoading: true });

    try {
      const templateRecordRef = EDITOR_REC_SOURCE_PREFIX + this.state.templateNodeRef;
      const record = Records.get(templateRecordRef);
      record.att('save', true);
      await record.save();
      this._closeEditor();
    } catch (e) {
      console.log('CMMN template save error', e);
      this.setState({
        isLoading: false
      });
      DialogManager.showInfoDialog({
        title: 'legacy-cmmn-editor.save.error.title',
        text: 'legacy-cmmn-editor.save.error.text'
      });
    } finally {
      savingInProgress = false;
    }
  }

  _closeEditor() {
    window.close();
    // redirect to CMMN processes journal if tab can't be closed
    window.location = '/v2/admin?journalId=cmmn-process-def&type=JOURNAL';
  }

  async _initEditorHeader() {
    const { templateRef } = this.props;
    let displayName = (await Records.get(templateRef).load('?disp')) || '';
    if (!displayName) {
      displayName = templateRef.substring(templateRef.indexOf('@') + 1);
    }
    let header = t('legacy-cmmn-editor.header');
    if (displayName) {
      header += ' - ' + displayName;
    }
    document.getElementById('page-node-info-label').innerText = header;
  }

  async _initNodeRefToEdit() {
    const { templateRef } = this.props;

    const rec = Records.get(EDITOR_REC_SOURCE_PREFIX);
    rec.att('templateRef', templateRef);

    const tempRefId = (await rec.save()).id;
    return tempRefId.substring(tempRefId.indexOf('@') + 1);
  }

  async _initCreateVariants() {
    const variants = await ecosFetch('/gateway/alfresco/alfresco/s/citeck/activity-create-variants').then(res => res.json());
    const createMenu = this._formatMenu(variants, null, {});
    const createMenuHtml = this._formatCreateMenuHtml(createMenu);

    let template = document.getElementById('add-activity');

    template.innerHTML = `
      <!-- ko if: composite() && editable() -->
      <div data-bind="attr: { id: nodeRef() + '-activity-create-menu' }"
           class="yui-overlay yuimenu button-menu" style="visibility: hidden">
        <div class="bd">
          <ul class="first-of-type">${createMenuHtml}</ul>
        </div>
      </div>
      <span title="Создать..."
            data-bind="yuiButton: { type: 'menu', menu: nodeRef() + '-activity-create-menu' }, click: function() {}, clickBubble: false">
        <span class="first-child action create">
          <button>&nbsp;</button>
        </span>
      </span>
      <!-- /ko -->
    `;
  }

  _formatCreateMenuHtml(elements) {
    let result = '';
    for (let elementKey in elements) {
      if (!elements.hasOwnProperty(elementKey)) {
        continue;
      }
      const element = elements[elementKey];
      result += `<li class="yuimenuitem">
                    <span class="yuimenuitemlabel" >${element.title}</span>
                    <div class="yuimenu" style="visibility: hidden">
                        <div class="bd">
                            <ul>`;
      for (let variant of element.variants) {
        let paramsJson = JSON.stringify(variant.viewParams || {});
        paramsJson = paramsJson.replaceAll('"', "'");
        result += `<li class="yuimenuitem">
                        <a class="yuimenuitemlabel" data-bind="click: $data.add.bind($data, '${variant.type}', '${variant.formId ||
          ''}', ${paramsJson})">${variant.title}</a>
                    </li>`;
      }

      result += `</ul></div></div></li>`;
    }

    return result;
  }

  _formatMenu(variants, parent, menuRoot) {
    const getSubMenu = function(variant) {
      let subMenu = menuRoot[variant.id];
      if (!subMenu) {
        subMenu = {
          title: variant.title,
          variants: []
        };
        menuRoot[variant.id] = subMenu;
      }
      return subMenu;
    };

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (variant.canBeCreated) {
        const subMenu = getSubMenu(parent || variant);
        subMenu.variants.push(variant);
      }

      this._formatMenu(variant.children, variant, menuRoot);
    }

    return menuRoot;
  }

  render() {
    const { editorRootId } = this.props;
    const { isLoading } = this.state;

    return (
      <>
        <EcosModal isOpen={isLoading} isLoading={true} />
        <div
          id={editorRootId}
          dangerouslySetInnerHTML={{
            __html: `
        <h2 id="${editorRootId}-heading" class="thin dark">
          ${t('legacy-cmmn-editor.header2')}
          <span class="alfresco-twister-actions">
            <!-- ko template: { name: 'add-activity' } --><!-- /ko -->
          </span>
        </h2>
        <div id="${editorRootId}-body" class="panel-body">
          <span class="header right" data-bind="visible: hasActivities()">
            <span class="type">Тип</span>
            <span class="start">Начало</span>
            <span class="end">Завершение</span>
            <span class="sla">SLA</span>
          </span>
          <div id="${editorRootId}-DnD" class="dnd-area" data-bind="DDRoot: { data: $data, errorMessage: 'Ошибка' }">
            <!-- ko template: { name: 'activities' } --><!-- /ko -->
          </div>
        </div>
    `
          }}
        />
      </>
    );
  }

  static async renderEditor(containerId) {
    await i18nInit({});

    const { templateRef } = getSearchParams();
    const editorRootId = containerId + '-legacy-editor-root-id';

    ReactDOM.render(
      React.createElement(LegacyCmmnEditor, {
        editorRootId,
        templateRef
      }),
      document.getElementById(containerId)
    );
  }
}
