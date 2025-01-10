/**
 * Generates a random numeric code of specified length
 * @param length Length of the code to generate
 * @returns Random numeric code as string
 */
export function generateRandomCode(length: number): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString().padStart(length, '0');
}
