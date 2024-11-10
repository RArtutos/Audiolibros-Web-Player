export function normalizeString(str: string): string {
  try {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/gi, '')
      .trim();
  } catch {
    return '';
  }
}

export function searchIncludes(text: string, search: string): boolean {
  if (!text || !search) return false;
  return normalizeString(text).includes(normalizeString(search));
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}