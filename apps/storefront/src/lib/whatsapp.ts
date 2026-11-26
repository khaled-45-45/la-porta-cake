/** WhatsApp numbers as wa.me expects them: digits only, international, no leading zero. */
const WA_NUMBER = /^[1-9]\d{7,14}$/;
// Control characters other than line feed; a message never needs them.
const CONTROL = new RegExp('[\\u0000-\\u0009\\u000B-\\u001F\\u007F-\\u009F]', 'g');

interface MessageOptions {
  /**
   * Keep line breaks (at most one empty line in a row), for messages with several
   * details such as a custom-order inquiry. Otherwise the message is one line.
   */
  multiline?: boolean;
}

/**
 * A wa.me link that opens a chat with the shop and a prepared message.
 * The number must be the verified store number (StoreSettings.whatsapp.number); anything
 * else is rejected rather than turned into a link. The whole message is percent-encoded
 * with encodeURIComponent, so nothing in it can add parameters or change the address;
 * spaces become %20 and line breaks %0A, which WhatsApp shows as typed.
 */
export function whatsappOrderUrl(
  number: string,
  message: string,
  { multiline = false }: MessageOptions = {},
): string {
  if (!WA_NUMBER.test(number)) {
    throw new Error('WhatsApp number must be digits only, in international format.');
  }
  const unified = message.replace(/\r\n?/g, '\n').replace(CONTROL, ' ');
  const text = multiline
    ? unified
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : unified.replace(/\s+/g, ' ').trim();
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
