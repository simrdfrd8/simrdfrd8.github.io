/** Names with diacritics (for example a name that carries marks) need extra line height in tight display type, or the marks collide with the line above when the name wraps. */
export const hasMarks = (s: string) => /[\u0300-\u036f]/.test(s.normalize("NFD"));
