const KEY = 'winnable-solitaire:high-contrast'

export function loadHighContrast(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function saveHighContrast(enabled: boolean): void {
  try {
    localStorage.setItem(KEY, enabled ? '1' : '0')
  } catch {
    // ignore quota / private mode
  }
}
