export const smartDecode = (text: string) => {
  if (typeof text !== "string") return text;

  let cleaned = text
    .replace(/[\uFEFF\u200B\u00A0]/g, " ") 
    .replace(/\s+/g, " ")                  
    .trim();                               

  if (/Ã.|�/.test(cleaned)) {
    const bytes = Uint8Array.from([...cleaned].map(ch => ch.charCodeAt(0)));
    cleaned = new TextDecoder("utf-8").decode(bytes);
  }

  return cleaned;
}
