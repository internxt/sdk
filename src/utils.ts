export function isHexString(string: string) {
  // TODO: replace with proper library
  return /^([0-9a-fA-F]{2})+$/.test(string);
}
