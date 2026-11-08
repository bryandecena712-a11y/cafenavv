import tls from 'node:tls';

const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 12000;

export function isGmailConfigured() {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

function readCredentials() {
  const username = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!username || !password) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be configured.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || /[\r\n]/.test(username)) {
    throw new Error('GMAIL_USER must be a valid email address.');
  }
  return { username, password };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export async function sendPasswordResetCode(recipient: string, code: string) {
  const { username, password } = readCredentials();
  const socket = tls.connect({
    host: SMTP_HOST,
    port: SMTP_PORT,
    servername: SMTP_HOST,
  });
  socket.setTimeout(SMTP_TIMEOUT_MS);

  let buffer = '';
  let queuedLines: string[] = [];
  let lineWaiter: ((line: string) => void) | null = null;
  let terminalError: Error | null = null;

  socket.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      if (lineWaiter) {
        const resolve = lineWaiter;
        lineWaiter = null;
        resolve(line);
      } else {
        queuedLines.push(line);
      }
      newlineIndex = buffer.indexOf('\n');
    }
  });

  const fail = (error: Error) => {
    terminalError = error;
    if (lineWaiter) {
      const resolve = lineWaiter;
      lineWaiter = null;
      resolve('');
    }
  };
  socket.on('error', fail);
  socket.on('timeout', () => fail(new Error('Gmail SMTP connection timed out.')));
  socket.on('close', () => fail(new Error('Gmail SMTP connection closed unexpectedly.')));

  const readLine = async () => {
    if (queuedLines.length > 0) return queuedLines.shift()!;
    if (terminalError) throw terminalError;
    return new Promise<string>((resolve, reject) => {
      lineWaiter = (line) => {
        if (terminalError) reject(terminalError);
        else resolve(line);
      };
    });
  };

  const readResponse = async () => {
    const lines: string[] = [];
    while (true) {
      const line = await readLine();
      lines.push(line);
      if (/^\d{3} /.test(line)) break;
      if (!/^\d{3}-/.test(line)) {
        throw new Error(`Unexpected Gmail SMTP response: ${line.slice(0, 100)}`);
      }
    }
    const code = Number(lines[lines.length - 1].slice(0, 3));
    return { code, text: lines.join('\n') };
  };

  const expectResponse = async (expected: number[]) => {
    const response = await readResponse();
    if (!expected.includes(response.code)) {
      throw new Error(`Gmail SMTP rejected a command (${response.code}).`);
    }
  };

  const write = (value: string) =>
    new Promise<void>((resolve, reject) => {
      if (terminalError) {
        reject(terminalError);
        return;
      }
      socket.write(value, (error) => (error ? reject(error) : resolve()));
    });

  const command = async (value: string, expected: number[]) => {
    await write(`${value}\r\n`);
    await expectResponse(expected);
  };

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
    });
    await expectResponse([220]);
    await command('EHLO cafenav.app', [250]);
    await command('AUTH LOGIN', [334]);
    await command(Buffer.from(username).toString('base64'), [334]);
    await command(Buffer.from(password).toString('base64'), [235]);
    await command(`MAIL FROM:<${username}>`, [250]);
    await command(`RCPT TO:<${recipient}>`, [250, 251]);
    await command('DATA', [354]);

    const safeCode = escapeHtml(code);
    const message = [
      `From: CafeNav <${username}>`,
      `To: ${recipient}`,
      'Subject: Your CafeNav password reset code',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#18181b">`,
      '<h2>Reset your CafeNav password</h2>',
      '<p>Enter this verification code to set a new password:</p>',
      `<p style="font-size:30px;font-weight:bold;letter-spacing:8px">${safeCode}</p>`,
      '<p>This code expires in 10 minutes and can only be used once. If you did not request a reset, you can ignore this email.</p>',
      '</div>',
    ]
      .join('\r\n')
      .replace(/^\./gm, '..');

    await write(`${message}\r\n.\r\n`);
    await expectResponse([250]);
    await write('QUIT\r\n');
    await expectResponse([221]);
  } finally {
    socket.destroy();
  }
}
