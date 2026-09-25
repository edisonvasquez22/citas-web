# AGENTS.md — `citas-web`

> Generado a partir de `../prompts/agents/PROMPT_AGENT_CITAS_WEB.md` tras importar el primer export real de Google AI Studio (2026-09-18) y reconciliarlo contra el PRD/backlog. Reemplaza a `AGENTS.md.template`. Revisado/depurado contra evidencia real del repo el 2026-09-21, 2026-09-22 y 2026-09-25.

## Responsabilidad de este repo

- TypeScript + React 19 + Vite 8 + Tailwind CSS 4 (stack detectado en el export de Google AI Studio; no cambiar de framework por preferencia propia).
- Consume `citas-api` directamente por REST vía `fetch`. **Sin Express ni BFF** (el export de AI Studio traía `express`/`dotenv`/`@google/genai` sin uso real; se retiraron de `package.json`).
- URL de la API configurable por `VITE_API_URL` (ver `.env.example`; por defecto `http://localhost:8080`).
- Reglas de negocio son autoridad del backend; el frontend solo valida formato en cliente (UX), nunca duplica reglas.

## Estado real del código (verificado, no asumir más de esto)

- Dos flujos conectados al backend real: **login** (HU-002) contra `POST /api/auth/login`, con manejo de `401` (credenciales inválidas) y errores de red; y **registro** (HU-001, `RegisterScreen.tsx`) contra `POST /api/auth/register`, con manejo de `400` (mapea `detalles` a errores por campo), `409` (email/documento duplicado — el mensaje del backend ya distingue cuál) y errores de red. `SuccessView` cierra sesión contra `POST /api/auth/logout` (también HU-002).
- La recuperación de contraseña (`PasswordRecoveryModal`) sigue siendo un **placeholder informativo**: HU-003 sigue en `Borrador` (no aprobada), por eso el modal solo indica "próximamente" en vez de simular un envío falso.
- `RegisterScreen.tsx` (2026-09-22) se extrajo de un segundo export de AI Studio para esta pantalla (carpeta `citas-web/registro/`, ya eliminada tras integrar). Ese export volvió a traer problemas ya conocidos que se corrigieron al integrar: envío simulado con una barra de "presets" de prueba (`SimulationBar`, eliminada — se reemplazó por el `fetch` real) y una librería de íconos distinta (`lucide-react`) a la que ya usa el resto de la app (`material-symbols-outlined`) — se homologaron los íconos. También traía de más pantallas de agenda/citas (`ScheduleScreen`, `AppointmentsScreen`) y una segunda implementación de login (`LoginScreen`) — descartadas, no forman parte del alcance aprobado ni reemplazan el login ya integrado.
- El componente `RegistrationModal.tsx` (el aviso informativo antiguo de "regístrate") se eliminó (2026-09-22, a pedido del usuario) al quedar huérfano por `RegisterScreen.tsx`.
- No hay pantallas de agenda/citas/profesionales todavía: el export original de AI Studio traía 5 pantallas (login, sesión activa, reserva de quirófano, mis citas, protocolos) bajo una premisa incorrecta ("laboratorio de simulación quirúrgica para residentes") que no coincide con el PRD real (paciente ficticio que se autorregistra, agenda citas médicas con profesionales de HIC/ICV). Se descartaron las 3 pantallas fuera de alcance (`BookingMatrixView`, `MyAppointmentsView`, `ProtocolsView`) y sus datos mock (`data/mockData.ts`) — no implementan ninguna HU aprobada todavía (EP-005 a EP-009 siguen en Borrador).
- Textos que contradecían el PRD ya fueron corregidos (ver `docs/wiki/llm-wiki/wiki/decisiones.md` del workspace, entrada 2026-09-18): audiencia "personal médico y residentes" → pacientes; registro "aprovisionado por Docencia" → autorregistro; FAQ de soporte referían pantallas inexistentes.
- Layout/estilo visual de la pantalla de login **no se tocó** (fondo, tarjeta, tipografía, colores) salvo quitar el selector de "Modo de prueba" (scaffolding de mocks de AI Studio, sin valor una vez conectado al backend real).

**Estado verificado (2026-09-21):** `npm run lint` (`tsc --noEmit`) y `npm run build` en `EXIT 0`, sin advertencias (se corrigió un aviso real de Vite sobre `__dirname` en `vite.config.ts`, reemplazado por `import.meta.dirname`). Verificado además con Playwright headless: la pantalla renderiza sin errores de consola, el envío del formulario dispara un `POST` real a `/api/auth/login`, y muestra "Error de Conexión" correctamente cuando el backend no está corriendo (screenshot revisado, no solo el HTTP 200 del servidor).

**Estado verificado (2026-09-22):** ídem para `RegisterScreen.tsx` — `npm run lint`/`npm run build` en `EXIT 0`; Playwright confirma que el envío dispara `POST /api/auth/register` real y muestra el error de conexión correctamente cuando el backend no está corriendo (screenshots revisados).

- **2026-09-25 — Pantalla de "Agendar Cita" (HU-013/HU-014/HU-015) integrada.** Export de AI Studio en `citas-web/fcv-citas---portal-asistencial-hospitalario/` (ya eliminado tras extraer lo útil) traía un portal completo de más alcance del pedido: pestañas "Mis Citas" (HU-017, sin aprobar), "Resultados" de laboratorio/imágenes (**ninguna HU del backlog cubre esto — invención de AI Studio, no PRD**), "Sedes" y "Ayuda" (sin HU), un `SimStrip` para simular manualmente cualquier estado de la pantalla (scaffolding de demo, mismo patrón que el "Modo de prueba" ya retirado de login), y un `PatientRibbon`/`PatientModal` con datos de paciente inventados (biometría, número de historia clínica, plan de cobertura — nada de eso existe en la API real; no hay endpoint de perfil, EP-002 sin aprobar). Todo eso se descartó.
  - Se integró **solo** el flujo de agendar cita: `BookingView.tsx` (formulario + horarios), `SuccessGeneralView.tsx`/`PendingEspecializadaView.tsx` (confirmación) y `EmptyStateView.tsx` (sin turnos), orquestados por el nuevo `AgendarCitaScreen.tsx`, accesible con un botón "Agendar una cita" agregado a `SuccessView.tsx`.
  - Todos los datos mock (`data/mockData.ts`: doctores, especialidades, horarios ocupados fijos) se reemplazaron por llamadas reales: `GET /api/specialties`, `GET /api/professionals` (endpoint nuevo, ver más abajo), `GET /api/availability`, `POST /api/appointments/general` / `POST /api/appointments/specialized`. La regla de "60 min = 2 slots consecutivos" ya no se recalcula en el cliente: el backend la resuelve (HU-013) y el frontend solo pinta lo que devuelve.
  - El "código de cita" con formato bonito (`FCV-GEN-89421`) que traía el export es inventado: no existe en el contrato real. Se reemplazó por el `citaId` numérico real que devuelve la API. El campo `prep` (preparación previa) de la especialidad tampoco existe en la API (`specialties` no tiene esa columna en el esquema real) — se quitó de las pantallas de confirmación en vez de inventarlo.
  - Identidad del paciente en las pantallas de confirmación: `session.email` (lo único real que hay hasta que exista un endpoint de perfil), no los campos inventados del `PatientRibbon`/`PatientModal` originales.
  - **Cambio cross-repo necesario en `citas-api`** (coordinado por el orquestador, no decisión unilateral de este agente): se agregó `GET /api/professionals` (lectura pública para cualquier usuario autenticado) porque no existía ningún endpoint que un paciente pudiera usar para ver el nombre de un profesional — antes solo existía `/api/admin/professionals` (solo ADMIN). Ver `citas-api/AGENTS.md` y `docs/wiki/llm-wiki/wiki/contratos.md`.
  - Verificado: `npm run lint` (`tsc --noEmit`) y `npm run build` en `EXIT 0`.
  - **No verificado con Playwright/navegador real todavía** (a diferencia de login/registro) — pendiente antes de dar esta HU por cerrada del lado frontend.

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
5. Ejecuta build/typecheck (`npm run build`, `npm run lint` — este último es `tsc --noEmit`). Node.js 24 LTS ya está instalado en la máquina del estudiante (ver `AGENTS.md` raíz); ambos comandos están verificados en `EXIT 0` a la fecha de este archivo.
6. Verifica comportamiento contra criterios de aceptación.
7. Resume evidencia.

No mantengas una LLM Wiki propia: la wiki global la mantiene el agente orquestador en `citas-api/docs/wiki/llm-wiki/` (raíz del workspace, `AGENTS.md`).
