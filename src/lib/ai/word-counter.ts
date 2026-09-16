import { encode } from 'gpt-tokenizer';

export function wordCounter(str: string) {
  // Encode text into tokens
  const tokens = encode(str);
  return tokens.length;
}
