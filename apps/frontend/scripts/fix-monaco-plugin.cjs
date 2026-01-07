#!/usr/bin/env node
/**
 * Fix vite-plugin-monaco-editor worker paths
 * 
 * The plugin may reference worker files without .js extension in some versions,
 * but monaco-editor v0.55.1+ includes the .js extension in file names.
 * This script ensures the plugin has the correct paths.
 * 
 * This is called as a prebuild step since CI uses --ignore-scripts which skips postinstall.
 */

const path = require('path');
const fs = require('fs');

function fixMonacoEditorPlugin() {
  // Check from frontend directory (where this script is run in CI)
  const pluginPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'vite-plugin-monaco-editor', 'dist', 'lnaguageWork.js');
  
  if (!fs.existsSync(pluginPath)) {
    console.log('[fix-monaco-plugin] Plugin file not found, skipping:', pluginPath);
    return;
  }

  try {
    let content = fs.readFileSync(pluginPath, 'utf8');
    let originalContent = content;
    
    // Add .js extension to worker file paths if not already present
    const replacements = [
      [/'monaco-editor\/esm\/vs\/editor\/editor\.worker'(?!\.js)/g, "'monaco-editor/esm/vs/editor/editor.worker.js'"],
      [/'monaco-editor\/esm\/vs\/language\/css\/css\.worker'(?!\.js)/g, "'monaco-editor/esm/vs/language/css/css.worker.js'"],
      [/'monaco-editor\/esm\/vs\/language\/html\/html\.worker'(?!\.js)/g, "'monaco-editor/esm/vs/language/html/html.worker.js'"],
      [/'monaco-editor\/esm\/vs\/language\/json\/json\.worker'(?!\.js)/g, "'monaco-editor/esm/vs/language/json/json.worker.js'"],
      [/'monaco-editor\/esm\/vs\/language\/typescript\/ts\.worker'(?!\.js)/g, "'monaco-editor/esm/vs/language/typescript/ts.worker.js'"],
    ];

    let modified = false;
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(pluginPath, content, 'utf8');
      console.log('[fix-monaco-plugin] ✓ Fixed vite-plugin-monaco-editor worker paths');
    } else {
      console.log('[fix-monaco-plugin] ✓ Plugin already has correct paths');
    }
  } catch (err) {
    console.error('[fix-monaco-plugin] ✗ Failed to fix plugin:', err.message);
    process.exit(1);
  }
}

fixMonacoEditorPlugin();
