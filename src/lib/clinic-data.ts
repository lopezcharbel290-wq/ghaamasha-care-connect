export type SedeId = "tlalnepantla" | "lindavista";

export type Sede = {
  id: SedeId;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  telefonoLink: string;
  whatsapp: string | null;
  mapsEmbed: string;
  mapsLink: string;
  horario: string;
};

export const SEDES: Record<SedeId, Sede> = {
  tlalnepantla: {
    id: "tlalnepantla",
    nombre: "Tlalnepantla",
    direccion: "Circuito Viveros Sur No. 26, Unidad Adolfo López Mateos, 54070",
    ciudad: "Tlalnepantla de Baz, Estado de México",
    telefono: "55 63 63 05 25",
    telefonoLink: "+525563630525",
    whatsapp: "525563630525",
    mapsEmbed:
      "https://www.google.com/maps?q=Circuito+Viveros+Sur+26,+Unidad+Adolfo+Lopez+Mateos,+54070+Tlalnepantla+de+Baz&output=embed",
    mapsLink:
      "https://www.google.com/maps/dir/?api=1&destination=Circuito+Viveros+Sur+26,+Unidad+Adolfo+Lopez+Mateos,+54070+Tlalnepantla+de+Baz",
    horario: "Lunes a viernes 9:00–20:00 · Sábado 9:00–14:00",
  },
  lindavista: {
    id: "lindavista",
    nombre: "Lindavista",
    direccion: "Calle Lindavista No. 251, Col. Lindavista",
    ciudad: "Gustavo A. Madero, Ciudad de México",
    telefono: "55 53 93 44 36",
    telefonoLink: "+525553934436",
    whatsapp: "525553934436",
    mapsEmbed:
      "https://www.google.com/maps?q=Calle+Lindavista+251,+Col.+Lindavista,+Gustavo+A.+Madero,+CDMX&output=embed",
    mapsLink:
      "https://www.google.com/maps/dir/?api=1&destination=Calle+Lindavista+251,+Col.+Lindavista,+Gustavo+A.+Madero,+CDMX",
    horario: "Lunes a viernes 9:00–20:00 · Sábado 9:00–14:00",
  },
};

export const SEDE_LIST = [SEDES.tlalnepantla, SEDES.lindavista];

export const CONTACTO = {
  email: "contacto@ghaamasha.com.mx",
  marca: "GHAAMASHA",
  claim: "Rehabilitación física, ortopedia y neurología con trato humano.",
};

export function waLink(sede: Sede, mensaje: string) {
  const numero = sede.whatsapp ?? SEDES.tlalnepantla.whatsapp!;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export const MENSAJE_WA_DEFAULT =
  "Hola GHAAMASHA, quiero información para agendar una valoración de rehabilitación.";

export type CategoriaPadecimiento = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: "bone" | "brain" | "baby";
  padecimientos: string[];
};

export const CATEGORIAS: CategoriaPadecimiento[] = [
  {
    id: "ortopedia",
    titulo: "Ortopedia y Columna",
    descripcion: "Dolor articular, lesiones deportivas y recuperación post-quirúrgica.",
    icono: "bone",
    padecimientos: [
      "Dolor lumbar",
      "Dolor cervical",
      "Hombro doloroso",
      "Dolor de rodilla",
      "Tendón de Aquiles",
      "Esguinces",
      "Osteoartrosis",
      "Fracturas",
      "Luxaciones",
    ],
  },
  {
    id: "neurologia",
    titulo: "Neurología",
    descripcion: "Recuperación funcional después de un daño neurológico.",
    icono: "brain",
    padecimientos: [
      "Parálisis facial",
      "Evento cerebrovascular (EVC)",
      "Enfermedad de Parkinson",
      "Esclerosis lateral amiotrófica (ELA)",
      "Enfermedades neurodegenerativas",
      "Traumatismo craneoencefálico",
    ],
  },
  {
    id: "pediatrica",
    titulo: "Pediátrica y Especiales",
    descripcion: "Programas para niñas, niños y pacientes con necesidades específicas.",
    icono: "baby",
    padecimientos: [
      "Estimulación temprana",
      "Hemiparesia",
      "Parálisis cerebral",
      "Rehabilitación pulmonar",
      "Rehabilitación oncológica",
    ],
  },
];

export const TODOS_LOS_PADECIMIENTOS = CATEGORIAS.flatMap((c) =>
  c.padecimientos.map((p) => ({ padecimiento: p, categoria: c.titulo, categoriaId: c.id })),
);

export type Servicio = {
  slug: string;
  nombre: string;
  descripcion: string;
  detalle: string;
  icono:
    | "dumbbell"
    | "activity"
    | "syringe"
    | "droplet"
    | "waves"
    | "wind"
    | "hand"
    | "baby"
    | "ribbon";
};

export const SERVICIOS: Servicio[] = [
  {
    slug: "mecanoterapia",
    nombre: "Mecanoterapia",
    descripcion: "Equipo especializado para recuperar fuerza y movimiento.",
    detalle:
      "Programas guiados con aparatos de resistencia progresiva para devolver fuerza, rango de movimiento y control muscular después de una lesión o cirugía.",
    icono: "dumbbell",
  },
  {
    slug: "electrodiagnostico",
    nombre: "Electrodiagnóstico",
    descripcion: "Estudios de nervio y músculo para un diagnóstico preciso.",
    detalle:
      "Electromiografía y velocidades de conducción nerviosa que permiten confirmar el origen del dolor, el hormigueo o la debilidad antes de iniciar el tratamiento.",
    icono: "activity",
  },
  {
    slug: "toxina-incobotulinica",
    nombre: "Toxina Incobotulínica",
    descripcion: "Manejo de espasticidad y dolor muscular focalizado.",
    detalle:
      "Aplicación médica dirigida para relajar músculos con espasticidad, mejorar la postura y facilitar la terapia física en pacientes neurológicos.",
    icono: "syringe",
  },
  {
    slug: "viscosuplementacion",
    nombre: "Viscosuplementación",
    descripcion: "Lubricación articular para artrosis de rodilla y hombro.",
    detalle:
      "Infiltración de ácido hialurónico que mejora la lubricación de la articulación, reduce el dolor y retrasa el desgaste en osteoartrosis.",
    icono: "droplet",
  },
  {
    slug: "hidroterapia",
    nombre: "Hidroterapia en tina de remolino",
    descripcion: "Tina de remolino vertical para dolor y circulación.",
    detalle:
      "Terapia con agua a temperatura controlada y remolino vertical: relaja la musculatura, mejora la circulación y facilita el movimiento sin carga.",
    icono: "waves",
  },
  {
    slug: "rehabilitacion-pulmonar",
    nombre: "Rehabilitación Pulmonar",
    descripcion: "Entrenamiento respiratorio y tolerancia al esfuerzo.",
    detalle:
      "Ejercicio respiratorio, higiene bronquial y acondicionamiento para pacientes con EPOC, secuelas de neumonía o post-COVID.",
    icono: "wind",
  },
  {
    slug: "terapia-ocupacional",
    nombre: "Terapia Ocupacional",
    descripcion: "Recuperar independencia en las actividades del día.",
    detalle:
      "Entrenamiento de mano, coordinación fina y actividades de la vida diaria para volver a vestirse, escribir, cocinar o trabajar con autonomía.",
    icono: "hand",
  },
  {
    slug: "rehabilitacion-pediatrica",
    nombre: "Rehabilitación Pediátrica",
    descripcion: "Estimulación y terapia para niñas y niños.",
    detalle:
      "Estimulación temprana, neurodesarrollo y terapia lúdica con acompañamiento a la familia en cada etapa del tratamiento.",
    icono: "baby",
  },
  {
    slug: "rehabilitacion-oncologica",
    nombre: "Rehabilitación Oncológica",
    descripcion: "Fuerza, movilidad y linfedema durante y después del tratamiento.",
    detalle:
      "Programas suaves y supervisados para fatiga, pérdida de fuerza, movilidad de hombro y manejo de linfedema en pacientes oncológicos.",
    icono: "ribbon",
  },
];

export const TESTIMONIOS = [
  {
    nombre: "María Elena R.",
    padecimiento: "Dolor lumbar crónico",
    cita: "Llegué sin poder agacharme. En seis semanas volví a caminar mi rutina completa y el equipo me explicó cada paso.",
    inicial: "M",
  },
  {
    nombre: "Jorge A.",
    padecimiento: "Post-operatorio de rodilla",
    cita: "Me dieron un plan claro y realista. Nunca sentí que fuera una consulta de fábrica, siempre me recordaban mi avance.",
    inicial: "J",
  },
  {
    nombre: "Fam. Hernández",
    padecimiento: "Estimulación temprana",
    cita: "El trato con mi hija fue paciente y cariñoso. Vimos cambios en su desarrollo desde el primer mes.",
    inicial: "H",
  },
  {
    nombre: "Rosa M.",
    padecimiento: "Secuelas de EVC",
    cita: "Recuperé movimiento en el brazo que ya daba por perdido. El seguimiento del doctor hizo la diferencia.",
    inicial: "R",
  },
  {
    nombre: "Luis G.",
    padecimiento: "Parálisis facial",
    cita: "Empecé la terapia a tiempo gracias a que me atendieron en la misma semana que llamé.",
    inicial: "L",
  },
];

export const PROMOCIONES = [
  {
    titulo: "Valoración médica inicial",
    precio: "$450",
    antes: "$700",
    descripcion:
      "Consulta con médico especialista en rehabilitación, diagnóstico funcional y plan de tratamiento por escrito.",
    vigencia: "Vigente este mes en ambas sedes",
    destacado: true,
  },
  {
    titulo: "Paquete 10 sesiones de terapia física",
    precio: "$2,700",
    antes: "$3,500",
    descripcion:
      "Diez sesiones de terapia con mecanoterapia, electroterapia y seguimiento del avance en cada visita.",
    vigencia: "Sesiones válidas por 3 meses",
    destacado: false,
  },
  {
    titulo: "Programa de estimulación temprana",
    precio: "$2,200",
    antes: "$2,800",
    descripcion:
      "Ocho sesiones pediátricas con reporte de avances y guía de ejercicios para casa.",
    vigencia: "Cupo limitado por semana",
    destacado: false,
  },
];

export const CONVENIOS = [
  { nombre: "Empresas y RH", detalle: "Atención a colaboradores por lesión laboral o ergonomía." },
  { nombre: "Aseguradoras", detalle: "Recepción de pacientes con póliza de gastos médicos mayores." },
  { nombre: "Escuelas y clubes deportivos", detalle: "Valoración y prevención de lesiones deportivas." },
  { nombre: "Médicos referentes", detalle: "Contrarreferencia clínica y reporte de evolución." },
];

export const BLOG_POSTS = [
  {
    slug: "dolor-lumbar-cuando-acudir",
    titulo: "Dolor lumbar: cuándo es momento de acudir con un especialista",
    resumen:
      "Señales de alarma, qué estudios sirven realmente y por qué el reposo prolongado suele empeorar el cuadro.",
    categoria: "Ortopedia y Columna",
    fecha: "12 de agosto, 2026",
    lectura: "5 min",
  },
  {
    slug: "rehabilitacion-despues-de-un-evc",
    titulo: "Rehabilitación después de un EVC: la ventana de los primeros 6 meses",
    resumen:
      "Cómo se organiza un plan neurológico por etapas y qué puede esperar la familia en cada una.",
    categoria: "Neurología",
    fecha: "29 de julio, 2026",
    lectura: "6 min",
  },
  {
    slug: "estimulacion-temprana-en-casa",
    titulo: "Estimulación temprana: 5 ejercicios seguros para hacer en casa",
    resumen:
      "Actividades sencillas por edad para acompañar el neurodesarrollo entre sesiones de terapia.",
    categoria: "Pediatría",
    fecha: "10 de julio, 2026",
    lectura: "4 min",
  },
  {
    slug: "artrosis-de-rodilla-opciones",
    titulo: "Artrosis de rodilla: opciones antes de pensar en cirugía",
    resumen:
      "Viscosuplementación, fortalecimiento y control de peso: qué evidencia hay detrás de cada opción.",
    categoria: "Ortopedia",
    fecha: "2 de julio, 2026",
    lectura: "5 min",
  },
];

export const PASOS_PRIMERA_CONSULTA = [
  {
    titulo: "Trae tus estudios de imagen",
    detalle:
      "Radiografías, resonancias, tomografías y análisis previos, en placa o digital. Si no tienes estudios, no te preocupes: te indicamos los necesarios.",
  },
  {
    titulo: "Usa ropa cómoda",
    detalle:
      "Playera holgada, short o pantalón deportivo. Necesitamos explorar la zona afectada y observar tu movimiento.",
  },
  {
    titulo: "Aparta de 40 a 60 minutos",
    detalle:
      "La primera cita es más larga que una sesión de terapia porque incluye historia clínica y exploración completa.",
  },
  {
    titulo: "Sales con un plan claro",
    detalle:
      "Diagnóstico funcional, número estimado de sesiones, costos y objetivos de recuperación por escrito.",
  },
];
