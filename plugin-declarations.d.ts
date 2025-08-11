declare module 'wx-react-gantt' {
  import * as React from 'react';

  export interface GanttTask {
    id: number | string;
    text: string;
    start: Date;
    end: Date;
    duration?: number;
    progress?: number;
    parent?: number | string;
    type?: string;
    lazy?: boolean;
  }

  export interface GanttLink {
    id: number | string;
    source: number | string;
    target: number | string;
    type?: string;
  }

  export interface GanttScale {
    unit: string;
    step: number;
    format: string;
  }

  export interface GanttProps {
    tasks: GanttTask[];
    links?: GanttLink[];
    scales?: GanttScale[];
    [key: string]: any;
  }

  export interface ButtonProps {
    comp?: string;
    icon?: string;
    id?: string;
    menuText?: string;
    type?: string;
    text?: string;
    check?: (t: any, n?: any) => boolean;
  }

  export const Gantt: React.FC<GanttProps>;
}
