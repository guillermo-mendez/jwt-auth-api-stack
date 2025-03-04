export const removeNumbersFromAString = (str: string): string => {
  const regex = /\b\d+\b/g;
  let paramCount = 1;
  return str.replace(regex, match => `{param${paramCount++}}`)
}