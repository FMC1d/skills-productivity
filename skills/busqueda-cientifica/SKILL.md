---
name: busqueda-cientifica
description: Buscar literatura cientifica, encontrar papers, revisar el estado del arte, conseguir el PDF de un articulo open access, o armar referencias APA 7 a partir de un DOI. Usar cuando el usuario pida buscar papers, revisar literatura, citar un articulo, verificar si algo es open access, o preguntar "que dice la literatura sobre X".
---

# Busqueda cientifica (vias legales)

Herramienta: `scripts/litsearch.py` (Python 3, solo necesita `requests`). Sin API keys. El email de contacto sale de la variable de entorno `LITSEARCH_MAILTO`.

## Que fuente usar

| Necesidad | Subcomando | Fuente |
|---|---|---|
| Estado del arte, cualquier disciplina | `search` | OpenAlex (250M+ obras) |
| Biomedico con texto completo | `pmc` | Europe PMC |
| Saber si un DOI tiene copia abierta | `oa` | Unpaywall |
| Referencia APA 7 / BibTeX | `cite` | Crossref |
| Bajar el PDF (solo si es OA) | `pdf` | Unpaywall + repositorios |

Regla de orden: `search` para mapear el campo → `oa` o `pdf` para conseguir el texto → `cite` al momento de escribir las referencias.

## Ejemplos

```bash
python scripts/litsearch.py search "neural attention mechanisms survey" --desde 2021 -n 20
python scripts/litsearch.py pmc "crispr off-target effects therapeutic" --solo-fulltext -n 10
python scripts/litsearch.py oa 10.1002/adhm.202300584
python scripts/litsearch.py cite 10.1002/adhm.202300584
python scripts/litsearch.py pdf 10.1038/s41419-022-05034-x --dir "_recursos/referencias"
```

Flags utiles de `search`: `--desde`/`--hasta` (anios), `--solo-oa`, `--tipo review`,
`--orden cited_by_count:desc` (papers fundacionales) o `publication_date:desc`
(lo mas reciente). Todo subcomando acepta `--json`.

## Reglas de uso

1. **Cuando el paper esta cerrado, se dice y se para.** `oa` y `pdf` reportan
   "CERRADO" y entregan el enlace DOI. La ruta correcta es el proxy de la
   biblioteca institucional o pedirselo al autor. No buscar el PDF en
   Sci-Hub, LibGen ni mirrors.
2. **Verificar antes de citar.** OpenAlex y Crossref pueden traer errores de metadatos
   (anio o revista equivocada). Contrastar contra la pagina del DOI antes de que
   una referencia entre a un informe definitivo.
3. **Nunca inventar un DOI ni una referencia.** Si `cite` falla, decirlo.
4. Los PDF descargados van a `_recursos/referencias/` del proyecto que
   corresponda, nunca sueltos en la raiz.
5. Formato de referencias predeterminado: **APA 7** (`--estilo apa`).

## Complemento: Consensus MCP

Para sintesis de evidencia (no solo listado de papers) esta el MCP oficial de
Consensus en `https://mcp.consensus.app/mcp`, que filtra por tipo de estudio y
cuartil SJR. Sirve para la pregunta "que concluye la literatura sobre X";
`litsearch` sirve para "dame los papers y sus PDF". Se complementan.
