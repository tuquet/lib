import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Searches for a system-installed Chromium, Chrome, or Microsoft Edge executable.
 * Checks environment variables first, then standard OS filesystem locations.
 */
export function findBrowserExecutable(customPath?: string): string {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // 1. Check common environment variables
  const envCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    process.env.BROWSER_PATH,
  ];

  for (const envPath of envCandidates) {
    if (envPath && fs.existsSync(envPath)) {
      return envPath;
    }
  }

  const platform = os.platform();
  const candidates: string[] = [];

  if (platform === 'win32') {
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const userProfile = process.env.USERPROFILE || os.homedir();

    candidates.push(
      // Google Chrome
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      // Microsoft Edge (Default on Windows 10/11)
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      // Scoop installs
      path.join(userProfile, 'scoop', 'apps', 'googlechrome', 'current', 'chrome.exe'),
      path.join(userProfile, 'scoop', 'apps', 'chromium', 'current', 'chrome.exe'),
      // Brave / Vivaldi as fallbacks
      path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      path.join(
        os.homedir(),
        'Applications',
        'Google Chrome.app',
        'Contents',
        'MacOS',
        'Google Chrome'
      )
    );
  } else {
    // Linux / BSD
    candidates.push(
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/microsoft-edge-stable',
      '/usr/bin/microsoft-edge',
      '/snap/bin/chromium'
    );
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `[tuquet/md-pdf] No compatible Chromium/Chrome/Edge executable found on this system.\n` +
      `Please install Google Chrome, Microsoft Edge, or set the PUPPETEER_EXECUTABLE_PATH environment variable.`
  );
}
