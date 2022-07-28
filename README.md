# webpack-hot-lock-plugin

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
