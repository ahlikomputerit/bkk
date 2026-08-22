const TEMPLATES_STORAGE_KEY = "wordTemplates"
const ACTIVE_TEMPLATE_STORAGE_KEY = "activeTemplateId"

export interface WordTemplate {
  id: string
  name: string
  file: File
  uploadedAt: string
  variables: string[]
}

export interface StoredWordTemplate {
  id: string
  name: string
  uploadedAt: string
  variables: string[]
  fileData: string
  fileType?: string
}

function isStoredWordTemplate(value: unknown): value is StoredWordTemplate {
  if (!value || typeof value !== "object") return false

  const template = value as Partial<StoredWordTemplate>
  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.fileData === "string" &&
    Array.isArray(template.variables)
  )
}

export function loadStoredWordTemplates(): StoredWordTemplate[] {
  try {
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isStoredWordTemplate).map((template) => ({
      ...template,
      uploadedAt: template.uploadedAt || new Date().toISOString(),
      variables: template.variables.filter((variable): variable is string => typeof variable === "string"),
    }))
  } catch (error) {
    console.error("Error loading Word templates:", error)
    return []
  }
}

export function getActiveStoredWordTemplate(
  templates = loadStoredWordTemplates(),
): StoredWordTemplate | null {
  const activeId = localStorage.getItem(ACTIVE_TEMPLATE_STORAGE_KEY)
  return templates.find((template) => template.id === activeId) ?? templates[0] ?? null
}

export function setActiveWordTemplate(templateId: string | null): void {
  if (templateId) {
    localStorage.setItem(ACTIVE_TEMPLATE_STORAGE_KEY, templateId)
  } else {
    localStorage.removeItem(ACTIVE_TEMPLATE_STORAGE_KEY)
  }
}

export function createFileFromStoredWordTemplate(template: StoredWordTemplate): File {
  const binaryString = window.atob(template.fileData)
  const bytes = Uint8Array.from(binaryString, (character) => character.charCodeAt(0))

  return new File(
    [bytes],
    template.name,
    { type: template.fileType || "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  )
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ""

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return window.btoa(binary)
}

export async function serializeWordTemplate(template: WordTemplate): Promise<StoredWordTemplate> {
  return {
    id: template.id,
    name: template.name,
    uploadedAt: template.uploadedAt,
    variables: template.variables,
    fileData: arrayBufferToBase64(await template.file.arrayBuffer()),
    fileType: template.file.type,
  }
}

export async function saveWordTemplates(templates: WordTemplate[]): Promise<void> {
  const storedTemplates = await Promise.all(templates.map(serializeWordTemplate))
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(storedTemplates))
}
