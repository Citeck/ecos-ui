# Gantt Chart Widget Plugin

This plugin provides a Gantt chart widget for visualizing project timelines and task dependencies.

## Features

- Interactive Gantt chart visualization
- Task dependency management
- Multiple time scale views (day, week, month)
- Customizable task styling
- Responsive design

## Configuration

The widget can be configured with the following options:

- **Data Type**: 
  - Standalone: Manual data entry
  - Linked: Connected to business object
  
- **Data Source**: Select the data source for fetching and storing Gantt chart data

- **Manual Data Source**: Enter data source ID manually (for standalone mode)

- **Linked With Type**: Enter type of linked data (for linked mode)

- **Linked With Reference**: Enter reference to linked document (for linked mode)

## Usage

1. Add the Gantt Chart widget to your dashboard
2. Configure the data source in the widget settings
3. View and interact with the Gantt chart in the widget

## Technical Details

This widget uses the `wx-svelte-gantt` component for rendering the Gantt chart, which provides:

- Smooth scrolling and zooming
- Drag and drop task manipulation
- Dependency line visualization
- Customizable time scales
- Responsive design for different screen sizes

The widget is built with Svelte for optimal performance and small bundle size.

## Overview

This plugin implements integration with the Records API for the Gantt Chart widget. It enables loading and saving Gantt chart data using the Citeck Records API.

## Architecture

The implementation follows a layered architecture:

1. **GanttChartDashlet** - Main widget component that extends BaseWidget
2. **GanttWithStore** - Gantt chart component that handles data loading and event management
3. **GanttDataLoader** - Service layer for Records API communication
4. **GanttDataTransformer** - Utility for data format transformation

## Features

### Records API Integration

- Load Gantt settings from `emodel/gantt-settings` records
- Support for both STANDALONE and LINKED data types
- Load activities from `emodel/gantt-activity` records
- Load dependencies from `emodel/gantt-dependency` records
- Create, update, and delete activities and dependencies

### Data Types

#### STANDALONE
- Data is stored directly in `emodel/gantt-data` records
- Activities and dependencies are child associations of the data record

#### LINKED
- Data is fetched from external data sources
- Supports dynamic data loading based on context

### Event Handling

- Task creation, update, and deletion
- Link creation, update, and deletion
- Error handling and loading states

## Implementation Details

### GanttDataLoader Service

Handles all Records API communication:

- `loadGanttSettings(recordRef)` - Load gantt settings
- `loadGanttData(dataRecordRef)` - Load standalone gantt data
- `loadLinkedGanttData(...)` - Load linked gantt data
- `createActivity(...)`, `updateActivity(...)`, `deleteActivity(...)` - Activity CRUD operations
- `createDependency(...)`, `updateDependency(...)`, `deleteDependency(...)` - Dependency CRUD operations

### GanttDataTransformer Service

Transforms data between Records API format and wx-react-gantt format:

- `transformActivityToTask(...)` - Records activity to Gantt task
- `transformDependencyToLink(...)` - Records dependency to Gantt link
- `transformTaskToActivity(...)` - Gantt task to Records activity
- `transformLinkToDependency(...)` - Gantt link to Records dependency

## Usage

The widget expects a gantt-settings record reference to be passed either:

1. As the `record` prop (inherited from BaseWidget)
2. As `config.ganttSettingsRef` in the widget configuration

### Example Configuration

```json
{
  "name": "gantt_chart",
  "id": "gantt-1",
  "props": {
    "config": {
      "ganttSettingsRef": "emodel/gantt-settings@12345"
    }
  }
}
```

## Testing

The implementation has been tested with both STANDALONE and LINKED gantt-settings types:

- STANDALONE: Loads data directly from associated records
- LINKED: Loads data from external data sources with context parameters

## Error Handling

- Loading errors are displayed to the user with retry option
- CRUD operation errors are logged to console
- Missing configuration is handled gracefully
