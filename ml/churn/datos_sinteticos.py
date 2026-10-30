"""Datos sintéticos para probar el pipeline (NO son datos reales de la clínica)."""

import numpy as np
import pandas as pd


def generar_datos(n_pacientes: int = 1500, seed: int = 7):
    rng = np.random.default_rng(seed)
    fin = pd.Timestamp("2026-10-28")
    inicio = fin - pd.Timedelta(days=540)
    sedes, profs = ["s1", "s2"], ["p1", "p2", "p3", "p4"]
    pacs, citas, segs = [], [], []

    for i in range(n_pacientes):
        pid = f"pac{i}"
        alta_dia = inicio + pd.Timedelta(days=int(rng.integers(0, 480)))
        frecuencia = rng.choice([3, 5, 7])
        propension = rng.beta(2, 5)
        sesiones_objetivo = int(rng.integers(6, 25))
        abandona = rng.random() < 0.45
        sesiones_hasta_abandono = int(rng.integers(2, sesiones_objetivo)) if abandona else sesiones_objetivo
        sede, prof = rng.choice(sedes), rng.choice(profs)

        t = alta_dia
        for k in range(sesiones_objetivo):
            if k >= sesiones_hasta_abandono or t > fin + pd.Timedelta(days=20):
                break
            if t > fin:
                citas.append((pid, sede, prof, t, "confirmada", t - pd.Timedelta(days=5)))
            else:
                p_falta = min(propension * (1 + k / 12) + (0.25 if abandona and k >= sesiones_hasta_abandono - 2 else 0), 0.9)
                est = "no_asistio" if rng.random() < p_falta else ("cancelada" if rng.random() < 0.08 else "asistio")
                citas.append((pid, sede, prof, t, est, t - pd.Timedelta(days=int(rng.integers(2, 7)))))
                if est != "asistio" and rng.random() < 0.6:
                    segs.append((pid, t + pd.Timedelta(days=1), "whatsapp", "respondio" if rng.random() < .5 else "sin_respuesta"))
            t += pd.Timedelta(days=int(frecuencia + rng.integers(-1, 3)))

        estado = "alta" if (not abandona and t < fin) else rng.choice(["en_tratamiento", "en_riesgo"], p=[.8, .2])
        pacs.append((pid, rng.choice(["google", "facebook", "whatsapp", "referido"]),
                     rng.choice(["Tlalnepantla", "Lindavista", "Naucalpan"]), estado, alta_dia))

    pacientes = pd.DataFrame(pacs, columns=["id", "origen", "municipio_zona", "estado_journey", "creado_el"])
    citas = pd.DataFrame(citas, columns=["paciente_id", "sede_id", "profesional_id", "fecha_hora", "estado", "creado_el"])
    seg = pd.DataFrame(segs, columns=["paciente_id", "fecha_contacto", "canal", "respuesta_paciente"])
    return pacientes, citas, seg
