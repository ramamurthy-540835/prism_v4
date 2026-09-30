export function resolveTemplate(template: string, values: Record<string, string>) { return template.replace(/\{([^}]+)\}/g, (_, key) => values[key] || `{${key}}`); }
