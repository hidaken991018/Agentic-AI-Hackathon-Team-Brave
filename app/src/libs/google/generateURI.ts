export function getSessionURI(location: string, resourceName: string) {
  return `https://${location}-aiplatform.googleapis.com/v1/${resourceName}:query`;
}
