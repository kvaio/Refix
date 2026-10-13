# Manual de Git y GitHub

## ReFix v0.1

**Proyecto:** ReFix
**Metodología:** Scrum
**Modelo de desarrollo:** Git Flow simplificado
**Repositorio:** GitHub
**Tipo de proyecto:** Monorepo

---

# 1. Objetivo

Este documento establece cómo trabajará el equipo de ReFix con Git y GitHub.

El objetivo es:

* Evitar que los cambios de un integrante rompan el trabajo de los demás.
* Mantener un historial claro del proyecto.
* Trabajar simultáneamente en frontend, backend e inteligencia artificial.
* Revisar cambios antes de integrarlos.
* Poder regresar a una versión estable cuando sea necesario.
* Mantener información sensible fuera del repositorio.

Este documento debe ser utilizado por todos los integrantes del equipo.

---

# 2. Git vs GitHub

## Git

Git es el sistema de control de versiones utilizado para registrar cambios en el código.

Permite:

* Crear versiones.
* Crear ramas.
* Comparar cambios.
* Recuperar versiones anteriores.
* Trabajar en paralelo.

## GitHub

GitHub aloja el repositorio Git en Internet y proporciona herramientas para colaboración.

Permite:

* Compartir el código.
* Pull Requests.
* Revisiones de código.
* Issues.
* Historial remoto.
* Integración con otras herramientas.

### Concepto importante

Git y GitHub no son lo mismo.

```text
Git
│
├── Control de versiones
├── Commits
├── Branches
└── Historial local

GitHub
│
├── Repositorio remoto
├── Pull Requests
├── Code Review
└── Colaboración
```

---

# 3. Arquitectura del repositorio

ReFix utiliza un único repositorio para todo el proyecto.

```text
ReFix/
│
├── apps/
│   ├── frontend/
│   ├── backend/
│   └── ai-service/
│
├── database/
├── infrastructure/
├── docs/
├── scripts/
├── .github/
├── .gitignore
├── docker-compose.yml
└── README.md
```

Este modelo se conoce como **monorepo**.

Todos los componentes del proyecto viven dentro del mismo repositorio.

---

# 4. Regla fundamental

El repositorio debe tener:

```text
ReFix/.git/
```

y NO:

```text
ReFix/apps/backend/.git/
ReFix/apps/frontend/.git/
ReFix/apps/ai-service/.git/
```

Debe existir un solo repositorio Git principal.

---

# 5. Ramas del proyecto

ReFix utiliza tres niveles principales:

```text
main
  │
  └── develop
        │
        ├── feature/backend
        ├── feature/frontend
        └── feature/ai
```

## main

Representa la versión estable del proyecto.

No se trabaja directamente sobre `main`.

---

## develop

Es la rama de integración.

Aquí llegan las funcionalidades terminadas después de revisión.

`develop` debe mantenerse en un estado funcional.

---

## feature/*

Son ramas de trabajo.

Cada integrante trabaja en una rama relacionada con su tarea.

Ejemplos:

```text
feature/backend
feature/frontend
feature/ai
```

Para tareas específicas:

```text
feature/auth
feature/users
feature/service-requests
feature/login-screen
feature/diagnosis-model
```

El nombre debe describir claramente el trabajo.

---

# 6. ¿Qué rama debo utilizar?

## Para trabajar

Utiliza una rama `feature/*`.

```text
feature/backend
```

## Para integrar funcionalidades

Se utiliza:

```text
develop
```

## Para una versión estable

Se utiliza:

```text
main
```

Nunca trabajar directamente sobre `main`.

---

# 7. El ciclo de trabajo de Git

Git puede entenderse mediante cuatro estados principales:

```text
Working Directory
       │
       │ git add
       ▼
Staging Area
       │
       │ git commit
       ▼
Local Repository
       │
       │ git push
       ▼
Remote Repository
     (GitHub)
```

## Working Directory

Es el estado normal de los archivos mientras trabajamos.

Aquí editamos código.

---

## Staging Area

Es la zona donde seleccionamos qué cambios formarán parte del siguiente commit.

Se utiliza:

```bash
git add
```

---

## Local Repository

Es el historial Git guardado en nuestra computadora.

Se crea mediante:

```bash
git commit
```

---

## Remote Repository

Es el repositorio alojado en GitHub.

Se sincroniza mediante:

```bash
git push
```

y:

```bash
git pull
```

---

# 8. Comandos fundamentales

## Ver estado

```bash
git status
```

Debe utilizarse frecuentemente.

Permite saber:

* Rama actual.
* Archivos modificados.
* Archivos nuevos.
* Cambios preparados.
* Cambios sin preparar.

---

## Ver ramas

```bash
git branch
```

El símbolo `*` indica la rama actual.

Ejemplo:

```text
  develop
* feature/backend
  main
```

---

## Crear una rama

Recomendado:

```bash
git switch -c feature/nombre
```

Ejemplo:

```bash
git switch -c feature/auth
```

---

## Cambiar de rama

```bash
git switch develop
```

Ejemplo:

```bash
git switch feature/backend
```

También existe:

```bash
git checkout
```

pero `git switch` es más claro para operaciones relacionadas con ramas.

---

# 9. Actualizar el proyecto

Antes de comenzar una tarea nueva:

```bash
git switch develop
git pull
```

Esto permite comenzar desde la versión más reciente de `develop`.

Después se crea la rama:

```bash
git switch -c feature/nombre
```

---

# 10. Revisar cambios

Antes de preparar un commit:

```bash
git status
```

También se puede revisar exactamente qué cambió:

```bash
git diff
```

Esto ayuda a detectar:

* Cambios accidentales.
* Archivos modificados incorrectamente.
* Código temporal.
* Información sensible.

---

# 11. Preparar cambios

Para preparar todos los cambios:

```bash
git add .
```

También se puede preparar un archivo específico:

```bash
git add src/main.ts
```

Después verificar:

```bash
git status
```

---

# 12. Crear un commit

Un commit representa una versión del trabajo.

Ejemplo:

```bash
git commit -m "feat: add authentication module"
```

Los commits deben representar cambios concretos.

Evitar mensajes como:

```text
cambios
cosas
avance
final
ya quedó
prueba
```

Preferir:

```text
feat: add user registration
fix: validate service request status
docs: update installation guide
test: add authentication tests
refactor: simplify user service
```

---

# 13. Convención de commits

ReFix utilizará una convención inspirada en Conventional Commits.

## feat

Nueva funcionalidad.

```text
feat: add technician registration
```

## fix

Corrección de errores.

```text
fix: prevent duplicate service requests
```

## refactor

Cambio interno sin modificar el comportamiento esperado.

```text
refactor: simplify authentication service
```

## test

Pruebas.

```text
test: add user service tests
```

## docs

Documentación.

```text
docs: update backend setup
```

## chore

Configuración o mantenimiento.

```text
chore: configure docker environment
```

---

# 14. Subir cambios a GitHub

Primera vez que se sube una rama:

```bash
git push -u origin feature/nombre
```

Ejemplo:

```bash
git push -u origin feature/backend
```

Después:

```bash
git push
```

---

# 15. ¿Qué es origin?

`origin` es el nombre que Git utiliza normalmente para identificar el repositorio remoto.

Ejemplo:

```bash
git remote -v
```

Puede mostrar:

```text
origin  https://github.com/Kvaio/ReFix.git
```

Conceptualmente:

```text
origin = repositorio ReFix en GitHub
```

---

# 16. Pull

Para traer cambios del repositorio remoto:

```bash
git pull
```

Ejemplo:

```bash
git switch develop
git pull
```

Esto actualiza la rama local con los cambios disponibles en GitHub.

---

# 17. Fetch

También existe:

```bash
git fetch
```

La diferencia básica:

```text
git fetch
    ↓
Descarga información del remoto
pero no integra automáticamente los cambios.

git pull
    ↓
Descarga información
y actualiza la rama actual.
```

Para el flujo diario del equipo normalmente utilizaremos `git pull`.

---

# 18. Pull Request

Un Pull Request permite solicitar que una rama sea integrada a otra.

Ejemplo:

```text
feature/backend
       │
       │ Pull Request
       ▼
    develop
```

El Pull Request debe utilizarse para revisar:

* Código.
* Errores.
* Arquitectura.
* Convenciones.
* Seguridad.
* Pruebas.

No se debe integrar código que no haya sido revisado cuando la tarea lo requiera.

---

# 19. Flujo de trabajo de ReFix

El flujo normal será:

```text
1. Actualizar develop
          ↓
2. Crear feature/*
          ↓
3. Programar
          ↓
4. Probar
          ↓
5. Revisar git status
          ↓
6. Revisar git diff
          ↓
7. git add
          ↓
8. git commit
          ↓
9. git push
          ↓
10. Pull Request
          ↓
11. Code Review
          ↓
12. Merge → develop
```

---

# 20. Flujo diario rápido

Cuando un integrante empieza a trabajar:

```bash
git switch develop
git pull
git switch -c feature/nombre
```

Trabaja normalmente.

Cuando termina:

```bash
git status
git diff
git add .
git status
git commit -m "tipo: descripción"
git push -u origin feature/nombre
```

Después crea un Pull Request hacia:

```text
develop
```

---

# 21. Antes de hacer commit

Siempre comprobar:

```bash
git status
```

y revisar:

```bash
git diff --cached
```

Este último comando permite revisar exactamente lo que está preparado para entrar en el commit.

Especialmente comprobar que NO aparezcan:

```text
.env
API keys
passwords
tokens
credentials
archivos temporales
node_modules/
dist/
```

---

# 22. Archivos sensibles

Nunca subir:

```text
.env
.env.local
.env.production
```

Ejemplo:

```text
.env              ❌
.env.example      ✅
```

`.env.example` debe mostrar únicamente qué variables necesita el proyecto.

Ejemplo:

```env
DATABASE_URL=
JWT_SECRET=
PORT=3000
```

Nunca colocar contraseñas reales en `.env.example`.

---

# 23. .gitignore

El archivo `.gitignore` define qué archivos no deben ser rastreados.

Ejemplo:

```gitignore
node_modules/
.env
.env.local
dist/
coverage/
```

Si un archivo está en `.gitignore`, Git normalmente no lo incluirá mediante:

```bash
git add .
```

---

# 24. ¿Qué hacer si cometí un error antes del commit?

Primero:

```bash
git status
```

Si solamente agregaste algo al staging por accidente:

```bash
git restore --staged archivo
```

Si modificaste un archivo y quieres descartar completamente esos cambios:

```bash
git restore archivo
```

Cuidado: este último puede eliminar cambios que todavía no estén guardados en un commit.

---

# 25. Historial

Para consultar el historial:

```bash
git log --oneline --graph --all
```

Ejemplo:

```text
* a82d901 feat: add authentication
* 52f1a43 feat: initialize backend
| * 9ad7321 feat: create frontend
|/
* 31c2a01 chore: initialize repository
```

Esto permite visualizar cómo evolucionó el proyecto.

---

# 26. Reglas del equipo

## Regla 1

No trabajar directamente sobre `main`.

## Regla 2

No subir secretos.

## Regla 3

No utilizar `git push --force` sin coordinación con el equipo.

## Regla 4

No hacer commits gigantes que mezclen funcionalidades diferentes.

## Regla 5

Los commits deben describir claramente lo realizado.

## Regla 6

Antes de un Pull Request, probar el código.

## Regla 7

Antes de comenzar una tarea, actualizar `develop`.

## Regla 8

Si aparece un conflicto, no borrar cambios de otro integrante sin revisar primero.

## Regla 9

No subir:

```text
node_modules/
dist/
.env
logs
archivos temporales
```

## Regla 10

Si algo no se entiende, consultar antes de ejecutar comandos destructivos.

---

# 27. Estructura de trabajo del equipo

Cada integrante tendrá responsabilidad principal sobre un área.

```text
Jonathan
└── Backend / Infraestructura

Jacqueline
└── Frontend / UX

Carlos
└── AI / Integración
```

Esto no significa que nadie pueda modificar otra área.

Significa que cada integrante debe procurar coordinar cambios que afecten el trabajo de otra persona.

---

# 28. Ejemplo completo

Supongamos que Carlos necesita desarrollar el diagnóstico mediante IA.

Primero:

```bash
git switch develop
git pull
```

Después:

```bash
git switch -c feature/ai-diagnosis
```

Trabaja.

Cuando termina:

```bash
git status
git diff
git add .
git diff --cached
git commit -m "feat: add initial diagnosis service"
git push -u origin feature/ai-diagnosis
```

Después abre un Pull Request:

```text
feature/ai-diagnosis
        ↓
     develop
```

El equipo revisa.

Si está correcto:

```text
MERGE
```

Ahora `develop` contiene esa funcionalidad.

---

# 29. Definición de "terminado"

Una tarea no se considera terminada solamente porque el código funciona en la computadora del desarrollador.

Para ReFix:

```text
Código implementado
        +
Pruebas realizadas
        +
Sin secretos
        +
Sin errores conocidos
        +
Commit correcto
        +
Push realizado
        +
Pull Request
        +
Revisión
        +
Merge
        =
DONE
```

---

# 30. Comandos de emergencia

Si algo sale mal, primero NO entrar en pánico.

Ejecutar:

```bash
git status
```

Después revisar:

```bash
git log --oneline --graph --all
```

Y antes de utilizar comandos destructivos como:

```bash
git reset --hard
git clean -fd
git push --force
```

consultar con el equipo.

Estos comandos pueden eliminar trabajo.

---

# 31. Chuleta rápida

## Empezar tarea

```bash
git switch develop
git pull
git switch -c feature/nombre
```

## Ver estado

```bash
git status
```

## Ver cambios

```bash
git diff
```

## Preparar

```bash
git add .
```

## Revisar staging

```bash
git diff --cached
```

## Guardar versión

```bash
git commit -m "tipo: descripción"
```

## Subir

```bash
git push -u origin feature/nombre
```

## Actualizar

```bash
git pull
```

## Ver ramas

```bash
git branch
```

## Cambiar rama

```bash
git switch nombre
```

## Ver historial

```bash
git log --oneline --graph --all
```

---

# 32. El flujo que todos deben memorizar

```text
              ┌─────────────┐
              │   develop   │
              └──────┬──────┘
                     │
                  git pull
                     │
                     ▼
             crear feature/*
                     │
                     ▼
                  TRABAJAR
                     │
                     ▼
                git status
                     │
                     ▼
                 git diff
                     │
                     ▼
                 git add .
                     │
                     ▼
               git commit
                     │
                     ▼
                 git push
                     │
                     ▼
              Pull Request
                     │
                     ▼
                 REVISIÓN
                     │
                     ▼
                   MERGE
                     │
                     ▼
                 develop
```

Este es el flujo estándar de trabajo del equipo ReFix.

---

# 33. Regla de oro

Antes de ejecutar cualquier comando Git que no conozcas:

```bash
git status
```

Primero entiende:

```text
¿Dónde estoy?
¿Qué rama estoy usando?
¿Qué cambió?
¿Qué quiero guardar?
¿A dónde quiero mandar esos cambios?
```

Después ejecuta el comando.

Git deja de ser una colección de comandos cuando entiendes **qué estado tiene el proyecto y hacia dónde quieres moverlo**.
