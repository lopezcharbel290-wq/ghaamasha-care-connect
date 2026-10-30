/** Formato del JSON que exporta ml/churn/churn_model.py (modelo-churn.json). */
export type ArbolXgb = {
  izq: number[];
  der: number[];
  feat: number[];
  umbral: number[];
  faltante_izq: boolean[];
  cover: number[];
  /** hojas: valor de la hoja; nodos internos: valor esperado (ponderado por cover) */
  valor: number[];
};

export type ModeloExportado = {
  meta: {
    version: number;
    entrenado_el: string;
    /** "sintetico" = solo para probar el pipeline; "csv" = datos reales de la clínica */
    fuente_datos: "sintetico" | "csv";
    horizonte_dias: number;
    ventana_activo_dias: number;
    metricas: Record<string, unknown>;
  };
  ensamble: { peso_xgb: number; umbral_medio: number; umbral_alto: number };
  columnas: string[];
  numericas: string[];
  categoricas: Record<string, string[]>;
  logistico: {
    intercepto: number;
    coeficientes: number[];
    medianas: Record<string, number>;
    medias: Record<string, number>;
    desvios: Record<string, number>;
  };
  xgboost: { base_score: number; arboles: ArbolXgb[] };
};

/** Atributos de un paciente en una fecha de corte (null = dato faltante). */
export type Atributos = Record<string, number | string | null>;

export type NivelRiesgo = "bajo" | "medio" | "alto";

export type Razon = { columna: string; texto: string; impacto: number };

export type AlertaChurn = {
  paciente_id: string;
  sede_id: string | null;
  probabilidad: number;
  nivel: NivelRiesgo;
  razones: Razon[];
  dias_desde_ultima_asistencia: number;
  tiene_cita_futura: boolean;
  tasa_inasistencia: number;
};

export type PacienteEntrada = {
  id: string;
  origen: string | null;
  municipio_zona: string | null;
  estado_journey: string | null;
};

export type CitaEntrada = {
  paciente_id: string;
  sede_id: string;
  profesional_id: string | null;
  fecha_hora: string;
  estado: "confirmada" | "asistio" | "no_asistio" | "cancelada";
  creado_el: string;
};

export type SeguimientoEntrada = {
  paciente_id: string;
  fecha_contacto: string;
};
