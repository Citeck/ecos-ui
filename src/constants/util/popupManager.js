import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import { TunableDialog } from '../../components/common/dialogs';
import EcosModal from '../../components/common/EcosModal';
import { t } from '../../helpers/util';
import { Btn } from '../../components/common/btns';

class PopupManager {
  constructor() {
    console.warn('PopupManager');
  }

  #modal = null;
  #container = null;

  zIndex = 15;

  get defaultDisplayMessageConfig() {
    return {
      title: null,
      text: null,
      spanClass: 'message',
      displayTime: 2.5,
      // effect: YAHOO.widget.ContainerEffect.FADE,
      effectDuration: 0.5,
      visible: false,
      noEscape: false
    };
  }

  get defaultDisplayPromptConfig() {
    return {
      title: null,
      text: null,
      icon: null,
      close: false,
      constraintoviewport: true,
      draggable: true,
      effect: null,
      effectDuration: 0.5,
      modal: true,
      visible: false,
      noEscape: false,
      buttons: [
        {
          text: null,
          handler: function() {
            this.destroy();
          },
          isDefault: true
        }
      ]
    };
  }

  get defaultGetUserInputConfig() {
    return {
      title: null,
      text: null,
      input: 'textarea',
      value: '',
      icon: null,
      close: true,
      constraintoviewport: true,
      draggable: true,
      effect: null,
      effectDuration: 0.5,
      modal: true,
      visible: false,
      initialShow: true,
      noEscape: true,
      html: null,
      callback: null,
      buttons: [
        {
          text: null,
          handler: null,
          isDefault: true
        },
        {
          text: null,
          handler: function() {
            this.destroy();
          }
        }
      ]
    };
  }

  createModal(props, container = document.body) {
    if (!this.#modal) {
      return;
    }

    this.#container = document.createElement('div');

    this.render({
      ...props,
      onClose: this.onClose
    });

    container.appendChild(this.#container);
  }

  render = (props = {}, callback = () => null) => {
    ReactDOM.render(React.createElement(this.#modal, props), this.#container, callback);
  };

  destroyModal = () => {
    document.body.removeChild(this.#container);
    ReactDOM.unmountComponentAtNode(this.#container);
    this.#modal = null;
    this.#container = null;
  };

  onClose = () => {
    if (!this.#modal || !this.#container) {
      return;
    }

    this.render({ isOpen: false }, this.destroyModal);
  };

  destroy() {
    this.onClose();
  }

  displayForm(k) {
    console.warn('displayForm', { k });
    // var n = k.properties.htmlid || Alfresco.util.generateDomId();
    // k.properties.htmlid = n;
    // var h = this.displayWebscript({
    //   title: k.title,
    //   url: Alfresco.constants.URL_SERVICECONTEXT + "components/form",
    //   properties: YAHOO.lang.merge({
    //     submitType: "json",
    //     showCaption: false,
    //     formUI: true,
    //     showCancelButton: true
    //   }, k.properties)
    // });
    // YAHOO.Bubbling.on("formContentReady", function m(q, o) {
    //   if (Alfresco.util.hasEventInterest(n + "-form", o)) {
    //     var p = o[1].buttons.submit;
    //     p.set("label", Alfresco.util.message("label.ok"));
    //     var r = o[1].buttons.cancel;
    //     if (r) {
    //       r.addListener("click", this.panel.destroy, this.panel, true)
    //     }
    //   }
    // }, {
    //   panel: h,
    //   config: k
    // });
    // YAHOO.Bubbling.on("beforeFormRuntimeInit", function l(p, o) {
    //   if (Alfresco.util.hasEventInterest(n + "-form", o)) {
    //     o[1].runtime.setAJAXSubmit(true, {
    //       successCallback: {
    //         fn: function q(r) {
    //           this.panel.destroy();
    //           if (this.config.success && YAHOO.lang.isFunction(this.config.success.fn)) {
    //             this.config.success.fn.call(this.config.success.scope || {}, r, this.config.success.obj)
    //           }
    //         },
    //         scope: this
    //       },
    //       successMessage: this.config.successMessage,
    //       failureCallback: this.config.success,
    //       failureMessage: this.config.failureMessage
    //     })
    //   }
    // }, {
    //   panel: h,
    //   config: k
    // })
  }

  displayMessage(h, l) {
    console.warn('displayMessage', { h, l });
    // var l = l || document.body;
    // var o = YAHOO.lang.merge(this.defaultDisplayMessageConfig, h);
    // if (o.text === undefined) {
    //   throw new Error("Property text in userConfig must be set")
    // }
    // var k = {
    //   modal: false,
    //   visible: o.visible,
    //   close: false,
    //   draggable: false,
    //   effect: {
    //     effect: o.effect,
    //     duration: o.effectDuration
    //   },
    //   zIndex: (o.zIndex == undefined ? 0 : o.zIndex) + this.zIndex++
    // };
    // if (o.effect === null || YAHOO.env.ua.ie > 0) {
    //   delete k.effect
    // }
    // var m = new YAHOO.widget.Dialog("message",k);
    // m.destroyWithAnimationsStop = function() {
    //   if (m._fadingIn || m._fadingOut) {
    //     if (m._cachedEffects && m._cachedEffects.length > 0) {
    //       for (var p = 0; p < m._cachedEffects.length; p++) {
    //         var q = m._cachedEffects[p];
    //         if (q.animIn) {
    //           q.animIn.stop()
    //         }
    //         if (q.animOut) {
    //           q.animOut.stop()
    //         }
    //       }
    //     }
    //   }
    //   m.destroy()
    // }
    // ;
    // var n = "<span class='" + o.spanClass + "'>" + (o.noEscape ? o.text : b(o.text)) + "</span>";
    // m.setBody(n);
    // m.render(l);
    // m.center();
    // if (o.displayTime > 0) {
    //   m.subscribe("show", this._delayPopupHide, {
    //     popup: m,
    //     displayTime: (o.displayTime * 1000)
    //   }, true)
    // }
    // m.show();
    // return m
  }

  displayPrompt(props = {}, container = document.body) {
    const { buttons = [], text, title } = props;
    console.warn('displayPrompt', { props, container });

    this.#modal = TunableDialog;

    this.createModal(
      {
        title,
        isOpen: true,
        content: text,
        footer: buttons.map((props = {}) => (
          <Btn
            key={props.text}
            className={classNames('', {
              'ecos-btn_blue ecos-btn_hover_light-blue': !props.isDefault
            })}
            onClick={props.handler.bind(this)}
          >
            {t(props.text)}
          </Btn>
        ))
      },
      container
    );
  }

  displayWebscript(k) {
    console.warn('displayWebscript', { k });
    // k.properties.htmlid = k.properties.htmlid || Alfresco.util.generateDomId();
    // var l = new YAHOO.widget.Dialog(k.properties.htmlid + "-panel",{
    //   visible: false,
    //   modal: true,
    //   constraintoviewport: true,
    //   fixedcenter: "contained",
    //   postmethod: "none"
    // });
    // Alfresco.util.Ajax.request({
    //   method: k.method || Alfresco.util.Ajax.GET,
    //   url: k.url,
    //   dataObj: k.properties,
    //   successCallback: {
    //     fn: function h(m, n) {
    //       if (n.title) {
    //         l.setHeader(n.title)
    //       }
    //       l.setBody(m.serverResponse.responseText);
    //       l.render(document.body);
    //       l.show()
    //     },
    //     scope: this,
    //     obj: k
    //   },
    //   failureMessage: Alfresco.util.message("message.failure"),
    //   scope: this,
    //   execScripts: true
    // });
    // return l
  }

  getUserInput(l) {
    console.warn('getUserInput', { l });
    // if (this.defaultGetUserInputConfig.buttons[0].text === null) {
    //   this.defaultGetUserInputConfig.buttons[0].text = Alfresco.util.message("button.ok", this.name)
    // }
    // if (this.defaultGetUserInputConfig.buttons[1].text === null) {
    //   this.defaultGetUserInputConfig.buttons[1].text = Alfresco.util.message("button.cancel", this.name)
    // }
    // var p = YAHOO.lang.merge(this.defaultGetUserInputConfig, l);
    // var h = new YAHOO.widget.SimpleDialog("userInput",{
    //   close: p.close,
    //   constraintoviewport: p.constraintoviewport,
    //   draggable: p.draggable,
    //   effect: p.effect,
    //   modal: p.modal,
    //   visible: p.visible,
    //   zIndex: this.zIndex++
    // });
    // if (p.title) {
    //   h.setHeader(b(p.title))
    // }
    // var m = p.html
    //   , o = Alfresco.util.generateDomId();
    // if (m === null) {
    //   m = "";
    //   if (p.text) {
    //     m += '<label for="' + o + '">' + (p.noEscape ? p.text : b(p.text)) + "</label><br/>"
    //   }
    //   if (p.input == "textarea") {
    //     m += '<textarea id="' + o + '" tabindex="0">' + p.value + "</textarea>"
    //   } else {
    //     if (p.input == "text") {
    //       m += '<input id="' + o + '" tabindex="0" type="text" value="' + p.value + '"/>'
    //     }
    //   }
    // }
    // h.setBody(m);
    // if (p.icon) {
    //   h.cfg.setProperty("icon", p.icon)
    // }
    // if (p.buttons) {
    //   if (p.okButtonText) {
    //     p.buttons[0].text = p.okButtonText
    //   }
    //   if (typeof l.buttons == "undefined" || typeof l.buttons[0] == "undefined") {
    //     p.buttons[0].handler = {
    //       fn: function(q, t) {
    //         var r = null;
    //         if (YUIDom.get(t.id)) {
    //           var s = YUIDom.get(t.id);
    //           r = YAHOO.lang.trim(s.value || s.text)
    //         }
    //         this.destroy();
    //         if (t.callback.fn) {
    //           t.callback.fn.call(t.callback.scope || window, r, t.callback.obj)
    //         }
    //       },
    //       obj: {
    //         id: o,
    //         callback: p.callback
    //       }
    //     }
    //   }
    //   h.cfg.queueProperty("buttons", p.buttons)
    // }
    // h.render(document.body);
    // if (h.getButtons().length > 0) {
    //   var n = h.getButtons()[0];
    //   YAHOO.util.Event.addListener(o, "keyup", function(q, r) {
    //     r.set("disabled", YAHOO.lang.trim(this.value || this.text || "").length == 0)
    //   }, n);
    //   n.set("disabled", YAHOO.lang.trim(p.value).length == 0)
    // }
    // h.center();
    // if (p.initialShow) {
    //   h.show()
    // }
    // if (p.value !== "") {
    //   YUIDom.get(o).selectionStart = 0;
    //   YUIDom.get(o).selectionEnd = p.value.length
    // }
    // var k = new YAHOO.util.KeyListener(document,{
    //   keys: YAHOO.util.KeyListener.KEY.ESCAPE
    // },{
    //   fn: function(r, q) {
    //     this.destroy()
    //   },
    //   scope: h,
    //   correctScope: true
    // });
    // k.enable();
    // if (YUIDom.get(o)) {
    //   YUIDom.get(o).focus()
    // }
    // return h
  }

  _delayPopupHide() {
    console.warn('_delayPopupHide');
    // YAHOO.lang.later(this.displayTime, this, function() {
    //   this.popup.destroy()
    // })
  }
}

export default new PopupManager();
