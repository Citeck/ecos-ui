import { EventBusRouter } from '@svar-ui/lib-state';
import isFunction from 'lodash/isFunction';
import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';
import { mount } from 'svelte';

import Gantt from './svelte/components/Gantt.svelte';

function template(template, host) {
  return new Proxy(host, {
    construct(target, _ref) {
      const [config] = _ref;
      const props = config.props || {};

      props.html = toStringExpensive(template(config.props));
      config.props = props;

      return new target(config);
    }
  });
}

function toStringExpensive(r) {
  let content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  if (typeof r === 'string') return r;
  else if (typeof r.type === 'function') r = r.type(r.props);
  else if (typeof r.type === 'string') {
    content += buildTag(r);
    if (r.props.children) {
      if (Array.isArray(r.props.children)) {
        r.props.children.forEach(child => {
          content += toStringExpensive(child);
        });
      } else {
        content += toStringExpensive(r.props.children);
      }
    }
    content += `</${r.type}>`;
  } else if (r.props.children) {
    if (Array.isArray(r.props.children)) {
      r.props.children.forEach(child => {
        content += toStringExpensive(child);
      });
    } else {
      content += toStringExpensive(r.props.children);
    }
  }
  return content;
}

function buildTag(r) {
  let tag = `<${r.type}`;

  for (const key in r.props) {
    if (key === 'children') continue;
    if (key === 'style') {
      tag += ` style="`;
      for (const style in r.props.style) {
        tag += `${style}:${r.props.style[style]};`;
      }
      tag += `"`;
    }

    if (key === 'className') tag += ` class="${r.props[key]}"`;
    else tag += ` ${key}="${r.props[key]}"`;
  }

  tag += '>';

  return tag;
}

export default function GanttWrapper(props) {
  const ganttContainerRef = useRef(null);

  const once = useRef(false);

  const ws = useState(() => ({}))[0];
  const [widget, setWidget] = useState(null);

  useImperativeHandle(props.api, () => ({
    getState: () => ws.api.getState(),
    getReactiveState: () => ws.api.getReactiveState(),
    getStores: () => ws.api.getStores(),
    exec: (name, data) => ws.api.exec(name, data),
    setNext: ev => ws.api.setNext(ev),
    intercept: (name, data) => ws.api.intercept(name, data),
    on: (name, handler) => ws.api.on(name, handler),
    detach: (name, handler) => ws.api.detach(name, handler),
    getTask: id => ws.api.getTask(id)
  }));

  useEffect(() => {
    const evs = new EventBusRouter((name, ev) => {
      const camelCase = name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      const eventName = 'on' + camelCase[0].toUpperCase() + camelCase.slice(1);

      if (props[eventName]) return props[eventName](ev);

      return true;
    });

    let obj;

    const initProps = {
      ...props
    };

    if (initProps.taskTemplate && typeof initProps.taskTemplate === 'function') {
      initProps.taskTemplate = template(initProps.taskTemplate, vg);
    }

    const externalContext = new Map([['wx-theme', 'willow']]);
    obj = new Gantt({
      target: ganttContainerRef.current,
      context: externalContext,
      props: {
        ...initProps,
        init: a => {
          ws.api = a;
          a.setNext(evs);
          if (props.init) props.init(a);
        }
      }
    });
    setWidget(obj);
    return () => {
      if (obj)
        try {
          obj.$destroy();
        } catch (e) {}
      if (ganttContainerRef.current) ganttContainerRef.current.innerHTML = '';
    };
  }, []);

  const {
    taskTemplate,
    markers,
    taskTypes,
    tasks,
    selected,
    activeTask,
    links,
    scales,
    columns,
    start,
    end,
    lengthUnit,
    cellWidth,
    cellHeight,
    scaleHeight,
    readonly,
    cellBorders,
    editorShape,
    zoom,
    baselines,
    highlightTime
  } = props;

  let svelteInstance;

  useEffect(() => {
    if (!once.current) {
      once.current = true;
      return;
    }

    if (ws.api && widget) {
      const { init, ...updateProps } = props;
      if (updateProps.taskTemplate && typeof updateProps.taskTemplate !== 'string')
        updateProps.taskTemplate = template(updateProps.taskTemplate, vg);
      if (isFunction(widget.$$set)) {
        widget.$$set(updateProps);
      }
    }
  }, [
    taskTemplate,
    markers,
    taskTypes,
    tasks,
    selected,
    activeTask,
    links,
    scales,
    columns,
    start,
    end,
    lengthUnit,
    cellWidth,
    cellHeight,
    scaleHeight,
    readonly,
    cellBorders,
    editorShape,
    zoom,
    baselines,
    highlightTime
  ]);

  return (
    <div
      ref={ganttContainerRef}
      style={{
        height: '100%',
        width: '100%'
      }}
    ></div>
  );
}
