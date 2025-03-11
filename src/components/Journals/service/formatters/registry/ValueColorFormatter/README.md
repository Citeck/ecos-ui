# ValueColorFormatter

Universal formatter for displaying values with color indication. The formatter uses the identifier (value) for color mapping, but displays the localized value (disp).

## Features

- Support for both predefined colors (via CSS classes) and custom HEX colors
- Using identifier for color mapping and localized value for display
- Ability to display color indicator as pointer or background
- When `showPointer` is false, the background color is displayed as a rounded oval
- Support for new and old journal
- Validation of supported colors with warning in console for unsupported colors
- Full support for color pointer in both new and old journal formats

## Usage

### Basic usage with predefined colors

```yaml
- id: priority
  name:
    ru: Приоритет
    en: Priority
  type: TEXT
  editor:
    type: select
  formatter:
    type: valueColor
    config:
      colorMapping:
        low: green
        medium: yellow
        high: pink
        urgent: red
```

### Usage with HEX colors

```yaml
- id: priority
  name:
    ru: Приоритет
    en: Priority
  type: TEXT
  editor:
    type: select
  formatter:
    type: valueColor
    config:
      colorMapping:
        low: '#00FF00'
        medium: '#FFFF00'
        high: '#FF69B4'
        urgent: '#FF0000'
```

### Usage with pointer display

```yaml
- id: priority
  name:
    ru: Приоритет
    en: Priority
  type: TEXT
  editor:
    type: select
  formatter:
    type: valueColor
    config:
      colorMapping:
        low: green
        medium: yellow
        high: pink
        urgent: red
      showPointer: true
```

### Usage with default color

```yaml
- id: priority
  name:
    ru: Приоритет
    en: Priority
  type: TEXT
  editor:
    type: select
  formatter:
    type: valueColor
    config:
      colorMapping:
        low: green
      defaultColor: '#CCCCCC'
```

### Usage with default named color

```yaml
- id: priority
  name:
    ru: Приоритет
    en: Priority
  type: TEXT
  editor:
    type: select
  formatter:
    type: valueColor
    config:
      colorMapping:
        low: green
      defaultColor: 'red'
```

## Configuration Parameters

| Parameter    | Type    | Default   | Description                                                                   |
| ------------ | ------- | --------- | ----------------------------------------------------------------------------- |
| colorMapping | Object  | {}        | Object mapping values to colors                                               |
| showPointer  | Boolean | false     | Whether to show color pointer. If false, shows rounded oval background        |
| defaultColor | String  | '#FFFFFF' | Default color for values not found in colorMapping. Can be HEX or named color |

## Predefined Colors

The formatter supports the following predefined colors:

- green
- yellow
- pink
- red

For custom colors, use HEX format (e.g., '#FF0000').

## Visual Appearance

- When `showPointer: true` - displays a small colored circle before the text
- When `showPointer: false` - displays text with a rounded oval colored background
