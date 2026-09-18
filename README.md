# citas-web

Frontend en TypeScript + React 19 + Vite + Tailwind CSS, importado desde Google AI Studio y reconciliado contra el PRD. Ver `AGENTS.md` para reglas y estado real del código.

**Alcance actual (2026-09-18):** solo la pantalla de login (HU-002), conectada a `citas-api` real. El resto del backlog (registro con formulario propio, recuperar contraseña, agenda, citas, etc.) sigue pendiente de HU aprobadas.

## Ejecutar en local

**Prerrequisitos:** Node.js (no instalado todavía en esta máquina; alternativa: contenedor `citas-web-dev` de `../docker-compose.yml`).

1. `npm install`
2. Copiar `.env.example` a `.env` y ajustar `VITE_API_URL` si `citas-api` no corre en `http://localhost:8080`.
3. `npm run dev`
4. Typecheck: `npm run lint` (`tsc --noEmit`). Build: `npm run build`.

No usar Express/BFF.

## Flujo de trabajo para nuevas pantallas

1. diseñar con la Skill `stitch-design-to-frontend`;
2. aprobar el diseño (usuario);
3. exportar/continuar en Google AI Studio;
4. importar el código generado aquí;
5. reconciliar el resultado con el diseño aprobado y con las HU aprobadas del backlog;
6. integrar REST directamente contra `citas-api`.
