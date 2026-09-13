---
id: inbox-cleaner
name: Inbox Cleaner
version: 1.0.0
category: productivity
agent: monitor
trigger: "\\f inbox clean"
requires: [gmail-api, claude-api]
type: code-assisted
description: Clasifica emails no leidos por prioridad y limpia ruido en lote
---

# SOP: Inbox Cleaner

## Objetivo
Revisar todos los correos no leidos, clasificarlos por prioridad y marcar como leidos los irrelevantes automaticamente.

## Entrada
- Credenciales Gmail OAuth2 (configuradas en .env)
- Opcional: whitelist de remitentes prioritarios
- Opcional: numero maximo de correos a procesar (default: 100)

## Proceso

### Paso 1: Conectar con Gmail API
- Autenticar via OAuth2 (token refresh automatico)
- Obtener lista de mensajes con label:UNREAD
- Limitar a los ultimos N mensajes (configurable)

### Paso 2: Extraer Metadata de Cada Email
Para cada correo extraer:
- From (remitente)
- Subject (asunto)
- Date (fecha)
- Snippet (primeras lineas)
- Labels existentes
- Thread ID (para saber si es parte de conversacion)

### Paso 3: Clasificar con IA
Categorias de clasificacion:

**PRIORIDAD ALTA (no tocar):**
- Emails de humanos con contenido personalizado
- Respuestas a correos que yo envie
- Emails de clientes conocidos
- Emails con palabras clave: "urgente", "contrato", "pago", "propuesta", "reunion"
- Emails de dominios en whitelist

**PRIORIDAD MEDIA (mantener no leido):**
- Emails de servicios que uso activamente (Vercel, Convex, Railway, etc.)
- Alertas de errores de produccion
- Emails de contactos conocidos pero no urgentes

**IRRELEVANTE (marcar como leido):**
- Newsletters y digests
- Notificaciones automaticas de redes sociales
- Emails de marketing/ventas de terceros (cold emails entrantes)
- Facturas automaticas y recibos
- Notificaciones de apps (GitHub stars, Slack summaries)
- Emails con "unsubscribe" en el footer y contenido generico

### Paso 4: Ejecutar Acciones en Lote
- Marcar como leidos todos los IRRELEVANTES via batch modify
- Agregar label "SAAN/Priority" a los de PRIORIDAD ALTA
- Generar reporte de lo procesado

## Formato de Salida

```json
{
  "processed": 87,
  "high_priority": 5,
  "medium_priority": 12,
  "marked_as_read": 70,
  "summary": [
    {
      "from": "cliente@empresa.cl",
      "subject": "Re: Propuesta comercial",
      "priority": "high",
      "reason": "Respuesta de cliente a propuesta activa"
    }
  ],
  "timestamp": "2026-03-05T10:00:00-03:00"
}
```

## Gmail API Endpoints Clave
- `GET /gmail/v1/users/me/messages?q=is:unread` — listar no leidos
- `GET /gmail/v1/users/me/messages/{id}?format=metadata` — metadata rapida
- `POST /gmail/v1/users/me/messages/batchModify` — marcar lote como leidos
- `POST /gmail/v1/users/me/messages/{id}/modify` — agregar/quitar labels

## Clasificacion Hibrida (investigacion 2026)
1. **Primero: reglas heuristicas** (rapido, sin costo):
   - Header `List-Unsubscribe` presente → newsletter
   - Header `Precedence: bulk` o `list` → automatizado
   - Header `X-Mailer` con plataformas (Mailchimp, SendGrid, HubSpot)
   - Gmail categories: CATEGORY_PROMOTIONS, CATEGORY_UPDATES, CATEGORY_SOCIAL
2. **Solo si ambiguo: Claude API** para clasificacion fina
   - Enviar subject + from + primeras 200 palabras
   - Structured output JSON: HUMANO | NEWSLETTER | FACTURA | NOTIFICACION | SPAM

## Implementacion Preferida: n8n
Workflow: Gmail Trigger (cada 15 min) → Code node (heuristicas) → IF node → Claude API (solo ambiguos) → Gmail node (labels + mark read)

## Reglas
- NUNCA borrar emails, solo marcar como leidos
- NUNCA marcar como leido un email de un humano que escribio algo personalizado
- Si hay duda, clasificar como PRIORIDAD MEDIA (falso positivo > falso negativo)
- Respetar rate limits de Gmail API (250 quota units/segundo)
- batchModify acepta hasta 1000 message IDs por llamada
- Logging completo de cada accion para auditoria
- Labels a crear: SAAN/Priority, SAAN/Newsletter, SAAN/Factura, SAAN/Sistema
