# jQuery ApexCharts

A jQuery plugin wrapper for ApexCharts, providing easy-to-use chart generation capabilities for your web applications.

## Overview

This plugin allows you to integrate the powerful ApexCharts library with jQuery-Core, making it simpler to create interactive and responsive charts in your web applications.

## Installation

### Automatic Setup (Recommended)

Install and automatically configure the library with styles using Angular CLI:

```bash
ng add @oneteme/jquery-apexcharts
```

This command will:
- Install the package
- Automatically add the required styles to your `angular.json`

### Manual Installation

If you prefer manual installation using npm:

```bash
npm install @oneteme/jquery-apexcharts
```

**Note:** With `npm install`, you must manually add the styles to your project.

Then add the styles manually to your `angular.json`:

```json
{
  "styles": [
    "node_modules/@oneteme/jquery-apexcharts/styles/styles.scss"
  ]
}
```

Or import it in your global `styles.scss`:

```scss
@import '~@oneteme/jquery-apexcharts/styles/styles.scss';
```

## Additional Documentation

For additional information, installation instructions, examples and other, please refer to the [main documentation](https://github.com/oneteme/jquery-charts) of the project.
