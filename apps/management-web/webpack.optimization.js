// Webpack optimization configuration for production builds
const path = require('path');

module.exports = {
  // Enable tree shaking
  mode: 'production',
  
  // Optimization settings
  optimization: {
    // Split chunks for better caching
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
          maxSize: 250000, // 250KB max for vendor chunk
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          maxSize: 200000, // 200KB max for common chunk
        },
        primeng: {
          test: /[\\/]node_modules[\\/]primeng[\\/]/,
          name: 'primeng',
          chunks: 'all',
          priority: 20,
          maxSize: 150000, // 150KB max for PrimeNG
        },
        angular: {
          test: /[\\/]node_modules[\\/]@angular[\\/]/,
          name: 'angular',
          chunks: 'all',
          priority: 15,
          maxSize: 200000, // 200KB max for Angular
        }
      }
    },
    
    // Remove unused exports
    usedExports: true,
    
    // Minimize bundle size
    minimize: true,
    
    // Remove dead code
    sideEffects: false
  },
  
  // Resolve configuration
  resolve: {
    // Prioritize ES6 modules for tree shaking
    mainFields: ['es2015', 'browser', 'module', 'main'],
    
    // Alias for common imports
    alias: {
      '@core': path.resolve(__dirname, 'src/app/core'),
      '@shared': path.resolve(__dirname, 'src/app/shared'),
      '@env': path.resolve(__dirname, 'src/app/environments')
    }
  },
  
  // Module rules for optimization
  module: {
    rules: [
      // Optimize CSS imports
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: false
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer'),
                  require('cssnano')({
                    preset: 'default'
                  })
                ]
              }
            }
          }
        ]
      }
    ]
  }
};
