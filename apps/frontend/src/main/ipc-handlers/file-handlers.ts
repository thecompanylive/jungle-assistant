import { ipcMain } from 'electron';
import { readdirSync, statSync, readFileSync, realpathSync, lstatSync, existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants';
import type { IPCResult } from '../../shared/types';
import type { FileNode as SharedFileNode } from '../../shared/types';

// Code Editor uses its own FileNode type (different from shared FileNode)
interface CodeEditorFileNode {
  name: string;
  relPath: string;
  isDir: boolean;
}

// Maximum file size to read (1MB)
const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Validates and normalizes a file path for safe reading.
 * Returns the normalized path if valid, or an error message.
 */
function validatePath(filePath: string): { valid: true; path: string } | { valid: false; error: string } {
  // Resolve to absolute path (handles .., ., etc.)
  const resolvedPath = path.resolve(filePath);

  // Must be absolute after resolution
  if (!path.isAbsolute(resolvedPath)) {
    return { valid: false, error: 'Path must be absolute' };
  }

  // After resolution, path should not contain .. segments
  // This catches edge cases where resolve might not fully normalize
  const segments = resolvedPath.split(path.sep);
  if (segments.includes('..')) {
    return { valid: false, error: 'Invalid path: contains parent directory references' };
  }

  return { valid: true, path: resolvedPath };
}

// Directories to ignore when listing
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '__pycache__', 'dist', 'build',
  '.next', '.nuxt', 'coverage', '.cache', '.venv', 'venv',
  'out', '.turbo', '.worktrees',
  'vendor', 'target', '.gradle', '.maven'
]);

/**
 * Register all file-related IPC handlers
 */
export function registerFileHandlers(): void {
  // ============================================
  // File Explorer Operations
  // ============================================

  ipcMain.handle(
    IPC_CHANNELS.FILE_EXPLORER_LIST,
    async (_, dirPath: string): Promise<IPCResult<SharedFileNode[]>> => {
      try {
        // Validate and normalize path to prevent directory traversal
        const validation = validatePath(dirPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        const entries = readdirSync(validation.path, { withFileTypes: true });

        // Filter and map entries
        const nodes: SharedFileNode[] = [];
        for (const entry of entries) {
          // Skip hidden files (not directories) except useful ones like .env, .gitignore
          if (!entry.isDirectory() && entry.name.startsWith('.') &&
              !['.env', '.gitignore', '.env.example', '.env.local'].includes(entry.name)) {
            continue;
          }
          // Skip ignored directories
          if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;

          nodes.push({
            path: path.join(validation.path, entry.name),
            name: entry.name,
            isDirectory: entry.isDirectory()
          });
        }

        // Sort: directories first, then alphabetically
        nodes.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });

        return { success: true, data: nodes };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list directory'
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FILE_EXPLORER_READ,
    async (_, filePath: string): Promise<IPCResult<string>> => {
      try {
        // Validate and normalize path
        const validation = validatePath(filePath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        const safePath = validation.path;

        // Check file size before reading
        const stats = statSync(safePath);
        if (stats.size > MAX_FILE_SIZE) {
          return { success: false, error: 'File too large (max 1MB)' };
        }

        // Use async file read to avoid blocking
        const content = await readFile(safePath, 'utf-8');
        return { success: true, data: content };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read file'
        };
      }
    }
  );

  // ============================================
  // Code Editor Operations
  // ============================================

  /**
   * Helper to validate that a path is within workspace root
   * Also resolves symlinks to ensure they don't point outside the workspace
   */
  function validateWithinWorkspace(workspaceRoot: string, relPath: string):
    { valid: true; fullPath: string } | { valid: false; error: string } {
    // Normalize workspace root
    const normalizedRoot = path.resolve(workspaceRoot);

    // Join and resolve the full path
    const fullPath = path.resolve(normalizedRoot, relPath);

    // Ensure the resolved path is within workspace root
    if (!fullPath.startsWith(normalizedRoot + path.sep) && fullPath !== normalizedRoot) {
      return { valid: false, error: 'Path must be within workspace root' };
    }

    // If path exists and is a symlink, resolve it and check the real path
    try {
      if (existsSync(fullPath)) {
        const stat = lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          const realPath = realpathSync(fullPath);
          // Check if the real path is within workspace
          if (!realPath.startsWith(normalizedRoot + path.sep) && realPath !== normalizedRoot) {
            return { valid: false, error: 'Symlink points outside workspace root' };
          }
        }
      }
    } catch (error) {
      // If we can't resolve the symlink, treat it as invalid
      return { valid: false, error: 'Failed to resolve symlink' };
    }

    return { valid: true, fullPath };
  }

  ipcMain.handle(
    IPC_CHANNELS.CODE_EDITOR_LIST_DIR,
    async (_, workspaceRoot: string, relPath: string): Promise<IPCResult<CodeEditorFileNode[]>> => {
      try {
        const validation = validateWithinWorkspace(workspaceRoot, relPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const entries = readdirSync(validation.fullPath, { withFileTypes: true });

        const nodes: CodeEditorFileNode[] = [];
        for (const entry of entries) {
          // Skip hidden files (not directories) except useful ones
          if (!entry.isDirectory() && entry.name.startsWith('.') &&
              !['.env', '.gitignore', '.env.example', '.env.local'].includes(entry.name)) {
            continue;
          }
          // Skip ignored directories
          if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;

          const entryRelPath = path.join(relPath, entry.name);
          const entryFullPath = path.join(validation.fullPath, entry.name);

          // Filter out symlinks pointing outside workspace
          try {
            const stat = lstatSync(entryFullPath);
            if (stat.isSymbolicLink()) {
              const realPath = realpathSync(entryFullPath);
              const normalizedRoot = path.resolve(workspaceRoot);
              if (!realPath.startsWith(normalizedRoot + path.sep) && realPath !== normalizedRoot) {
                continue; // Skip this symlink
              }
            }
          } catch {
            continue; // Skip entries we can't stat
          }

          nodes.push({
            name: entry.name,
            relPath: entryRelPath,
            isDir: entry.isDirectory()
          });
        }

        // Sort: directories first, then alphabetically
        nodes.sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });

        return { success: true, data: nodes };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list directory'
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CODE_EDITOR_READ_FILE,
    async (_, workspaceRoot: string, relPath: string): Promise<IPCResult<string>> => {
      try {
        const validation = validateWithinWorkspace(workspaceRoot, relPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Check if path is a file (not directory)
        const stats = statSync(validation.fullPath);
        if (stats.isDirectory()) {
          return { success: false, error: 'Not a file' };
        }

        // Check file size
        if (stats.size > MAX_FILE_SIZE) {
          return { success: false, error: 'File too large (max 1MB)' };
        }

        const content = await readFile(validation.fullPath, 'utf-8');

        return { success: true, data: content };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read file'
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CODE_EDITOR_WRITE_FILE,
    async (_, workspaceRoot: string, relPath: string, content: string): Promise<IPCResult> => {
      try {
        const validation = validateWithinWorkspace(workspaceRoot, relPath);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Check if target exists and is a directory
        if (existsSync(validation.fullPath)) {
          const stats = statSync(validation.fullPath);
          if (stats.isDirectory()) {
            return { success: false, error: 'Not a file - cannot write to directory' };
          }
        }

        // Check if parent directory exists
        const parentDir = path.dirname(validation.fullPath);
        if (!existsSync(parentDir)) {
          return { success: false, error: 'Parent directory does not exist' };
        }

        await writeFile(validation.fullPath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to write file'
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.CODE_EDITOR_SEARCH_TEXT,
    async (_, workspaceRoot: string, query: string): Promise<IPCResult<Array<{ relPath: string; line: number; column: number; preview: string }>>> => {
      try {
        if (!query || query.trim().length === 0) {
          return { success: true, data: [] };
        }

        const validation = validatePath(workspaceRoot);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Simple recursive search implementation
        const results: Array<{ relPath: string; line: number; column: number; preview: string }> = [];
        const searchQuery = query.toLowerCase();

        function searchInDirectory(dirPath: string, relPath: string) {
          try {
            const entries = readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
              const entryPath = path.join(dirPath, entry.name);
              const entryRelPath = relPath ? path.join(relPath, entry.name) : entry.name;

              if (entry.isDirectory()) {
                // Skip ignored directories
                if (IGNORED_DIRS.has(entry.name)) continue;
                searchInDirectory(entryPath, entryRelPath);
              } else {
                // Skip hidden files except useful ones
                if (entry.name.startsWith('.') &&
                    !['.env', '.gitignore', '.env.example', '.env.local'].includes(entry.name)) {
                  continue;
                }

                // Check file size before reading
                const stats = statSync(entryPath);
                if (stats.size > MAX_FILE_SIZE) continue;

                try {
                  const content = readFileSync(entryPath, 'utf-8');
                  const lines = content.split('\n');

                  lines.forEach((line, lineIndex) => {
                    const lowerLine = line.toLowerCase();
                    let columnIndex = lowerLine.indexOf(searchQuery);

                    while (columnIndex !== -1) {
                      results.push({
                        relPath: entryRelPath,
                        line: lineIndex,
                        column: columnIndex,
                        preview: line.trim().substring(0, 100)
                      });

                      // Find next occurrence in same line
                      columnIndex = lowerLine.indexOf(searchQuery, columnIndex + 1);
                    }
                  });
                } catch {
                  // Skip files that can't be read as text
                }
              }
            }
          } catch {
            // Skip directories that can't be read
          }
        }

        searchInDirectory(validation.path, '');

        // Limit results to prevent overwhelming the UI
        return { success: true, data: results.slice(0, 1000) };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Search failed'
        };
      }
    }
  );
}
