/**
 * Inbox Cleaner — SAAN Skill
 * Clasifica emails no leidos y marca como leidos los irrelevantes.
 * Requiere: Gmail API con OAuth2 configurado.
 */

const { google } = require("googleapis");

// Palabras clave que indican prioridad alta
const HIGH_PRIORITY_KEYWORDS = [
  "urgente", "contrato", "pago", "propuesta", "reunion",
  "factura", "cotizacion", "presupuesto", "llamada", "demo",
  "urgent", "payment", "proposal", "contract", "meeting",
];

// Dominios de servicios conocidos (prioridad media)
const SERVICE_DOMAINS = [
  "vercel.com", "convex.dev", "railway.app", "resend.com",
  "github.com", "netlify.com", "clerk.com", "stripe.com",
];

// Patrones de emails irrelevantes
const IRRELEVANT_PATTERNS = [
  /no-?reply@/i,
  /noreply@/i,
  /newsletter@/i,
  /digest@/i,
  /notifications?@/i,
  /marketing@/i,
  /promotions?@/i,
  /updates?@/i,
  /info@.*\.com$/i,
];

// Indicadores de email automatizado en el cuerpo
const AUTOMATED_INDICATORS = [
  "unsubscribe", "darse de baja", "desuscribir",
  "view in browser", "ver en navegador",
  "email preferences", "preferencias de email",
  "this is an automated", "este es un mensaje automatico",
];

function classifyEmail(email) {
  const from = (email.from || "").toLowerCase();
  const subject = (email.subject || "").toLowerCase();
  const snippet = (email.snippet || "").toLowerCase();
  const combined = `${from} ${subject} ${snippet}`;

  // Check whitelist domains first
  if (email.whitelistDomains?.some((d) => from.includes(d))) {
    return { priority: "high", reason: "Dominio en whitelist" };
  }

  // Check if it's a reply to our email
  if (email.isReply) {
    return { priority: "high", reason: "Respuesta a email enviado" };
  }

  // Check high priority keywords
  for (const kw of HIGH_PRIORITY_KEYWORDS) {
    if (combined.includes(kw)) {
      return { priority: "high", reason: `Contiene palabra clave: "${kw}"` };
    }
  }

  // Check irrelevant patterns
  for (const pattern of IRRELEVANT_PATTERNS) {
    if (pattern.test(from)) {
      return { priority: "irrelevant", reason: `Remitente automatizado: ${from}` };
    }
  }

  // Check automated indicators in body
  for (const indicator of AUTOMATED_INDICATORS) {
    if (combined.includes(indicator)) {
      return { priority: "irrelevant", reason: `Indicador de email automatizado: "${indicator}"` };
    }
  }

  // Check service domains (medium priority)
  for (const domain of SERVICE_DOMAINS) {
    if (from.includes(domain)) {
      return { priority: "medium", reason: `Servicio conocido: ${domain}` };
    }
  }

  // Default: if it looks like a real person, keep it
  return { priority: "medium", reason: "No clasificado automaticamente — mantener por seguridad" };
}

async function createGmailClient(credentials) {
  const auth = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
  );
  auth.setCredentials({
    refresh_token: credentials.refreshToken,
  });
  return google.gmail({ version: "v1", auth });
}

async function getUnreadEmails(gmail, maxResults = 100) {
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults,
  });

  if (!res.data.messages) return [];

  const emails = [];
  for (const msg of res.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date", "In-Reply-To"],
    });

    const headers = detail.data.payload.headers;
    const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    emails.push({
      id: msg.id,
      threadId: msg.threadId,
      from: getHeader("From"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      snippet: detail.data.snippet,
      isReply: !!getHeader("In-Reply-To"),
      labelIds: detail.data.labelIds || [],
    });
  }

  return emails;
}

async function batchMarkAsRead(gmail, messageIds) {
  if (messageIds.length === 0) return;

  await gmail.users.messages.batchModify({
    userId: "me",
    requestBody: {
      ids: messageIds,
      removeLabelIds: ["UNREAD"],
    },
  });
}

async function addLabel(gmail, messageId, labelName) {
  // Get or create label
  const labels = await gmail.users.labels.list({ userId: "me" });
  let label = labels.data.labels.find((l) => l.name === labelName);

  if (!label) {
    const created = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    label = created.data;
  }

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: [label.id],
    },
  });
}

async function cleanInbox(credentials, options = {}) {
  const {
    maxResults = 100,
    whitelistDomains = [],
    dryRun = false,
  } = options;

  const gmail = await createGmailClient(credentials);
  const emails = await getUnreadEmails(gmail, maxResults);

  const results = {
    processed: emails.length,
    high_priority: 0,
    medium_priority: 0,
    marked_as_read: 0,
    summary: [],
    timestamp: new Date().toISOString(),
  };

  const toMarkAsRead = [];

  for (const email of emails) {
    email.whitelistDomains = whitelistDomains;
    const classification = classifyEmail(email);

    if (classification.priority === "high") {
      results.high_priority++;
      results.summary.push({
        from: email.from,
        subject: email.subject,
        priority: "high",
        reason: classification.reason,
      });
      if (!dryRun) {
        await addLabel(gmail, email.id, "SAAN/Priority");
      }
    } else if (classification.priority === "medium") {
      results.medium_priority++;
    } else {
      toMarkAsRead.push(email.id);
    }
  }

  if (!dryRun && toMarkAsRead.length > 0) {
    // Batch in groups of 1000 (Gmail limit)
    for (let i = 0; i < toMarkAsRead.length; i += 1000) {
      await batchMarkAsRead(gmail, toMarkAsRead.slice(i, i + 1000));
    }
  }

  results.marked_as_read = toMarkAsRead.length;

  return results;
}

module.exports = { cleanInbox, classifyEmail };

// CLI usage
if (require.main === module) {
  console.log("Inbox Cleaner — requiere credenciales Gmail OAuth2 en .env");
  console.log("Uso programatico: const { cleanInbox } = require('./script');");
}
