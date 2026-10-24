import { getMailgunClient, MAILGUN_DOMAIN } from '../mailgun/mailgunClient';
import type { RenderedEmail } from './renderEmail';

/**
 * Send an email using Mailgun. Returns true for success or false for failure.
 */
export const sendMailgunEmail = async (email: RenderedEmail): Promise<boolean> => {
  if (email.user?.deleted) {
    // eslint-disable-next-line no-console
    console.error("Attempting to send an email to a deleted user");
    return false;
  }

  if (process.env.ENV_NAME === 'humanstudy') {
    const apiKey = process.env.HUMANSTUDY_RESEND_API_KEY;
    const from = process.env.private_defaultEmail;
    if (!apiKey || !from) throw new Error('Forum email delivery is not configured.');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: email.to, subject: email.subject, text: email.text, html: email.html }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Forum email delivery failed:', response.status);
    }
    return response.ok;
  }

  const mailgunClient = getMailgunClient();
  
  if (!mailgunClient) {
    // eslint-disable-next-line no-console
    console.error("Unable to send email because no Mailgun API key is configured");
    return false;
  }
  
  const result = await mailgunClient.messages.create(MAILGUN_DOMAIN, {
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html
  });
  
  return result.status === 200;
}
