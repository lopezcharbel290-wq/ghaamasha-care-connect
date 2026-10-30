# Churn: entrenamiento (Python) + ejecución (TypeScript)

Python **solo se usa para reentrenar**. El CRM puntúa en TypeScript con `src/lib/churn/`.

```
ml/churn/entrenar_y_exportar.py ──> src/lib/churn/modelo-churn.json ──> features.ts + modelo.ts ──> alertasChurn()
```

## Reentrenar con datos reales
1. En Supabase exporta a CSV `pacientes`, `citas_sesiones` e `historial_seguimiento` a una carpeta.
2. `pip install -r requirements.txt`
3. `python entrenar_y_exportar.py --fuente csv --carpeta <carpeta>`
4. Revisa las métricas impresas y haz commit de `modelo-churn.json`.

`modelo-churn.json` actual fue entrenado con datos **sintéticos** (`meta.fuente_datos = "sintetico"`):
sirve para probar el pipeline, no para decidir nada sobre pacientes reales.

## Verificar que Python y TypeScript coinciden
`python entrenar_y_exportar.py --fuente sintetico` y luego `node ml/churn/verificar_paridad.mjs`
(Node >= 22.18). Hazlo siempre que cambies atributos en `churn_model.py` o `features.ts`.
