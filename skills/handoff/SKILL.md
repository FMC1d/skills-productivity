---
name: handoff
description: Compacta la conversación actual en un documento de handoff para que otra sesión/agente continúe el trabajo. Lo deja en la carpeta local de handoffs, cristaliza el aprendizaje en el vault (LLM Wiki), y publica en Notion solo el resumen ejecutivo. Usar al cerrar una sesión de trabajo sustantiva, cuando el contexto se está agotando, cuando el usuario dice "handoff", "traspaso", "deja esto documentado para la próxima sesión", o antes de traspasar trabajo a otro agente (Gemini, Sonnet, subagente).
argument-hint: "¿Para qué se usará la próxima sesión?"
---

# Handoff (AgenticEcosystem)

Escribe un documento de handoff que resuma la conversación actual para que un agente fresco pueda continuar el trabajo sin este contexto.

## Contenido del documento

1. **Estado**: qué se completó, qué quedó a medias, qué está bloqueado (y por qué).
2. **Decisiones cerradas**: marcadas como CERRADO, para que la próxima sesión no las re-litigue.
3. **Próximos pasos**: accionables, en orden, con el primero listo para ejecutar.
4. **Skills sugeridas**: qué skills debería invocar el agente que retome (ej: `use-railway`, `n8n-AgenticEcosystem`, `superpowers:systematic-debugging`).
5. **Referencias**: NO duplicar contenido que ya vive en otros artefactos (PRDs, planes, HANDOFF.md de repos, issues, commits). Referenciarlos por ruta o URL.

Si el usuario pasó argumentos, son la descripción del foco de la próxima sesión. Adaptar el documento a eso.

**Redactar SIEMPRE:** eliminar API keys, passwords, tokens y datos personales antes de guardar. Aplica en los tres destinos.

---

## Por qué hay tres destinos (decisiones D6 y D8, 2026-07-21)

Estas decisiones están CERRADAS. No se re-litigan: se aplican.

### D8: handoff unificado, tres destinos con roles distintos

El handoff dejó de tener un solo lugar. Ahora tiene tres, y cada uno sirve a un lector distinto:

| Destino | Lector | Qué recibe |
|---|---|---|
| `_handoffs/<project>/` | agente que retoma | handoff completo, crudo, técnico |
| `vault/cristalizaciones/` | agentes + búsqueda semántica | digest de aprendizaje, entra al grafo |
| Notion, doc `Estado — <Proyecto>` | engineer | avance + decisiones abiertas, nada más |

La razón de fondo: **los handoffs son para AGENTES, no para engineer.** Un handoff completo tiene rutas de archivos, nombres de scripts, estados de bloqueo, detalle de implementación. Eso le sirve a la sesión siguiente y le estorba a la persona que quiere saber cómo va el proyecto. engineer lee Notion.

Esto **supersede** la versión anterior de esta skill, que publicaba el handoff completo en Notion. Si encuentras un handoff completo pegado en Notion, es de antes de D8; no lo repliques.

### D6: Notion es capa ejecutiva, no técnica

A Notion va solo lo que necesita criterio humano:

- resumen del estado de avance,
- decisiones **pendientes de tomar** (las que dependen de engineer).

NO van a Notion: handoffs completos, cristalizaciones técnicas, detalle de implementación, logs de sesión, dumps de arquitectura.

El criterio para saber si algo va a Notion: **¿esto requiere que engineer decida o se entere para operar el negocio?** Si la respuesta es no, se queda local y en el vault.

---

## Dónde se guarda (los tres pasos, en orden)

### 1. Handoff completo, local (SIEMPRE)

`_handoffs/<project>/YYYY-MM-DD-<slug>.md`

donde `<project>` es el directorio de proyecto activo en kebab-case. Crear el directorio si no existe.

Este paso no es opcional y no depende de que haya red ni de que Composio responda.

### 2. Cristalización en el vault (LLM Wiki)

`vault/cristalizaciones/YYYY-MM-DD-<slug>.md`

Es la operación `crystallize` definida en `_schema.md` (v2). El vault está gitignoreado: no aparece en `git status`, eso es normal.

La cristalización NO es una copia del handoff. Es el digest de aprendizaje:

- pregunta o problema que originó el trabajo,
- hallazgos (lo que ahora sabemos y antes no),
- entidades tocadas (con wikilinks),
- lecciones (lo que la próxima sesión debería hacer distinto).

Frontmatter obligatorio, siguiendo el v2 del schema y agregando `ejecutiva`:

```yaml
---
tipo: cristalizacion
estado: activo
creado: YYYY-MM-DD
actualizado: YYYY-MM-DD
confianza: 0.0-1.0
confirmado: YYYY-MM-DD
fuentes: [ruta del handoff local, rutas de docs tocados]
ejecutiva: si | no
---
```

**El campo `ejecutiva` es el que gobierna el paso 3.** Marcarlo así:

- `ejecutiva: si` cuando el trabajo cambia el estado del negocio o deja una decisión esperando a engineer: pricing, contratos, un cliente, un pivote de estrategia, un gasto, un bloqueo que solo él destraba.
- `ejecutiva: no` cuando el trabajo es técnico y se resuelve entre agentes: refactors, fixes, configuración, research interno, documentación.

Ante la duda, `no`. Notion inflado deja de leerse.

Aplican las reglas duras del schema: mínimo 2 wikilinks, fuentes declaradas, sin métricas inventadas, y **sin datos personales de leads o contactos** (Ley 21.719 / GDPR: esos viven en el CRM y BD, la wiki solo referencia dónde están).

### 3. Resumen ejecutivo a Notion (SOLO si `ejecutiva: si`)

Si la cristalización quedó marcada `ejecutiva: no`, **este paso se salta**. Decirlo explícitamente al usuario ("no se publicó a Notion, es trabajo técnico") en vez de omitirlo en silencio.

Si quedó `ejecutiva: si`:

- Destino: doc `Estado — <Proyecto>` en el Workspace Notion configurado, bajo la página raíz del proyecto.
- Se hace **append** al doc de estado con `NOTION_ADD_MULTIPLE_PAGE_CONTENT`. No se crea un doc nuevo por sesión: el doc `Estado — <Proyecto>` es el agregado vivo del proyecto.
- Si el doc `Estado — <Proyecto>` no existe todavía, buscarlo primero con `NOTION_SEARCH_NOTION_PAGE` y recién ahí crearlo con `NOTION_CREATE_NOTION_PAGE`.
- Vía: Composio o integración Notion configurada.
- Si Composio o Notion no están disponibles: guardar local + vault, avisar que el push a Notion quedó pendiente, y seguir. **NO bloquear el handoff por esto.**

Formato del bloque que se agrega (breve, 5 a 10 líneas máximo):

```markdown
### YYYY-MM-DD · <tema corto>
**Avance:** una o dos frases sobre dónde quedó el proyecto.
**Decisiones pendientes (engineer):**
- <decisión 1, con la opción recomendada y por qué>
- <decisión 2>
**Detalle:** handoff completo en `_handoffs/<project>/<archivo>.md`
```

Nada de detalle técnico en ese bloque. Si engineer quiere el detalle, la última línea le dice dónde está.

---

## Convención ICM (conexión entre proyectos)

Los handoffs siguen la lógica del Método ICM (Router, Habitaciones, Workspace):

- Cada proyecto tiene en Notion su doc índice de estado, `Estado — <Proyecto>`. Ese doc es el agregado ejecutivo del proyecto; el handoff local es la fotografía de sesión.
- Si el trabajo cruza proyectos, mencionar el doc índice del otro proyecto también.
- Las cristalizaciones se conectan entre sí por wikilinks dentro del vault, no por Notion. El grafo del conocimiento técnico vive en el vault.

## Checklist de cierre

- [ ] Handoff completo escrito en `_handoffs/<project>/`
- [ ] Cristalización escrita en `vault/cristalizaciones/` con frontmatter v2 + `ejecutiva`
- [ ] Wikilinks agregados (mínimo 2) y entrada en `_log.md` del vault
- [ ] Si `ejecutiva: si`: append al doc `Estado — <Proyecto>` en Notion
- [ ] Si `ejecutiva: no`: avisado al usuario que no se publicó y por qué
- [ ] Verificado que no quedaron keys, tokens ni datos personales en ninguno de los tres

## Referencias

- Schema del vault (frontmatter v2, decay, relaciones tipadas, privacidad): `vault/_schema.md`
- Convenciones de persistencia y memoria entre sesiones de agentes.
