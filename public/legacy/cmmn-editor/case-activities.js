define(['lib/knockout', 'citeck/utils/knockout.utils', 'jquery', 'js/citeck/modules/utils/citeck'], function (ko, koutils, $) {

  var koclass = koutils.koclass,
    PopupManager = Alfresco.util.PopupManager,
    Ajax = Alfresco.util.Ajax,
    msg = Alfresco.util.message,
    dateFormat = msg('date-format.shortDate'),
    timeFormat = msg('date-format.shortTime');

  var Dom = YAHOO.util.Dom,
    Event = YAHOO.util.Event,
    DDM = YAHOO.util.DragDropMgr;

  var s = String,
    d = Date,
    n = Number,
    b = Boolean,
    Activity = koclass('cases.activities.Activity');

  var formatDate = function (date, format, defaultValue) {
    return date ? Alfresco.util.formatDate(date, format) : defaultValue;
  };

  var confirmAndDo = function (text, title, scope, perform) {
    PopupManager.displayPrompt({
      text: text,
      title: title,
      buttons: [
        {
          text: msg("actions.button.ok"),
          handler: function () {
            perform.call(scope);
            this.destroy();
          }
        },
        {
          text: msg("actions.button.cancel"),
          handler: function () {
            this.destroy();
          },
          isDefault: true
        }
      ]
    });
  }

  Activity
    .key('nodeRef', s)

    .property('title', s)
    .property('type', s)
    .property('index', n)
    .property('typeTitle', s)
    .property('description', s)
    .property('plannedStartDate', d)
    .property('plannedEndDate', d)
    .property('actualStartDate', d)
    .property('actualEndDate', d)
    .property('expectedPerformTime', n)

    .computed('started', function () {
      return this.actualStartDate() != null;
    })
    .computed('stopped', function () {
      return this.actualEndDate() != null;
    })

    .computed('startDate', function () {
      return this.actualStartDate() || this.plannedStartDate();
    })
    .computed('endDate', function () {
      return this.actualEndDate() || this.plannedEndDate();
    })

    .computed('startDateText', function () {
      return formatDate(this.startDate(), dateFormat, "-");
    })
    .computed('startTimeText', function () {
      return formatDate(this.startDate(), timeFormat, "");
    })
    .computed('endDateText', function () {
      return formatDate(this.endDate(), dateFormat, "-");
    })
    .computed('endTimeText', function () {
      return formatDate(this.endDate(), timeFormat, "");
    })

    .property('startable', b)
    .property('stoppable', b)
    .property('editable', b)
    .property('removable', b)
    .property('composite', b)

    .property('activities', [Activity])
    .computed('hasActivities', function () {
      return this.composite() && this.activities().length > 0;
    })

    .load('activities', koutils.simpleLoad({
      url: Alfresco.constants.PROXY_URI + 'citeck/cases/activities?nodeRef={nodeRef}'
    }))

    .load('*', koutils.simpleLoad({
      url: Alfresco.constants.PROXY_URI + 'citeck/cases/activity?nodeRef={nodeRef}'
    }))

    .method('reload', function (recurse) {
      this.title.reload();
      this.activities.reload();

      if (recurse && this.composite() && this.activities.loaded()) {
        _.each(this.activities(), function (activity) {
          activity.reload(recurse);
        });
      }

      YAHOO.Bubbling.fire("activitiesWereReloaded");
    })

    .method('add', function (type, viewId, viewParams) {
      Citeck.forms.dialog(type, viewId, {
        scope: this,
        fn: function (activity) {
          this.activities.push(new Activity(activity.nodeRef));
          YAHOO.Bubbling.fire("activityWasUpdated", {
            nodeRef: this.nodeRef()
          });
        }
      }, _.extend({
        title: msg("button.create"),
        destination: this.nodeRef(),
        destinationAssoc: 'activ:activities'
      }, viewParams));
    })
    .method('edit', function () {
      Citeck.forms.dialog(this.nodeRef(), null, {scope: this, fn: this.reload});
    })
    .method('remove', function (activity) {
      confirmAndDo(
        msg("message.confirm.delete"),
        msg("message.confirm.delete.1.title"),
        this,
        function () {
          Ajax.jsonDelete({
            url: Alfresco.constants.PROXY_URI + "citeck/node?nodeRef=" + activity.nodeRef(),
            successCallback: {
              scope: this,
              fn: function () {
                this.activities.remove(activity);
                YAHOO.Bubbling.fire("activityWasUpdated", {nodeRef: this.nodeRef()});
              }
            }
          });
        }
      );
    })

    .method('start', function () {
      confirmAndDo(
        msg("message.confirm.task.start"),
        msg("message.confirm.title"),
        this,
        function () {
          Ajax.jsonPost({
            url: Alfresco.constants.PROXY_URI + "citeck/case-activity/start-activity?nodeRef=" + this.nodeRef(),
            successCallback: {
              scope: this,
              fn: function () {
                YAHOO.Bubbling.fire("metadataRefresh");
              }
            }
          })
        }
      );
    })
    .method('stop', function () {
      confirmAndDo(
        msg("message.confirm.task.stop"),
        msg("message.confirm.title"),
        this,
        function () {
          Ajax.jsonPost({
            url: Alfresco.constants.PROXY_URI + "citeck/case-activity/stop-activity?nodeRef=" + this.nodeRef(),
            successCallback: {
              scope: this,
              fn: function () {
                YAHOO.Bubbling.fire("metadataRefresh");
              }
            }
          });
        }
      );
    })


    .property('_opened', b)
    .computed('opened', {
      read: function () {
        if (!this.composite()) return false;
        if (this._opened.loaded()) return this._opened();
        return this.composite() && this.started() && !this.stopped();
      },
      write: function (value) {
        this._opened(value);
      }
    })
    .computed('closed', function () {
      return !this.opened();
    })
    .method('toggle', function () {
      this.opened(!this.opened());
    })
  ;


// ----------------------
// Drag and Drop support
// ----------------------

  DDList = function (id, sGroup, config) {
    DDList.superclass.constructor.call(this, id, sGroup, config);

    var el = this.getDragEl();
    Dom.setStyle(el, "opacity", 0.7);

    this.goingUp = false;
    this.lastY = 0;

    this.data = config.data;
  };

  YAHOO.extend(DDList, YAHOO.util.DDProxy, {
    startDrag: function (x, y) {
      var dragEl = $(this.getDragEl()),
        clickEl = $(this.getEl());

      clickEl
        .css("visibility", "hidden")
        .addClass("pseudo-item");

      dragEl
        .html(clickEl.html())
        .css("color", Dom.getStyle(clickEl, "color"))
        .css("backgroundColor", Dom.getStyle(clickEl, "backgroundColor"))
        .css("border", "2px solid gray");

      $(".right", dragEl).css("display", "none");
      $("ul", dragEl).css("display", "none")
    },

    endDrag: function (e) {
      var self = this;

      var source = this.getEl();
      var proxy = this.getDragEl();

      // hide proxy element
      $(proxy).css("visibility", "hidden");
      $(source).css("visibility", "");

      var activityRef = $(source).attr("data-noderef");
      parentRef = $(source).parent().attr("data-noderef");
      index = $(source).parent().children().length > 1 ? $(source).index() : 0;

      if (activityRef == parentRef) {
        return;
      }

      YAHOO.util.Connect.asyncRequest("POST", self._buildUrlParams(activityRef, parentRef, index), {
        success: function (response) {
          YAHOO.Bubbling.fire("movement-of-activity-done", {
            parentRef: parentRef,
            index: index,
            data: self.data
          })
        },
        failure: function (response) {
          YAHOO.Bubbling.fire("movement-of-activity-undone", {
            parentRef: parentRef,
            index: index,
            data: self.data
          })
        }
      });
    },

    onDragDrop: function (e, id) {
      if (DDM.interactionInfo.drop.length === 1) {
        var pt = DDM.interactionInfo.point;
        var region = DDM.interactionInfo.sourceRegion;

        if (!region.intersect(pt)) {
          var destEl = Dom.get(id);
          var destDD = DDM.getDDById(id);

          destEl.appendChild(this.getEl());
          destDD.isEmpty = false;
          DDM.refreshCache();
        }
      }
    },

    onDrag: function (e) {
      var y = Event.getPageY(e);

      if (y < this.lastY) {
        this.goingUp = true;
      } else if (y > this.lastY) {
        this.goingUp = false;
      }

      this.lastY = y;
    },

    onDragOver: function (e, id) {
      var srcEl = this.getEl();
      var destEl = Dom.get(id);

      if (destEl.tagName == "LI") {
        var orig_p = srcEl.parentNode;
        var p = destEl.parentNode;

        if (destEl.classList.contains("empty-message") || this.goingUp) {
          p.insertBefore(srcEl, destEl);
        } else {
          p.insertBefore(srcEl, destEl.nextSibling);
        }

        DDM.refreshCache();
      }

      if (destEl.tagName == "UL") {
        if (destEl.children.length == 1 && destEl.children[0].classList.contains("empty-message")) {
          destEl.appendChild(srcEl);
          DDM.refreshCache();
        }
      }
    },

    onDragOut: function (e, id) {

    },

    _buildUrlParams: function (activityRef, parentRef, index) {
      var urlParams = "?activityRef=" + activityRef;
      if (parentRef) urlParams += "&parentRef=" + parentRef;
      if (!_.isUndefined(index)) urlParams += "&index=" + index;
      return Alfresco.constants.PROXY_URI + "citeck/cases/activities/move" + urlParams;
    }
  });

  ko.bindingHandlers.DDRoot = {
    init: function (element, valueAccessor) {
      var settings = valueAccessor();

      this.backup = $(element).html();

      YAHOO.Bubbling.on("movement-of-activity-is-finished", function (l, args) {
        this.backup = $(element).html();
      });

      YAHOO.Bubbling.on("movement-of-activity-undone", function (l, args) {
        Alfresco.util.PopupManager.displayMessage({
          text: settings.errorMessage
        });

        $(element).html(this.backup);

        ko.cleanNode(element);
        ko.applyBindings(settings.data, element);
        settings.data.reload(true);
      });
    }
  };

  ko.bindingHandlers.DDTarget = {
    init: function (element, valueAccessor) {
      var settings = valueAccessor(),
        list = settings.data;

      var parent = $(element.parentNode);
      if (parent.prop("tagName") == "DIV" && parent.hasClass("dnd-area")) {
        $(element).attr("data-nodeRef", list.nodeRef());
      } else if (parent.prop("tagName") == "LI" && parent.hasClass("activity")) {
        $(element).attr("data-nodeRef", parent.attr("data-nodeRef"));
      }

      var ddtarget = new YAHOO.util.DDTarget(element);

      YAHOO.Bubbling.on("movement-of-activity-done", function (l, args) {
        var workList = list.activities();

        // deleting item
        for (var i = 0; i < workList.length; i++) {
          if (workList[i] == args[1].data) {
            workList.splice(i, 1);
            list.activities(workList);
            break;
          }
        }

        // inserting new item
        if (args[1].parentRef == list.nodeRef()) {
          workList.splice(args[1].index, 0, args[1].data);

          var subscription = list.activities.subscribe(function (newValue) {
            $("li.pseudo-item", $(element)).remove();
            YAHOO.Bubbling.fire("movement-of-activity-is-finished");
            subscription.dispose();
          });

          list.activities(workList);
        }
      });
    }
  };

  ko.bindingHandlers.DDList = {
    init: function (element, valueAccessor) {
      var settings = valueAccessor(),
        activity = settings.data;

      $(element).attr("data-nodeRef", activity.nodeRef());

      new DDList(element, '', {data: activity});
    }
  };


})
