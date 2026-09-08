import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Panel interno GHAAMASHA.
 * Reutiliza la MISMA base de datos externa que el formulario público,
 * pero aquí el acceso va siempre con el token del usuario autenticado
 * (Supabase Auth + RLS). La service role key solo se usa para el alta de
 * personal (crear el usuario en Auth), nunca se expone al navegador.
 */
const SUPABASE_URL = "https://tzbwmunvlmdfutjxvgqi.supabase.co";

function anonKey(): string {
  const k = process.env["CLINIC_SUPABASE_ANON_KEY"];
  if (!k) throw new Error("Falta la clave pública de la clínica");
  return k;
}

function serviceKey(): string {
  const k = process.env["CLINIC_SUPABASE_SERVICE_ROLE_KEY"];
  if (!k) throw new Error("Falta la clave del servidor de la clínica");
  return k;
}

export const SESION_EXPIRADA = "SESION_EXPIRADA";

async function rest<T>(
  token: string,
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<T> {
  const { prefer, ...rest } = init;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: anonKey(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...(rest.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error(SESION_EXPIRADA);
  if (!res.ok) {
    const body = await res.text();
    console.error(`Panel REST ${res.status} en ${path}: ${body}`);
    if (res.status === 403 || body.includes("row-level security")) {
      throw new Error("No tienes permisos para realizar esta acción");
    }
    throw new Error("No se pudo completar la operación en la base de datos");
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function admin<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Panel admin ${res.status} en ${path}: ${text}`);
    throw new Error(
      text.includes("already been registered")
        ? "Ese correo ya está registrado"
        : "No se pudo completar la operación de administración",
    );
  }
  return (text ? JSON.parse(text) : null) as T;
}

export type Rol = "admin" | "recepcion" | "doctor";

export type Perfil = {
  id: string;
  nombre_completo: string;
  rol: Rol;
  sede_id: string | null;
};

export type SesionPanel = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  perfil: Perfil;
};

async function tokenRequest(grant: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: "POST",
    headers: { apikey: anonKey(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string };
    error_description?: string;
  };
  if (!res.ok || !data.access_token || !data.user) {
    throw new Error(
      grant === "password"
        ? "Correo o contraseña incorrectos"
        : SESION_EXPIRADA,
    );
  }
  return data as Required<Pick<typeof data, "access_token" | "refresh_token" | "expires_in" | "user">>;
}

async function armarSesion(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string };
}): Promise<SesionPanel> {
  const perfiles = await rest<Perfil[]>(
    data.access_token,
    `usuarios_sistema?id=eq.${data.user.id}&select=id,nombre_completo,rol,sede_id&limit=1`,
  );
  const perfil = perfiles[0];
  if (!perfil) {
    throw new Error("Tu cuenta no está dada de alta como personal de la clínica");
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    perfil,
  };
}

export const iniciarSesionPanel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ email: z.string().trim().email(), password: z.string().min(6) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const res = await tokenRequest("password", {
      email: data.email,
      password: data.password,
    });
    return armarSesion(res);
  });

export const refrescarSesionPanel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ refresh_token: z.string().min(10) }).parse(input),
  )
  .handler(async ({ data }) => {
    const res = await tokenRequest("refresh_token", {
      refresh_token: data.refresh_token,
    });
    return armarSesion(res);
  });

/* ------------------------------- Catálogos ------------------------------- */

const soloToken = (input: unknown) =>
  z.object({ token: z.string().min(10) }).parse(input);

export type Sede = { id: string; nombre: string; direccion: string | null; telefono: string | null };

export const listarSedes = createServerFn({ method: "POST" })
  .inputValidator(soloToken)
  .handler(({ data }) =>
    rest<Sede[]>(data.token, "sedes?select=id,nombre,direccion,telefono&order=nombre"),
  );

export type Staff = {
  id: string;
  nombre_completo: string;
  rol: Rol;
  sede_id: string | null;
  creado_el: string;
};

export const listarStaff = createServerFn({ method: "POST" })
  .inputValidator(soloToken)
  .handler(({ data }) =>
    rest<Staff[]>(
      data.token,
      "usuarios_sistema?select=id,nombre_completo,rol,sede_id,creado_el&order=nombre_completo",
    ),
  );

/* --------------------------------- Citas --------------------------------- */

export type Cita = {
  id: string;
  paciente_id: string;
  sede_id: string;
  profesional_id: string | null;
  fecha_hora: string;
  numero_sesion: string;
  estado: "confirmada" | "asistio" | "no_asistio" | "cancelada";
  notas_sesion: string | null;
  creado_el: string;
  pacientes: { id: string; nombre_completo: string; telefono: string | null } | null;
  sedes: { id: string; nombre: string } | null;
};

const CITA_SELECT =
  "id,paciente_id,sede_id,profesional_id,fecha_hora,numero_sesion,estado,notas_sesion,creado_el,pacientes(id,nombre_completo,telefono),sedes(id,nombre)";

export const listarCitas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        desde: z.string(),
        hasta: z.string(),
        sedeId: z.string().uuid().optional(),
        profesionalId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const filtros = [
      `fecha_hora=gte.${encodeURIComponent(data.desde)}`,
      `fecha_hora=lte.${encodeURIComponent(data.hasta)}`,
      data.sedeId ? `sede_id=eq.${data.sedeId}` : null,
      data.profesionalId ? `profesional_id=eq.${data.profesionalId}` : null,
    ].filter(Boolean);
    return rest<Cita[]>(
      data.token,
      `citas_sesiones?select=${CITA_SELECT}&${filtros.join("&")}&order=fecha_hora`,
    );
  });

async function hayTraslape(
  token: string,
  profesionalId: string,
  fechaHora: string,
  excluirId?: string,
): Promise<boolean> {
  const base = new Date(fechaHora).getTime();
  const desde = new Date(base - 50 * 60 * 1000).toISOString();
  const hasta = new Date(base + 50 * 60 * 1000).toISOString();
  const existentes = await rest<{ id: string }[]>(
    token,
    `citas_sesiones?select=id&profesional_id=eq.${profesionalId}&estado=in.(confirmada,asistio)&fecha_hora=gte.${encodeURIComponent(desde)}&fecha_hora=lte.${encodeURIComponent(hasta)}`,
  );
  return existentes.some((c) => c.id !== excluirId);
}

const estadoCita = z.enum(["confirmada", "asistio", "no_asistio", "cancelada"]);

export const crearCita = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        paciente_id: z.string().uuid(),
        sede_id: z.string().uuid(),
        profesional_id: z.string().uuid().nullable().optional(),
        fecha_hora: z.string().min(10),
        numero_sesion: z.string().trim().min(1).max(50).default("1ª Consulta"),
        notas_sesion: z.string().trim().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { token, ...cita } = data;
    if (cita.profesional_id && (await hayTraslape(token, cita.profesional_id, cita.fecha_hora))) {
      throw new Error("Ese terapeuta ya tiene una cita en ese horario");
    }
    const creada = await rest<Cita[]>(token, "citas_sesiones", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({ ...cita, estado: "confirmada" }),
    });
    return creada[0]!;
  });

export const actualizarCita = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        id: z.string().uuid(),
        fecha_hora: z.string().min(10).optional(),
        profesional_id: z.string().uuid().nullable().optional(),
        estado: estadoCita.optional(),
        numero_sesion: z.string().trim().min(1).max(50).optional(),
        notas_sesion: z.string().trim().max(2000).optional(),
        sede_id: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { token, id, ...cambios } = data;
    if (cambios.profesional_id && cambios.fecha_hora) {
      if (await hayTraslape(token, cambios.profesional_id, cambios.fecha_hora, id)) {
        throw new Error("Ese terapeuta ya tiene una cita en ese horario");
      }
    }
    await rest(token, `citas_sesiones?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify(cambios),
    });
    return { ok: true as const };
  });

/* ------------------------------- Pacientes ------------------------------- */

export const ESTADOS_JOURNEY = [
  "prospecto",
  "cita_agendada",
  "en_tratamiento",
  "en_riesgo",
  "alta",
] as const;
export const ORIGENES = [
  "google",
  "facebook",
  "whatsapp",
  "recomendacion",
  "otro",
  "web",
] as const;

export const MARCA_ARCHIVADO = "[ARCHIVADO]";

export type Paciente = {
  id: string;
  id_paciente_folio: number | null;
  nombre_completo: string;
  telefono: string | null;
  correo: string | null;
  origen: (typeof ORIGENES)[number] | null;
  municipio_zona: string | null;
  notas: string | null;
  estado_journey: (typeof ESTADOS_JOURNEY)[number];
  acepto_aviso_privacidad: boolean | null;
  creado_el: string;
};

const PACIENTE_SELECT =
  "id,id_paciente_folio,nombre_completo,telefono,correo,origen,municipio_zona,notas,estado_journey,acepto_aviso_privacidad,creado_el";

export const listarPacientes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        q: z.string().trim().max(80).optional(),
        estado: z.enum(ESTADOS_JOURNEY).optional(),
        origen: z.enum(ORIGENES).optional(),
        incluirArchivados: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const filtros: string[] = [];
    if (data.q) {
      const q = encodeURIComponent(`*${data.q}*`);
      const folio = /^\d+$/.test(data.q) ? `,id_paciente_folio.eq.${data.q}` : "";
      filtros.push(`or=(nombre_completo.ilike.${q},telefono.ilike.${q}${folio})`);
    }
    if (data.estado) filtros.push(`estado_journey=eq.${data.estado}`);
    if (data.origen) filtros.push(`origen=eq.${data.origen}`);
    const pacientes = await rest<Paciente[]>(
      data.token,
      `pacientes?select=${PACIENTE_SELECT}&${filtros.join("&")}&order=creado_el.desc&limit=300`,
    );
    return data.incluirArchivados
      ? pacientes
      : pacientes.filter((p) => !(p.notas ?? "").includes(MARCA_ARCHIVADO));
  });

export type Seguimiento = {
  id: string;
  paciente_id: string;
  encargado_id: string | null;
  fecha_contacto: string;
  canal: string | null;
  respuesta_paciente: string | null;
};

export const detallePaciente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().min(10), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const [pacientes, citas, historial] = await Promise.all([
      rest<Paciente[]>(data.token, `pacientes?id=eq.${data.id}&select=${PACIENTE_SELECT}&limit=1`),
      rest<Cita[]>(
        data.token,
        `citas_sesiones?paciente_id=eq.${data.id}&select=${CITA_SELECT}&order=fecha_hora.desc`,
      ),
      rest<Seguimiento[]>(
        data.token,
        `historial_seguimiento?paciente_id=eq.${data.id}&select=id,paciente_id,encargado_id,fecha_contacto,canal,respuesta_paciente&order=fecha_contacto.desc`,
      ).catch(() => [] as Seguimiento[]),
    ]);
    const paciente = pacientes[0];
    if (!paciente) throw new Error("Paciente no encontrado");
    return { paciente, citas, historial };
  });

const pacienteCampos = z.object({
  nombre_completo: z.string().trim().min(3).max(150),
  telefono: z.string().trim().min(10).max(20),
  correo: z.string().trim().email().or(z.literal("")).optional(),
  origen: z.enum(ORIGENES),
  municipio_zona: z.string().trim().max(120).optional(),
  notas: z.string().trim().max(2000).optional(),
  estado_journey: z.enum(ESTADOS_JOURNEY),
  acepto_aviso_privacidad: z.boolean(),
});

export const crearPaciente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    pacienteCampos.extend({ token: z.string().min(10) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { token, correo, ...campos } = data;
    const creado = await rest<Paciente[]>(token, "pacientes", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({ ...campos, correo: correo || null }),
    });
    return creado[0]!;
  });

export const actualizarPaciente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    pacienteCampos
      .partial()
      .extend({ token: z.string().min(10), id: z.string().uuid() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { token, id, correo, ...campos } = data;
    await rest(token, `pacientes?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...campos,
        ...(correo !== undefined ? { correo: correo || null } : {}),
      }),
    });
    return { ok: true as const };
  });

export const registrarSeguimiento = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        paciente_id: z.string().uuid(),
        canal: z.string().trim().max(40).default("whatsapp"),
        respuesta_paciente: z.string().trim().max(1000).optional(),
        encargado_id: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { token, ...fila } = data;
    await rest(token, "historial_seguimiento", {
      method: "POST",
      body: JSON.stringify({ ...fila, fecha_contacto: new Date().toISOString() }),
    });
    return { ok: true as const };
  });

/* --------------------------------- Staff --------------------------------- */

async function exigirAdmin(token: string) {
  const { user } = await (async () => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: anonKey(), Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(SESION_EXPIRADA);
    return { user: (await res.json()) as { id: string } };
  })();
  const perfiles = await rest<{ rol: Rol }[]>(
    token,
    `usuarios_sistema?id=eq.${user.id}&select=rol&limit=1`,
  );
  if (perfiles[0]?.rol !== "admin") throw new Error("Solo un administrador puede hacer esto");
  return user.id;
}

export const crearStaff = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        email: z.string().trim().email(),
        password: z.string().min(8).max(72),
        nombre_completo: z.string().trim().min(3).max(150),
        rol: z.enum(["admin", "recepcion", "doctor"]),
        sede_id: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await exigirAdmin(data.token);
    const usuario = await admin<{ id: string }>("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        email_confirm: true,
      }),
    });
    try {
      await admin("/rest/v1/usuarios_sistema", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          id: usuario.id,
          nombre_completo: data.nombre_completo,
          rol: data.rol,
          sede_id: data.sede_id ?? null,
        }),
      });
    } catch (e) {
      await admin(`/auth/v1/admin/users/${usuario.id}`, { method: "DELETE" }).catch(() => {});
      throw e;
    }
    return { ok: true as const };
  });

export const desactivarStaff = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().min(10), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const yo = await exigirAdmin(data.token);
    if (yo === data.id) throw new Error("No puedes desactivar tu propia cuenta");
    await admin(`/auth/v1/admin/users/${data.id}`, { method: "DELETE" });
    return { ok: true as const };
  });

/** Alta del primer administrador. Solo funciona si aún no existe ninguno. */
export const crearPrimerAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email(),
        password: z.string().min(8).max(72),
        nombre_completo: z.string().trim().min(3).max(150),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const existentes = await admin<{ id: string }[]>(
      "/rest/v1/usuarios_sistema?select=id&rol=eq.admin&limit=1",
    );
    if (existentes.length > 0) {
      throw new Error("Ya existe un administrador; pide que te den de alta desde el panel");
    }
    const usuario = await admin<{ id: string }>("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password, email_confirm: true }),
    });
    await admin("/rest/v1/usuarios_sistema", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id: usuario.id,
        nombre_completo: data.nombre_completo,
        rol: "admin",
      }),
    });
    return { ok: true as const };
  });

/** ¿Ya hay algún administrador dado de alta? (para mostrar el alta inicial) */
export const existeAdmin = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const filas = await admin<{ id: string }[]>(
      "/rest/v1/usuarios_sistema?select=id&rol=eq.admin&limit=1",
    );
    return { existe: filas.length > 0 };
  } catch {
    return { existe: true };
  }
});

/* ------------------------------ Estadísticas ----------------------------- */

export const estadisticasPanel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(10),
        desde: z.string(),
        hasta: z.string(),
        sedeId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const filtros = [
      `fecha_hora=gte.${encodeURIComponent(data.desde)}`,
      `fecha_hora=lte.${encodeURIComponent(data.hasta)}`,
      data.sedeId ? `sede_id=eq.${data.sedeId}` : null,
    ].filter(Boolean);

    const [citas, pacientes, staff, sedes] = await Promise.all([
      rest<
        { id: string; estado: Cita["estado"]; fecha_hora: string; profesional_id: string | null; sede_id: string }[]
      >(
        data.token,
        `citas_sesiones?select=id,estado,fecha_hora,profesional_id,sede_id&${filtros.join("&")}`,
      ),
      rest<{ id: string; estado_journey: string; origen: string | null; creado_el: string }[]>(
        data.token,
        "pacientes?select=id,estado_journey,origen,creado_el&limit=5000",
      ),
      rest<Staff[]>(data.token, "usuarios_sistema?select=id,nombre_completo,rol,sede_id,creado_el").catch(
        () => [] as Staff[],
      ),
      rest<Sede[]>(data.token, "sedes?select=id,nombre,direccion,telefono"),
    ]);

    const cuenta = <T extends string>(items: (T | null)[]) =>
      items.reduce<Record<string, number>>((acc, k) => {
        const key = k ?? "sin_dato";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

    const porEstado = cuenta(citas.map((c) => c.estado));
    const totalRelevante = (porEstado["asistio"] ?? 0) + (porEstado["no_asistio"] ?? 0);
    const inasistencia = totalRelevante
      ? Math.round(((porEstado["no_asistio"] ?? 0) / totalRelevante) * 1000) / 10
      : 0;

    const semanas = citas.reduce<Record<string, number>>((acc, c) => {
      const d = new Date(c.fecha_hora);
      const lunes = new Date(d);
      lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = lunes.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const nombreStaff = new Map(staff.map((s) => [s.id, s.nombre_completo]));
    const porProfesional = citas.reduce<Record<string, number>>((acc, c) => {
      const key = c.profesional_id
        ? (nombreStaff.get(c.profesional_id) ?? "Terapeuta")
        : "Sin asignar";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const nombreSede = new Map(sedes.map((s) => [s.id, s.nombre]));
    const porSede = citas.reduce<Record<string, number>>((acc, c) => {
      const key = nombreSede.get(c.sede_id) ?? "Sede";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const activos = pacientes.filter((p) => !(p.estado_journey === null));
    const porJourney = cuenta(activos.map((p) => p.estado_journey));
    const porOrigen = cuenta(activos.map((p) => p.origen));
    const altasPorOrigen = cuenta(
      activos.filter((p) => p.estado_journey === "alta").map((p) => p.origen),
    );

    return {
      totalCitas: citas.length,
      porEstado,
      inasistencia,
      sinAsignar: citas.filter((c) => !c.profesional_id).length,
      tendencia: Object.entries(semanas)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([semana, total]) => ({ semana, total })),
      porProfesional,
      porSede,
      porJourney,
      porOrigen,
      altasPorOrigen,
      totalPacientes: activos.length,
    };
  });
