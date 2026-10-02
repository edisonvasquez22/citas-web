# Hook de pre-commit (S3: red automatizada que dice "no")

`pre-commit` hace dos cosas antes de permitir un commit:

1. **Bloquea secretos:** escanea solo las líneas *agregadas* del diff staged y rechaza el commit si parecen una clave AWS, una clave privada o una asignación `password/secret/token/api-key = <valor largo>`. Ignora `src/test/resources/**` y valores `CHANGE_ME`, `example` o `${VAR}`.
2. **Corre las verificaciones:** si el diff toca Java ejecuta `mvn -q test`; si toca TypeScript ejecuta `npm run build` y `npm run lint`.

Instalación (una vez por clon): `sh scripts/install-hooks.sh`

Evidencia de la demostración FAIL → PASS (secreto ficticio bloqueado y luego commit permitido): `citas-api/docs/wiki/llm-wiki/wiki/log.md`, entrada del 2026-09-25.
