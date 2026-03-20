# PawActivity

Base de arquitectura y producto para el proyecto web de PawActivity.

## Documentación principal

- [Arquitectura del proyecto](docs/architecture.md)
- [Propuesta técnica concreta del MVP](docs/mvp-technical-proposal.md)
- [Especificación técnica de implementación MVP](docs/mvp-implementation-spec.md)

## Resumen ejecutivo

PawActivity debe separarse en cuatro piezas claras:

1. **Marketing público** para captar y convertir.
2. **Plataforma privada** para que clientes consulten la actividad de sus perros.
3. **Backend/API** para autenticación, negocio y sincronización con la app móvil.
4. **Base de datos** optimizada para usuarios, mascotas, dispositivos y métricas históricas.

La recomendación para el MVP es una **arquitectura híbrida**:

- **WordPress solo para marketing**, si el hosting ya lo facilita y el equipo necesita editar contenido sin depender de desarrollo.
- **Aplicación web privada y API custom** en un stack moderno separado.
- **Base de datos central única** para la plataforma y la sincronización.

Esto mantiene el sitio comercial simple de operar, pero evita forzar WordPress para lógica privada, dashboards y sincronización técnica.


## Próximo paso recomendado

Implementar primero la plataforma (`app` + `api`) y mantener WordPress desacoplado, conectado solo mediante enlaces y formularios de captación.
