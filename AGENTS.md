# AGENTS.md — `citas-web`

> Generado a partir de `../prompts/agents/PROMPT_AGENT_CITAS_WEB.md` tras importar el primer export real de Google AI Studio (2026-09-18) y reconciliarlo contra el PRD/backlog. Reemplaza a `AGENTS.md.template`.

## Responsabilidad de este repo

- TypeScript + React 19 + Vite 8 + Tailwind CSS 4 (stack detectado en el export de Google AI Studio; no cambiar de framework por preferencia propia).
- Consume `citas-api` directamente por REST vía `fetch`. **Sin Express ni BFF** (el export de AI Studio traía `express`/`dotenv`/`@google/genai` sin uso real; se retiraron de `package.json`).
- URL de la API configurable por `VITE_API_URL` (ver `.env.example`; por defecto `http://localhost:8080`).
- Reglas de negocio son autoridad del backend; el frontend solo valida formato en cliente (UX), nunca duplica reglas.

## Estado real del código (verificado, no asumir más de esto)

- Único flujo conectado al backend real: **login** (HU-002) contra `POST /api/auth/login`, con manejo de `401` (credenciales inválidas) y errores de red. `SuccessView` cierra sesión contra `POST /api/auth/logout` (también HU-002).
- El registro (`RegistrationModal`) y la recuperación de contraseña (`PasswordRecoveryModal`) son **placeholders informativos**, no formularios funcionales: HU-001 (registro) ya existe en el backend (`POST /api/auth/register`) pero su pantalla no se ha construido; HU-003 (recuperar contraseña) sigue en `Borrador` (no aprobada), por eso su modal solo indica "próximamente" en vez de simular un envío falso.
- No hay pantallas de agenda/citas/profesionales todavía: el export original de AI Studio traía 5 pantallas (login, sesión activa, reserva de quirófano, mis citas, protocolos) bajo una premisa incorrecta ("laboratorio de simulación quirúrgica para residentes") que no coincide con el PRD real (paciente ficticio que se autorregistra, agenda citas médicas con profesionales de HIC/ICV). Se descartaron las 3 pantallas fuera de alcance (`BookingMatrixView`, `MyAppointmentsView`, `ProtocolsView`) y sus datos mock (`data/mockData.ts`) — no implementan ninguna HU aprobada todavía (EP-005 a EP-009 siguen en Borrador).
- Textos que contradecían el PRD ya fueron corregidos (ver `docs/wiki/llm-wiki/wiki/decisiones.md` del workspace, entrada 2026-09-18): audiencia "personal médico y residentes" → pacientes; registro "aprovisionado por Docencia" → autorregistro; FAQ de soporte referían pantallas inexistentes.
- Layout/estilo visual de la pantalla de login **no se tocó** (fondo, tarjeta, tipografía, colores) salvo quitar el selector de "Modo de prueba" (scaffolding de mocks de AI Studio, sin valor una vez conectado al backend real).

## Reglas

- No añadir Express/BFF.
- No implementar reglas de negocio solo en cliente; backend es autoridad.
- No hardcodear tokens ni secretos; `VITE_API_URL` por environment.
- Mantener alta fidelidad al diseño aprobado de Stitch/AI Studio al reconciliar — no rediseñar sin pedirlo el usuario (el diseño visual es responsabilidad exclusiva del usuario, ver `AGENTS.md` raíz regla 11).
- No construir pantallas/flujos de HU que sigan en `Borrador`/`Pendiente de aprobación` en `citas-api/docs/wiki/scrum/`.
- No editar `citas-api` desde este agente; si el contrato no alcanza, reportar el cambio cross-repo al orquestador.

## Modo de trabajo

1. Lee la HU/CA/DoD relevante en `citas-api/docs/wiki/scrum/historias-de-usuario/`.
2. Identifica pantallas/componentes/servicios afectados.
3. Mapea estados loading/empty/error/success/disabled.
4. Implementa sin rediseñar lo aprobado.
5. Ejecuta build/typecheck (`npm run build`, `npm run lint` — este último es `tsc --noEmit`) — **pendiente de verificar en este entorno**: no hay Node.js instalado todavía (ver `docs/wiki/llm-wiki/wiki/decisiones.md`); usar el contenedor `citas-web-dev` de `docker-compose.yml` o instalar Node localmente antes de confiar en el build.
6. Verifica comportamiento contra criterios de aceptación.
7. Resume evidencia.

No mantengas una LLM Wiki propia: la wiki global la mantiene el agente orquestador en `citas-api/docs/wiki/llm-wiki/` (raíz del workspace, `AGENTS.md`).
