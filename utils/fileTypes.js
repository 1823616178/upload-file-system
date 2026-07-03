export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
export const XML_EXTENSIONS = ['xml']
export const PDF_EXTENSIONS = ['pdf']

export const getExtension = (filename) => filename?.split('.').pop()?.toLowerCase() || ''

export const isImageFile = (filename) => IMAGE_EXTENSIONS.includes(getExtension(filename))
export const isXmlFile = (filename) => XML_EXTENSIONS.includes(getExtension(filename))
export const isPdfFile = (filename) => PDF_EXTENSIONS.includes(getExtension(filename))
