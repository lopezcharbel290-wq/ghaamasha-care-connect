# Remix of Ghaamasha Care Connect

PROMPT

Nota para esta primera etapa: por ahora quiero que construyas únicamente el diseño y la experiencia de usuario (frontend) del sitio completo. El formulario de agendamiento debe funcionar visualmente y validar los campos, pero usa datos de ejemplo (mock) o simplemente muestra un mensaje de confirmación simulado al enviarlo — no conectes todavía ninguna base de datos ni Supabase. La integración con Supabase la pediré en un paso posterior, una vez que el diseño esté aprobado.

Quiero construir una plataforma web pública para GHAAMASHA, una clínica de Rehabilitación Física, Ortopedia, Neurología y Medicina Física con sede en dos ubicaciones: Tlalnepantla y Lindavista (CDMX). El sitio debe estar orientado a la conversión (agendar citas), optimizado para móviles, con un diseño clínico-cálido: confiable, profesional y humano, evitando la sensación "corporativa fría" de un hospital. Referencia de tono e identidad: paleta en tonos verde/teal institucional con blancos y grises neutros, tipografía limpia tipo sans-serif, tarjetas con bordes suaves y esquinas redondeadas, iconografía médica simple (no ilustraciones infantiles), fotografía real de instalaciones y equipo cuando sea posible.

1. Stack y base técnica

Frontend en React + Tailwind (estándar de Lovable).

Conexión a Supabase como backend para leads/pacientes.

Diseño 100% responsive, mobile-first (más del 60% del tráfico será desde celular, muchos usuarios llegarán desde WhatsApp o anuncios).

Rendimiento: imágenes optimizadas, carga rápida, botones de contacto siempre accesibles (sticky).

2. Header / Navbar

Logotipo de GHAAMASHA a la izquierda.

Menú de navegación: Inicio, Nosotros, Servicios, Padecimientos, Promociones, Blog, Convenios, Contacto.

Selector directo de sede (Tlalnepantla / Lindavista) visible en el navbar — un dropdown o toggle que idealmente personalice el número de WhatsApp y dirección mostrados en el resto del sitio según la sede elegida.

Botón persistente "Agendar Cita", destacado con color de acento, visible en desktop y como botón flotante/sticky en móvil.

Barra secundaria opcional con teléfono y WhatsApp de contacto directo.

3. Hero Section

Titular con propuesta de valor clara sobre rehabilitación y recuperación (ej. tono: "libre de lesiones y dolor", cercano y esperanzador, no clínico-frío).

Subtítulo con la propuesta de servicio: médicos especialistas, equipo adecuado, plan de rehabilitación personalizado, dos sucursales.

Presentación breve del Dr. Ricardo Emilio Aguilar Pineda (Médico Cirujano, Especialidad en Medicina de Rehabilitación) como representante médico y figura de autoridad/confianza — foto, nombre, cédula profesional, especialidad.

Dos CTAs: botón primario "Solicita una valoración" / "Agendar Cita" y botón secundario "Escríbenos por WhatsApp" (con mensaje prellenado).

Imagen de fondo o lateral de instalaciones/equipo real, no stock genérico.

4. Buscador / Filtro Interactivo de Padecimientos

Módulo visual tipo "explorador por categorías" (tarjetas o acordeón) que permita al usuario auto-diagnosticar hacia dónde ir. Tres categorías principales, cada una con lista de padecimientos clicables que llevan a una landing específica o a un formulario pre-llenado con ese padecimiento:

Ortopedia y Columna: dolor lumbar, dolor cervical, hombro, rodilla, tendón de Aquiles, esguinces, osteoartrosis, fracturas, luxaciones.

Neurología: parálisis facial, evento cerebrovascular (EVC), Parkinson, ELA, enfermedades neurodegenerativas, traumatismo craneoencefálico.

Pediátrica y Especiales: estimulación temprana, hemiparesia, parálisis cerebral, rehabilitación pulmonar, rehabilitación oncológica.

Cada tarjeta debe tener: ícono simple relacionado a la zona/categoría, nombre del padecimiento, y micro-CTA ("Ver tratamiento" o "Agendar valoración para esto"). Considera un buscador con texto libre arriba del módulo para quienes prefieren escribir su síntoma directamente.

5. Módulo "¿Qué esperar en tu primera consulta?"

Sección informativa pensada para reducir el ausentismo (no-show). Formato de checklist o pasos numerados, clara y breve:

Qué documentos o estudios de imagen llevar (radiografías, resonancias, análisis previos).

Recomendación de ropa cómoda para la valoración.

Duración aproximada de la primera cita.

Qué sucede en la valoración inicial (evaluación médica, plan de tratamiento). Cierra con un CTA suave hacia el formulario de agendamiento.

6. Selector Dinámico de Sedes

Dos tarjetas (una por sede) con:

Mapa interactivo embebido (Google Maps) de la ubicación.

Dirección completa.

Teléfono y botón directo de WhatsApp específico de esa sede.

Botón "Cómo llegar" y botón "Agendar cita en esta sede" (que preseleccione la sede en el formulario).

Datos reales a usar:

Tlalnepantla: Circuito Viveros Sur No. 26, Unidad Adolfo López Mateos, 54070, Tlalnepantla de Baz, Estado de México. Tel/WhatsApp: 55 63 63 05 25.

Lindavista: Calle Lindavista No. 251, Col. Lindavista, Gustavo A. Madero, CDMX. Tel: 55 53 93 44 36.

7. Testimonios y Galería de Tratamientos

Carrusel o grid de testimonios de pacientes (nombre, breve cita, padecimiento tratado — con foto genérica/avatar si no hay foto real, respetando privacidad).

Galería/mapeo visual de servicios con ícono + nombre + descripción corta de una línea, cada uno enlazando a su página de detalle:

Mecanoterapia

Electrodiagnóstico

Toxina Incobotulínica

Viscosuplementación

Hidroterapia en tina de remolino vertical

Rehabilitación Pulmonar

Terapia Ocupacional

Rehabilitación Pediátrica

Rehabilitación Oncológica

8. Formulario Público de Agendamiento

Formulario simple, corto (máximo 5-6 campos para no perder conversión):

Nombre completo

Teléfono (con formato/validación de celular mexicano)

Sede de preferencia (Tlalnepantla / Lindavista) — preseleccionada si el usuario venía de una tarjeta de sede o padecimiento

Padecimiento principal (texto libre o selector con las categorías del módulo de búsqueda)

Fecha solicitada (date picker)

Campo opcional de comentarios

Al enviar: mensaje de confirmación claro ("Te contactaremos en breve") y opción de continuar la conversación por WhatsApp inmediatamente después de enviar el formulario.

9. Integración con Supabase (NO implementar todavía — solo referencia para la siguiente fase)

Esta sección es para tu contexto y para dejar el formulario ya preparado con los campos correctos. Por ahora, al enviar el formulario, simplemente muestra el mensaje de confirmación simulado descrito en la sección 8. La conexión real se pedirá en un mensaje aparte una vez aprobado el diseño.

Al enviar el formulario, crear automáticamente un registro en la tabla pacientes con los campos capturados.

Estado inicial del registro: Prospecto o Cita Solicitada (según corresponda si el usuario ya propuso fecha específica).

Incluir timestamp de creación y, si es posible, el origen del lead (ej. qué padecimiento/tarjeta lo trajo, o si vino del CTA del hero vs. del módulo de sedes) para poder medir qué secciones convierten mejor.

Estructura sugerida de la tabla pacientes (ajustar si ya existe una definida): nombre, telefono, sede, padecimiento_principal, fecha_solicitada, estado, origen_lead, comentarios, created_at.

10. Footer

Logotipo y una línea de misión/propuesta de valor.

Teléfonos y correo de contacto.

Direcciones de ambas sucursales.

Enlaces de navegación duplicados.

Aviso de privacidad (mencionar que los datos capturados se usan únicamente para contacto y seguimiento médico, no se comparten con terceros).

Botones flotantes persistentes de "Llamar", "WhatsApp" y "Agendar" visibles en todo momento, especialmente en móvil.

11. Consideraciones generales de diseño

Priorizar claridad sobre densidad: cada sección debe responder una pregunta del usuario (¿me pueden ayudar con mi dolor? ¿dónde están? ¿qué necesito llevar? ¿cómo agendo?).

Usar jerarquía visual fuerte: un CTA principal por sección, nunca competir con múltiples botones del mismo peso visual.

Mantener consistencia de marca entre esta plataforma nueva y el sitio actual (ghaamasha.com.mx), reutilizando tono de voz cercano y profesional, y los mismos datos de contacto/sedes/servicios ya existentes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ghaamasha-care-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ae70e665-6a7d-409d-8563-10e45c662b1b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
