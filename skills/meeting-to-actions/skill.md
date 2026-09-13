---
id: meeting-to-actions
name: Meeting Notes to Action Items
version: 1.0.0
category: productivity
agent: workflow
trigger: "\\f meeting actions"
requires: [claude-api]
type: deterministic-text
description: Procesa transcripciones de reuniones y extrae informacion estructurada
---

# SOP: Meeting Notes to Action Items

## Objetivo
Transformar transcripciones de reuniones en informacion accionable estructurada.

## Entrada
- Transcripcion completa de una reunion (texto plano, .txt, .md, o pegado directo)
- Opcional: lista de participantes conocidos

## Proceso

### Paso 1: Identificar Participantes
- Extraer todos los nombres mencionados
- Cruzar con lista de participantes si se proporciona
- Asignar roles si son evidentes (cliente, proveedor, interno)

### Paso 2: Extraer Decisiones Tomadas
- Buscar frases como "decidimos", "acordamos", "vamos a", "queda definido"
- Cada decision debe tener: descripcion, quien la tomo, contexto

### Paso 3: Extraer Tareas y Responsables
Para cada tarea identificar:
- **Descripcion** de la tarea
- **Responsable** (nombre de la persona asignada)
- **Fecha limite** (si se menciono)
- **Prioridad** (alta/media/baja, inferida del contexto)
- **Dependencias** (si depende de otra tarea)

### Paso 4: Extraer Preguntas Abiertas
- Temas que quedaron sin resolver
- Preguntas que se plantearon sin respuesta
- Items que requieren mas investigacion

### Paso 5: Extraer Datos de Contacto
- Telefonos mencionados
- Emails mencionados
- URLs o sitios web
- Direcciones fisicas

### Paso 6: Generar Resumen Ejecutivo
- Resumen de 3-5 lineas de la reunion
- Duracion estimada
- Proximo paso inmediato

## Formato de Salida

```json
{
  "meeting_summary": {
    "title": "string",
    "date": "ISO date si se menciona",
    "participants": ["nombre1", "nombre2"],
    "duration_estimate": "string",
    "executive_summary": "string (3-5 lineas)"
  },
  "decisions": [
    {
      "description": "string",
      "decided_by": "string",
      "context": "string"
    }
  ],
  "action_items": [
    {
      "task": "string",
      "assignee": "string",
      "deadline": "ISO date o null",
      "priority": "alta|media|baja",
      "dependencies": ["string"]
    }
  ],
  "open_questions": [
    {
      "question": "string",
      "raised_by": "string o null",
      "context": "string"
    }
  ],
  "contact_info": [
    {
      "type": "phone|email|url|address",
      "value": "string",
      "context": "string"
    }
  ],
  "next_steps": "string"
}
```

## Integraciones Automaticas (post-procesamiento)

### Google Calendar API
- Si se detecto "proxima reunion" con fecha concreta:
  - Crear evento con `calendar.events.insert`
  - Incluir participantes como attendees
  - Timezone: America/Santiago

### Todoist / Linear (task manager)
- Crear tarea por cada action item con fecha limite
- Todoist API: POST /rest/v2/tasks
- Prioridad mapping: alta=4, media=3, baja=2 (Todoist usa escala invertida)

### Email de Resumen (Resend)
- Enviar resumen estructurado a todos los participantes
- Incluir action items asignados a cada persona

### Pipeline n8n Recomendado
Webhook (recibe transcripcion) → Claude API (structured output JSON) → Code node (parsear) → Todoist node (crear tareas) + Google Calendar node (crear evento) + Resend node (enviar resumen)

## Reglas
- Si no se menciona fecha limite, dejar como null (no inventar)
- Si no se puede determinar el responsable, poner "Sin asignar"
- Inferir fechas relativas: "la proxima semana" → fecha concreta
- Distinguir entre compromisos firmes vs ideas sueltas
- Prioridad se infiere del tono y urgencia del contexto
- NUNCA inventar informacion que no este en la transcripcion
- Mantener las citas textuales cuando sean relevantes
