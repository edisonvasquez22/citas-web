# citas-web

Frontend en TypeScript + React 19 + Vite + Tailwind CSS, importado desde Google AI Studio y reconciliado contra el PRD. Consume `citas-api` directamente por REST (sin Express ni BFF). Ver `AGENTS.md` para reglas y estado verificado.

## Pantallas

| Rol | Pantallas |
|---|---|
| Público | Login, registro, recuperación de contraseña (token + nueva contraseña) |
| USER | Inicio, agendar cita, mis citas (cancelar, reprogramar, historial), mi perfil + afiliación EPS |
| PROFESSIONAL | Inicio, mi agenda (cierre de atención, historial), mi disponibilidad |
| ADMIN | Inicio, aprobación de citas, reprogramaciones, especialidades y profesionales (incl. editar asignaciones), EPS y planes |

Toda la interfaz está disponible en **español e inglés** (botón ES/EN del header).

## Ejecutar en local

Recomendado: contenedor `citas-web-dev` de `../docker-compose.yml` (Node 24).

1. `npm install`
2. Copiar `.env.example` a `.env` y ajustar `VITE_API_URL` si `citas-api` no corre en `http://localhost:8080`.
3. `npm run dev` → `http://localhost:5173`

| Comando | Qué hace |
|---|---|
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm test` | Pruebas (vitest + Testing Library) |
| `npm run build` | Build de producción |

## Convenciones

- **Llamadas a la API:** `apiFetch` de `src/api/session.ts`. Pone el token vigente, renueva la sesión ante un 401 y la cierra si la renovación falla. La sesión se guarda en `sessionStorage`.
- **Textos:** `t('texto en español')` de `src/i18n`, con la traducción en `src/i18n/en.ts`. `npm test` falla si falta alguna.
- **Navegación por rol:** `src/navigation.ts` define qué pantallas puede abrir cada rol.

## Flujo de trabajo para nuevas pantallas

1. Diseñar con la Skill `stitch-design-to-frontend`.
2. Aprobar el diseño (usuario).
3. Exportar/continuar en Google AI Studio.
4. Importar el código generado aquí.
5. Reconciliar el resultado con el diseño aprobado y con las HU aprobadas del backlog.
6. Integrar contra `citas-api` con `apiFetch` y envolver los textos en `t()`.
