export const getDataPath = (path) => {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const fullPath = `${normalizedBase}${normalizedPath}`
  if (import.meta.env.DEV) {
    console.log(`[DataLoader] Resolved path: "${path}" -> "${fullPath}" (BASE_URL: "${baseUrl}")`)
  }
  return fullPath
}

export const loadJSON = async (path) => {
  const fullPath = getDataPath(path)
  if (import.meta.env.DEV) {
    console.log(`[DataLoader] Loading JSON from: ${fullPath}`)
  }
  const response = await fetch(fullPath)
  if (!response.ok) {
    const errorMsg = `Failed to load JSON ${path}: ${response.status} ${response.statusText} from ${fullPath}`
    console.error(`[DataLoader] ${errorMsg}`)
    throw new Error(errorMsg)
  }
  const data = await response.json()
  if (import.meta.env.DEV) {
    console.log(`[DataLoader] JSON loaded successfully from: ${fullPath}`)
  }
  return data
}

export const loadText = async (path) => {
  const fullPath = getDataPath(path)
  if (import.meta.env.DEV) {
    console.log(`[DataLoader] Loading text from: ${fullPath}`)
  }
  const response = await fetch(fullPath)
  if (!response.ok) {
    const errorMsg = `Failed to load text ${path}: ${response.status} ${response.statusText} from ${fullPath}`
    console.error(`[DataLoader] ${errorMsg}`)
    throw new Error(errorMsg)
  }
  const text = await response.text()
  if (import.meta.env.DEV) {
    console.log(`[DataLoader] Text loaded successfully from: ${fullPath}, length: ${text.length} chars`)
  }
  return text
}
