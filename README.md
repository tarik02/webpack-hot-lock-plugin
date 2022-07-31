# webpack-hot-lock-plugin

![Check](https://github.com/Tarik02/webpack-hot-lock-plugin/actions/workflows/check.yml/badge.svg)
![Publish to NPM](https://github.com/Tarik02/webpack-hot-lock-plugin/actions/workflows/publish-to-npm.yml/badge.svg)
[![npm version](https://badge.fury.io/js/webpack-hot-lock-plugin.svg)](https://badge.fury.io/js/webpack-hot-lock-plugin)

## Installation

```bash
yarn add --dev webpack-hot-lock-plugin
# or
npm install --save-dev webpack-hot-lock-plugin
```

## Usage

Add this to your webpack config:
```js
import WebpackHotLockPlugin from 'webpack-hot-lock-plugin';

  // ...

  plugins: [
    new WebpackHotLockPlugin({
      name: 'hot.json',
      /**
       * @param {Object} data
       * @param {{ compiler: import('webpack').Compiler, devServer: import('webpack-dev-server').Server }}
       */
      transform: (data, { compiler, devServer }) => {
        data.startedAt = Date.now();
      },
    }),
  ],

  // ...
```
