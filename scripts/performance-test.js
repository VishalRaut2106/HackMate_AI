#!/usr/bin/env node

/**
 * Performance testing script for HackMate AI
 * Tests various performance metrics and provides recommendations
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 HackMate AI Performance Test Suite\n')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logResult(test, value, unit, threshold, isGood) {
  const status = isGood ? '✅' : '❌'
  const color = isGood ? 'green' : 'red'
  log(`${status} ${test}: ${colors.bold}${value}${unit}${colors.reset} ${colors[color]}(threshold: ${threshold}${unit})${colors.reset}`)
}

// Test 1: Bundle Size Analysis
function testBundleSize() {
  log('\n📦 Bundle Size Analysis', 'blue')
  
  try {
    // Build the project
    log('Building project for production...', 'yellow')
    execSync('npm run build', { stdio: 'pipe' })
    
    // Check .next folder size
    const nextDir = path.join(process.cwd(), '.next')
    if (fs.existsSync(nextDir)) {
      const stats = execSync(`du -sh ${nextDir}`, { encoding: 'utf8' }).trim()
      const sizeMatch = stats.match(/^(\d+(?:\.\d+)?)(K|M|G)/)
      
      if (sizeMatch) {
        const [, size, unit] = sizeMatch
        const sizeInMB = unit === 'K' ? parseFloat(size) / 1024 : 
                        unit === 'M' ? parseFloat(size) : 
                        parseFloat(size) * 1024
        
        logResult('Total Build Size', sizeInMB.toFixed(1), 'MB', '< 50', sizeInMB < 50)
      }
    }
    
    // Check static folder size
    const staticDir = path.join(nextDir, 'static')
    if (fs.existsSync(staticDir)) {
      const stats = execSync(`du -sh ${staticDir}`, { encoding: 'utf8' }).trim()
      log(`Static assets: ${stats}`)
    }
    
  } catch (error) {
    log('❌ Bundle size test failed: ' + error.message, 'red')
  }
}

// Test 2: Dependency Analysis
function testDependencies() {
  log('\n📋 Dependency Analysis', 'blue')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const deps = Object.keys(packageJson.dependencies || {})
    const devDeps = Object.keys(packageJson.devDependencies || {})
    
    log(`Total dependencies: ${deps.length}`)
    log(`Dev dependencies: ${devDeps.length}`)
    
    // Check for heavy dependencies
    const heavyDeps = [
      'mermaid', 'recharts', 'html2pdf.js', '@radix-ui/react-*'
    ]
    
    const foundHeavy = deps.filter(dep => 
      heavyDeps.some(heavy => dep.includes(heavy.replace('*', '')))
    )
    
    if (foundHeavy.length > 0) {
      log(`⚠️  Heavy dependencies found: ${foundHeavy.join(', ')}`, 'yellow')
      log('Consider lazy loading these dependencies', 'yellow')
    } else {
      log('✅ No heavy dependencies detected', 'green')
    }
    
  } catch (error) {
    log('❌ Dependency analysis failed: ' + error.message, 'red')
  }
}

// Test 3: Code Quality Metrics
function testCodeQuality() {
  log('\n🔍 Code Quality Analysis', 'blue')
  
  try {
    // Count TypeScript files
    const tsFiles = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l', { encoding: 'utf8' }).trim()
    log(`TypeScript files: ${tsFiles}`)
    
    // Check for TODO comments
    const todos = execSync('grep -r "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" . | grep -v node_modules | wc -l', { encoding: 'utf8' }).trim()
    logResult('TODO/FIXME comments', todos, '', '< 10', parseInt(todos) < 10)
    
    // Check for console.log statements
    const consoleLogs = execSync('grep -r "console\\.log" --include="*.ts" --include="*.tsx" . | grep -v node_modules | wc -l', { encoding: 'utf8' }).trim()
    logResult('Console.log statements', consoleLogs, '', '< 5', parseInt(consoleLogs) < 5)
    
  } catch (error) {
    log('❌ Code quality test failed: ' + error.message, 'red')
  }
}

// Test 4: Performance Optimizations Check
function testOptimizations() {
  log('\n⚡ Performance Optimizations Check', 'blue')
  
  const optimizations = [
    {
      name: 'useCallback usage',
      pattern: 'useCallback',
      threshold: 5,
      description: 'Prevents unnecessary re-renders'
    },
    {
      name: 'useMemo usage', 
      pattern: 'useMemo',
      threshold: 3,
      description: 'Memoizes expensive calculations'
    },
    {
      name: 'React.memo usage',
      pattern: 'React\\.memo|memo<',
      threshold: 2,
      description: 'Prevents component re-renders'
    },
    {
      name: 'Dynamic imports',
      pattern: 'import\\(',
      threshold: 1,
      description: 'Code splitting for better performance'
    }
  ]
  
  optimizations.forEach(opt => {
    try {
      const count = execSync(`grep -r "${opt.pattern}" --include="*.ts" --include="*.tsx" . | grep -v node_modules | wc -l`, { encoding: 'utf8' }).trim()
      const isGood = parseInt(count) >= opt.threshold
      logResult(opt.name, count, ' instances', `>= ${opt.threshold}`, isGood)
      if (!isGood) {
        log(`  💡 ${opt.description}`, 'yellow')
      }
    } catch (error) {
      log(`❌ Could not check ${opt.name}`, 'red')
    }
  })
}

// Test 5: Configuration Check
function testConfiguration() {
  log('\n⚙️  Configuration Check', 'blue')
  
  const configs = [
    {
      file: 'next.config.mjs',
      checks: [
        { pattern: 'compress: true', name: 'Compression enabled' },
        { pattern: 'optimizePackageImports', name: 'Package import optimization' },
        { pattern: 'turbopack', name: 'Turbopack configuration' }
      ]
    },
    {
      file: 'tsconfig.json',
      checks: [
        { pattern: '"strict": true', name: 'TypeScript strict mode' },
        { pattern: '"noEmit": true', name: 'No emit for type checking' }
      ]
    }
  ]
  
  configs.forEach(config => {
    if (fs.existsSync(config.file)) {
      const content = fs.readFileSync(config.file, 'utf8')
      
      config.checks.forEach(check => {
        const found = content.includes(check.pattern.replace(/"/g, ''))
        const status = found ? '✅' : '❌'
        const color = found ? 'green' : 'red'
        log(`${status} ${check.name}`, color)
      })
    } else {
      log(`❌ ${config.file} not found`, 'red')
    }
  })
}

// Test 6: Environment Check
function testEnvironment() {
  log('\n🌍 Environment Check', 'blue')
  
  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  logResult('Node.js version', nodeVersion, '', '>= v18', majorVersion >= 18)
  
  // Check if .env file exists
  const envExists = fs.existsSync('.env')
  logResult('Environment file', envExists ? 'Found' : 'Missing', '', 'Found', envExists)
  
  // Check package manager
  const hasPackageLock = fs.existsSync('package-lock.json')
  const hasPnpmLock = fs.existsSync('pnpm-lock.yaml')
  const hasYarnLock = fs.existsSync('yarn.lock')
  
  const packageManager = hasPackageLock ? 'npm' : hasPnpmLock ? 'pnpm' : hasYarnLock ? 'yarn' : 'unknown'
  log(`📦 Package manager: ${packageManager}`)
}

// Performance Recommendations
function showRecommendations() {
  log('\n💡 Performance Recommendations', 'blue')
  
  const recommendations = [
    '1. Use React.memo for components that receive stable props',
    '2. Implement useCallback for event handlers passed to child components',
    '3. Use useMemo for expensive calculations',
    '4. Implement code splitting with dynamic imports for heavy components',
    '5. Optimize images with Next.js Image component',
    '6. Use proper caching strategies for API calls',
    '7. Implement virtual scrolling for large lists',
    '8. Monitor bundle size regularly with webpack-bundle-analyzer',
    '9. Use service workers for offline functionality',
    '10. Implement proper error boundaries for better UX'
  ]
  
  recommendations.forEach(rec => log(rec, 'yellow'))
}

// Run all tests
async function runTests() {
  const startTime = Date.now()
  
  testEnvironment()
  testConfiguration()
  testDependencies()
  testCodeQuality()
  testOptimizations()
  testBundleSize()
  showRecommendations()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  log(`\n🏁 Performance test completed in ${duration}s`, 'green')
  log('\n📊 Summary:', 'bold')
  log('- Check the results above for any failing tests', 'yellow')
  log('- Address any ❌ items to improve performance', 'yellow')
  log('- Monitor these metrics regularly during development', 'yellow')
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  log('HackMate AI Performance Test Suite', 'bold')
  log('\nUsage: node scripts/performance-test.js [options]')
  log('\nOptions:')
  log('  --help, -h     Show this help message')
  log('  --bundle       Run only bundle size tests')
  log('  --deps         Run only dependency tests')
  log('  --quality      Run only code quality tests')
  log('  --config       Run only configuration tests')
  process.exit(0)
}

// Run specific tests based on arguments
if (args.includes('--bundle')) {
  testBundleSize()
} else if (args.includes('--deps')) {
  testDependencies()
} else if (args.includes('--quality')) {
  testCodeQuality()
} else if (args.includes('--config')) {
  testConfiguration()
} else {
  runTests()
}