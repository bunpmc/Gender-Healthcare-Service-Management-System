/* PurgeCSS Configuration for CSS Bundle Optimization
 * Remove unused CSS to reduce bundle size
 */

module.exports = {
  content: [
    './src/**/*.html',
    './src/**/*.ts',
    './src/**/*.js'
  ],
  css: [
    './src/styles.css',
    './src/styles/**/*.css'
  ],
  output: './src/styles/purged/',
  
  // Safelist - classes to never remove
  safelist: [
    // Angular Material classes
    /^mat-/,
    /^cdk-/,
    
    // PrimeNG classes
    /^p-/,
    /^ui-/,
    
    // Chart.js classes
    /^chart/,
    
    // Splide carousel classes
    /^splide/,
    
    // Dynamic classes that might not be detected
    'active',
    'disabled',
    'loading',
    'error',
    'success',
    'hidden',
    'visible',
    
    // State classes
    /^is-/,
    /^has-/,
    /^js-/,
    
    // Responsive classes that might be added dynamically
    /^sm:/,
    /^md:/,
    /^lg:/,
    /^xl:/,
    /^2xl:/,
    
    // Dark mode classes (future-proofing)
    /^dark:/,
    
    // Animation classes
    /^animate-/,
    /^transition-/,
    
    // Common utility patterns
    /^bg-/,
    /^text-/,
    /^border-/,
    /^rounded-/,
    /^shadow-/,
    /^hover:/,
    /^focus:/,
    /^group-hover:/,
    
    // Custom component classes
    'btn-primary',
    'btn-secondary',
    'btn-danger',
    'card',
    'modal',
    'dropdown',
    'tooltip',
    'badge',
    'alert',
    'table-responsive',
    'form-control',
    'form-label',
    'form-text',
    'input-group'
  ],
  
  // Safelisting based on attributes
  safelist: {
    standard: [
      // Classes added via Angular directives
      /^ng-/,
      /^ng2-charts/,
      /^\[_ngcontent-/
    ],
    deep: [
      // Nested selectors that might be missed
      /^ng-deep/
    ],
    greedy: [
      // Partial matches for complex selectors
      /modal/,
      /dropdown/,
      /carousel/,
      /chart/
    ]
  },
  
  // Extract keyframes and font-face rules
  keyframes: true,
  fontFace: true,
  
  // Variables to keep (CSS custom properties)
  variables: true,
  
  // Remove unused CSS variables
  removeUnusedVariables: true,
  
  // Options for better performance
  rejected: false, // Don't output rejected CSS
  rejectedCss: false, // Don't output rejected CSS file
  
  // Enable tree-shaking for better optimization
  treeShaking: true,
  
  // Custom extractors for different file types
  extractors: [
    {
      extractor: content => {
        // Extract Angular component class names
        const angularClasses = content.match(/class\s*[:=]\s*['"](.*?)['"]/g) || [];
        const templateClasses = content.match(/class\s*=\s*['"](.*?)['"]/g) || [];
        const ngClassClasses = content.match(/\[ngClass\]\s*=\s*['"](.*?)['"]/g) || [];
        
        const allMatches = [
          ...angularClasses,
          ...templateClasses,
          ...ngClassClasses
        ];
        
        return allMatches.join(' ').match(/[\w-/:]+(?<!:)/g) || [];
      },
      extensions: ['ts', 'html']
    },
    {
      extractor: content => {
        // Extract JavaScript string classes
        return content.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]/g) || [];
      },
      extensions: ['js']
    }
  ],
  
  // Plugins to enhance purging
  plugins: [],
  
  // Transform function to modify CSS before purging
  transform: {
    '.css': content => {
      // Remove comments to reduce size
      return content.replace(/\/\*[\s\S]*?\*\//g, '');
    }
  }
};
