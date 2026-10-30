"""Entrenamiento del modelo de churn de GHAAMASHA (solo se usa OFFLINE).

En producción el CRM NO ejecuta Python: este módulo entrena y `exportar_modelo()`
escribe un JSON con los coeficientes y los árboles. El cálculo de atributos y la
predicción viven en TypeScript (src/lib/churn/) y deben dar lo mismo que aquí;
`entrenar_y_exportar.py` genera además un fixture de paridad para comprobarlo.

Definición de churn (ajustable con HORIZONTE_DIAS):
    Un paciente "activo" a la fecha de corte T (asistió en los últimos
    VENTANA_ACTIVO_DIAS y no está de alta) abandona si NO asiste a ninguna sesión
    en los siguientes HORIZONTE_DIAS días.

Los atributos usan solo lo que se sabía en T; la etiqueta, solo lo posterior.

Tablas de entrada (columnas de Supabase):
    pacientes:             id, origen, municipio_zona, estado_journey
    citas_sesiones:        paciente_id, sede_id, profesional_id, fecha_hora, estado, creado_el
    historial_seguimiento: paciente_id, fecha_contacto
"""

from __future__ import annotations

import json
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from xgboost import XGBClassifier

HORIZONTE_DIAS = 30
PASO_SNAPSHOT_DIAS = 14
MIN_SESIONES_ASISTIDAS = 1
VENTANA_ACTIVO_DIAS = 60
MIN_FRECUENCIA_CATEGORIA = 5
PESO_XGB = 0.6
UMBRAL_MEDIO = 0.40
UMBRAL_ALTO = 0.65

NUMERICAS = [
    "n_asistidas", "n_no_asistio", "n_canceladas", "tasa_inasistencia",
    "dias_desde_ultima_asistencia", "dias_desde_primera_cita", "intervalo_medio_dias",
    "ratio_brecha_vs_intervalo", "asistidas_30d", "asistidas_60d", "inasistencias_30d",
    "tendencia_frecuencia", "tiene_cita_futura", "dias_hasta_proxima_cita",
    "n_profesionales", "n_contactos", "dias_desde_ultimo_contacto",
]
CATEGORICAS = ["origen", "municipio_zona", "sede_principal", "estado_journey"]


# --------------------------------------------------------------------------- #
# 1. Ingeniería de atributos (la versión TypeScript replica esto línea a línea)
# --------------------------------------------------------------------------- #
def construir_atributos(
    pacientes: pd.DataFrame,
    citas: pd.DataFrame,
    seguimiento: pd.DataFrame,
    corte: pd.Timestamp,
) -> pd.DataFrame:
    """Una fila por paciente activo a la fecha `corte`, usando solo datos previos."""
    c = citas[citas["creado_el"] < corte]  # lo que existía en el sistema en T
    pasadas = c[c["fecha_hora"] < corte]
    futuras = c[(c["fecha_hora"] >= corte) & (c["estado"] != "cancelada")]
    asist = pasadas[pasadas["estado"] == "asistio"]

    g = asist.groupby("paciente_id")["fecha_hora"]
    base = pd.DataFrame({
        "n_asistidas": g.size(),
        "ultima_asistencia": g.max(),
        "primera_cita": pasadas.groupby("paciente_id")["fecha_hora"].min(),
    })
    base = base[base["n_asistidas"] >= MIN_SESIONES_ASISTIDAS]
    base["dias_desde_ultima_asistencia"] = (corte - base["ultima_asistencia"]).dt.days
    base = base[base["dias_desde_ultima_asistencia"] <= VENTANA_ACTIVO_DIAS]
    base["dias_desde_primera_cita"] = (corte - base["primera_cita"]).dt.days

    base["n_no_asistio"] = pasadas[pasadas["estado"] == "no_asistio"].groupby("paciente_id").size()
    base["n_canceladas"] = pasadas[pasadas["estado"] == "cancelada"].groupby("paciente_id").size()
    base[["n_no_asistio", "n_canceladas"]] = base[["n_no_asistio", "n_canceladas"]].fillna(0)
    base["tasa_inasistencia"] = base["n_no_asistio"] / (base["n_no_asistio"] + base["n_asistidas"])

    def _intervalo(s: pd.Series) -> float:
        return s.sort_values().diff().dt.days.mean() if len(s) > 1 else np.nan

    base["intervalo_medio_dias"] = g.apply(_intervalo)
    base["ratio_brecha_vs_intervalo"] = (
        base["dias_desde_ultima_asistencia"] / base["intervalo_medio_dias"].clip(lower=1)
    )

    def _contar(df: pd.DataFrame, dias_ini: int, dias_fin: int) -> pd.Series:
        m = (df["fecha_hora"] >= corte - pd.Timedelta(days=dias_ini)) & (
            df["fecha_hora"] < corte - pd.Timedelta(days=dias_fin)
        )
        return df[m].groupby("paciente_id").size()

    a30, a30_60 = _contar(asist, 30, 0), _contar(asist, 60, 30)
    base["asistidas_30d"] = a30
    base["asistidas_60d"] = _contar(asist, 60, 0)
    base["inasistencias_30d"] = _contar(pasadas[pasadas["estado"] == "no_asistio"], 30, 0)
    base["tendencia_frecuencia"] = a30.reindex(base.index).fillna(0) - a30_60.reindex(base.index).fillna(0)
    cols0 = ["asistidas_30d", "asistidas_60d", "inasistencias_30d"]
    base[cols0] = base[cols0].fillna(0)

    prox = futuras.groupby("paciente_id")["fecha_hora"].min()
    base["tiene_cita_futura"] = base.index.isin(prox.index).astype(int)
    base["dias_hasta_proxima_cita"] = (prox.reindex(base.index) - corte).dt.days

    base["n_profesionales"] = asist.groupby("paciente_id")["profesional_id"].nunique()
    base["sede_principal"] = asist.groupby("paciente_id")["sede_id"].agg(lambda s: s.mode().iat[0])

    seg = seguimiento[seguimiento["fecha_contacto"] < corte]
    base["n_contactos"] = seg.groupby("paciente_id").size()
    base["dias_desde_ultimo_contacto"] = (corte - seg.groupby("paciente_id")["fecha_contacto"].max()).dt.days
    base["n_contactos"] = base["n_contactos"].fillna(0)

    base = base.join(pacientes.set_index("id")[["origen", "municipio_zona", "estado_journey"]])
    base = base[base["estado_journey"] != "alta"]  # un alta es un cierre natural, no churn
    base["corte"] = corte
    return base.reset_index(names="paciente_id")


def etiquetar(atributos: pd.DataFrame, citas: pd.DataFrame, horizonte: int = HORIZONTE_DIAS) -> pd.Series:
    """churn=1 si el paciente no asistió a ninguna sesión en [corte, corte+horizonte)."""
    corte = atributos["corte"].iat[0]
    ventana = citas[
        (citas["estado"] == "asistio")
        & (citas["fecha_hora"] >= corte)
        & (citas["fecha_hora"] < corte + pd.Timedelta(days=horizonte))
    ]
    return (~atributos["paciente_id"].isin(set(ventana["paciente_id"]))).astype(int)


def construir_dataset(pacientes, citas, seguimiento, horizonte: int = HORIZONTE_DIAS) -> pd.DataFrame:
    """Snapshots cada PASO_SNAPSHOT_DIAS días con etiqueta observable completa."""
    inicio = citas["fecha_hora"].min().normalize() + pd.Timedelta(days=VENTANA_ACTIVO_DIAS)
    fin = citas["fecha_hora"].max().normalize() - pd.Timedelta(days=horizonte)
    partes = []
    for corte in pd.date_range(inicio, fin, freq=f"{PASO_SNAPSHOT_DIAS}D"):
        x = construir_atributos(pacientes, citas, seguimiento, corte)
        if x.empty:
            continue
        x["churn"] = etiquetar(x, citas, horizonte).to_numpy()
        partes.append(x)
    return pd.concat(partes, ignore_index=True)


# --------------------------------------------------------------------------- #
# 2. Matrices de entrada (preprocesamiento explícito = fácil de portar a TS)
# --------------------------------------------------------------------------- #
@dataclass
class Preproceso:
    medianas: dict[str, float]
    medias: dict[str, float]
    desvios: dict[str, float]
    categorias: dict[str, list[str]]

    @property
    def columnas(self) -> list[str]:
        return NUMERICAS + [f"{c}={v}" for c in CATEGORICAS for v in self.categorias[c]]

    def _onehot(self, x: pd.DataFrame) -> np.ndarray:
        cols = []
        for c in CATEGORICAS:
            serie = x[c].fillna("desconocido").astype(str)
            cols += [(serie == v).to_numpy(dtype=float) for v in self.categorias[c]]
        return np.column_stack(cols) if cols else np.empty((len(x), 0))

    def matriz_xgb(self, x: pd.DataFrame) -> np.ndarray:
        """Numéricas crudas (NaN = faltante, XGBoost lo maneja) + one-hot."""
        num = x[NUMERICAS].to_numpy(dtype=float)
        return np.hstack([num, self._onehot(x)])

    def matriz_lr(self, x: pd.DataFrame) -> np.ndarray:
        """Numéricas imputadas con la mediana y estandarizadas + one-hot."""
        num = x[NUMERICAS].copy()
        for c in NUMERICAS:
            num[c] = num[c].fillna(self.medianas[c])
            num[c] = (num[c] - self.medias[c]) / self.desvios[c]
        return np.hstack([num.to_numpy(dtype=float), self._onehot(x)])


def ajustar_preproceso(tr: pd.DataFrame) -> Preproceso:
    medianas = {c: float(tr[c].median()) if tr[c].notna().any() else 0.0 for c in NUMERICAS}
    imp = tr[NUMERICAS].fillna(pd.Series(medianas))
    medias = {c: float(imp[c].mean()) for c in NUMERICAS}
    desvios = {c: (float(imp[c].std(ddof=0)) or 1.0) for c in NUMERICAS}
    categorias = {}
    for c in CATEGORICAS:
        cuenta = tr[c].fillna("desconocido").astype(str).value_counts()
        categorias[c] = sorted(cuenta[cuenta >= MIN_FRECUENCIA_CATEGORIA].index)
    return Preproceso(medianas, medias, desvios, categorias)


# --------------------------------------------------------------------------- #
# 3. Modelos
# --------------------------------------------------------------------------- #
@dataclass
class ModeloChurn:
    pre: Preproceso
    lr: LogisticRegression
    xgb: XGBClassifier

    def p_lr(self, x: pd.DataFrame) -> np.ndarray:
        return self.lr.predict_proba(self.pre.matriz_lr(x))[:, 1]

    def p_xgb(self, x: pd.DataFrame) -> np.ndarray:
        return self.xgb.predict_proba(self.pre.matriz_xgb(x))[:, 1]

    def probabilidad(self, x: pd.DataFrame) -> np.ndarray:
        return PESO_XGB * self.p_xgb(x) + (1 - PESO_XGB) * self.p_lr(x)

    def contribuciones_xgb(self, x: pd.DataFrame) -> np.ndarray:
        """SHAP exacto (una columna por atributo + sesgo al final), en espacio logit."""
        from xgboost import DMatrix
        return self.xgb.get_booster().predict(DMatrix(self.pre.matriz_xgb(x)), pred_contribs=True)


def entrenar(dataset: pd.DataFrame, test_frac: float = 0.25) -> tuple[ModeloChurn, dict]:
    """Entrena con corte temporal (nunca mezcla pasado y futuro) y reporta métricas."""
    cortes = np.sort(dataset["corte"].unique())
    k = int(len(cortes) * (1 - test_frac))
    limite_train = pd.Timestamp(cortes[k]) - pd.Timedelta(days=HORIZONTE_DIAS)
    tr = dataset[dataset["corte"] < limite_train]
    te = dataset[dataset["corte"] >= pd.Timestamp(cortes[k])]

    pre = ajustar_preproceso(tr)
    lr = LogisticRegression(C=0.5, class_weight="balanced", max_iter=2000)
    lr.fit(pre.matriz_lr(tr), tr["churn"])
    peso = (tr["churn"] == 0).sum() / max((tr["churn"] == 1).sum(), 1)
    xgb = XGBClassifier(
        n_estimators=300, max_depth=3, learning_rate=0.05, subsample=0.8,
        colsample_bytree=0.8, min_child_weight=5, reg_lambda=2.0,
        scale_pos_weight=peso, eval_metric="aucpr", random_state=42,
    )
    xgb.fit(pre.matriz_xgb(tr), tr["churn"])
    modelo = ModeloChurn(pre, lr, xgb)

    metricas: dict = {"tasa_base_test": float(te["churn"].mean()), "filas_train": len(tr), "filas_test": len(te)}
    for nombre, p in [("logistica", modelo.p_lr(te)), ("xgboost", modelo.p_xgb(te)), ("ensamble", modelo.probabilidad(te))]:
        metricas[nombre] = {
            "roc_auc": float(roc_auc_score(te["churn"], p)),
            "pr_auc": float(average_precision_score(te["churn"], p)),
            "brier": float(brier_score_loss(te["churn"], p)),
        }
    return modelo, metricas


# --------------------------------------------------------------------------- #
# 4. Exportación a JSON para el CRM (TypeScript)
# --------------------------------------------------------------------------- #
def _arboles_xgb(modelo: ModeloChurn) -> tuple[float, list[dict]]:
    """Árboles en arreglos planos; los nodos internos guardan su valor esperado
    (media ponderada por cover) y los hojas su valor, ambos en espacio logit."""
    raw = json.loads(modelo.xgb.get_booster().save_raw("json"))
    learner = raw["learner"]
    base = float(str(learner["learner_model_param"]["base_score"]).strip("[]"))
    arboles = []
    for t in learner["gradient_booster"]["model"]["trees"]:
        izq, der = t["left_children"], t["right_children"]
        cond, cover = t["split_conditions"], t["sum_hessian"]
        val = list(cond)  # hojas: split_conditions guarda el valor de la hoja

        def esperado(i: int) -> float:
            if izq[i] == -1:
                return val[i]
            a, b = esperado(izq[i]), esperado(der[i])
            ca, cb = cover[izq[i]], cover[der[i]]
            val[i] = (a * ca + b * cb) / (ca + cb)
            return val[i]

        esperado(0)
        arboles.append({
            "izq": izq, "der": der, "feat": t["split_indices"], "umbral": cond,
            "faltante_izq": [bool(d) for d in t["default_left"]], "cover": cover, "valor": val,
        })
    return base, arboles


def exportar_modelo(modelo: ModeloChurn, metricas: dict, fuente: str) -> dict:
    base, arboles = _arboles_xgb(modelo)
    pre = modelo.pre
    return {
        "meta": {
            "version": 1,
            "entrenado_el": pd.Timestamp.now(tz="UTC").isoformat(),
            "fuente_datos": fuente,
            "horizonte_dias": HORIZONTE_DIAS,
            "ventana_activo_dias": VENTANA_ACTIVO_DIAS,
            "metricas": metricas,
        },
        "ensamble": {"peso_xgb": PESO_XGB, "umbral_medio": UMBRAL_MEDIO, "umbral_alto": UMBRAL_ALTO},
        "columnas": pre.columnas,
        "numericas": NUMERICAS,
        "categoricas": {c: pre.categorias[c] for c in CATEGORICAS},
        "logistico": {
            "intercepto": float(modelo.lr.intercept_[0]),
            "coeficientes": [float(v) for v in modelo.lr.coef_[0]],
            "medianas": pre.medianas, "medias": pre.medias, "desvios": pre.desvios,
        },
        "xgboost": {"base_score": base, "arboles": arboles},
    }


def fixture_paridad(modelo: ModeloChurn, dataset: pd.DataFrame, n: int = 40, seed: int = 0) -> dict:
    """Filas de ejemplo con las salidas de Python, para verificar el puerto TS."""
    x = dataset.sample(n=min(n, len(dataset)), random_state=seed).reset_index(drop=True)
    contrib = modelo.contribuciones_xgb(x)
    filas = []
    for i, fila in x.iterrows():
        entrada = {c: (None if pd.isna(fila[c]) else float(fila[c])) for c in NUMERICAS}
        entrada.update({c: (None if pd.isna(fila[c]) else str(fila[c])) for c in CATEGORICAS})
        filas.append({
            "entrada": entrada,
            "p_lr": float(modelo.p_lr(x.iloc[[i]])[0]),
            "p_xgb": float(modelo.p_xgb(x.iloc[[i]])[0]),
            "p": float(modelo.probabilidad(x.iloc[[i]])[0]),
            "contribuciones": [float(v) for v in contrib[i]],
        })
    return {"columnas": modelo.pre.columnas, "filas": filas}
