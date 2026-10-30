-- =============================================================================
-- GHAAMASHA · DATOS DE PRUEBA para el dashboard de alertas de abandono (churn)
--
-- Pegar en el SQL Editor de Supabase. Tiene tres bloques independientes:
--   1) CREAR     -> inserta 24 pacientes falsos con su historial de citas y contactos
--   2) VERIFICAR -> cuenta lo insertado
--   3) LIMPIAR   -> borra SOLO lo que creó el bloque 1
--
-- Resultado esperado en la pantalla de alertas (con el modelo de prueba actual):
--   ~11 pacientes en riesgo alto, ~1 medio y ~6 bajo; los 5 últimos perfiles
--   (altas, prospecto y dos con última asistencia > 60 días) NO deben aparecer.
--
-- Cómo se distingue lo falso: notas = 'DATO_DE_PRUEBA · ...', nombre empieza con
-- 'PRUEBA · ' y teléfono 55000000NN. No toca ningún paciente real.
-- Las fechas son relativas a now(), así que el script se puede volver a correr
-- (primero LIMPIAR) y siempre quedan "recientes".
--
-- Usa EXECUTE format(...) con literales para que funcione igual si origen,
-- estado_journey o estado son ENUM o texto con CHECK.
-- =============================================================================


-- =============================================================================
-- 1) CREAR  (ejecuta este bloque completo)
-- =============================================================================
DO $$
DECLARE
  hoy   timestamptz := now();
  sede1 uuid; sede2 uuid;
  doc1  uuid; doc2 uuid;
  p     record;
  pid   uuid; sede uuid; prof uuid;
  hora  interval;
  base  timestamptz;   -- día de la última asistencia, a la hora del paciente
  f     timestamptz;
  k     int;
  n_pac int := 0; n_cit int := 0; n_seg int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pacientes WHERE left(notas, 14) = 'DATO_DE_PRUEBA') THEN
    RAISE EXCEPTION 'Ya existen datos de prueba. Ejecuta primero el bloque LIMPIAR.';
  END IF;

  SELECT id INTO sede1 FROM sedes ORDER BY nombre LIMIT 1;
  SELECT id INTO sede2 FROM sedes ORDER BY nombre OFFSET 1 LIMIT 1;
  IF sede1 IS NULL THEN
    RAISE EXCEPTION 'No hay sedes en la tabla sedes; crea al menos una.';
  END IF;
  sede2 := COALESCE(sede2, sede1);

  -- Terapeutas reales si existen (si no hay, las citas quedan "sin asignar")
  SELECT id INTO doc1 FROM usuarios_sistema WHERE rol = 'doctor' ORDER BY nombre_completo LIMIT 1;
  SELECT id INTO doc2 FROM usuarios_sistema WHERE rol = 'doctor' ORDER BY nombre_completo OFFSET 1 LIMIT 1;
  doc2 := COALESCE(doc2, doc1);

  FOR p IN
    SELECT * FROM (VALUES
      -- idx, nombre,                 origen,         zona,              journey,          freq, n_asist, dias_ultima, faltas, dias_futura, contactos, sede
      -- ---- Constantes, con cita futura (esperado: riesgo BAJO) ----
      ( 1, 'Ana Constante',         'google',        'Tlalnepantla',    'en_tratamiento',  3, 12,  1, 0,    2, 0, 1),
      ( 2, 'Beto Puntual',          'recomendacion', 'Lindavista',      'en_tratamiento',  4, 10,  2, 0,    2, 1, 2),
      ( 3, 'Carla Regular',         'facebook',      'Tlalnepantla',    'en_tratamiento',  3,  8,  1, 0,    1, 0, 1),
      ( 4, 'Diego Fiel',            'whatsapp',      'Lindavista',      'en_tratamiento',  5,  9,  3, 0,    2, 0, 2),
      ( 5, 'Elena Disciplinada',    'web',           'Gustavo A. Madero','en_tratamiento', 4, 14,  2, 0,    2, 2, 2),
      ( 6, 'Fabian Estable',        'google',        'Tlalnepantla',    'en_tratamiento',  3,  7,  0, 0,    3, 0, 1),
      -- ---- Brecha moderada, sin cita futura (esperado: riesgo MEDIO o ALTO) ----
      ( 7, 'Gabriela Intermedia',   'google',        'Lindavista',      'en_tratamiento',  7,  6, 11, 0, NULL, 1, 2),
      ( 8, 'Hugo Espaciado',        'recomendacion', 'Tlalnepantla',    'en_tratamiento',  5,  5, 12, 1, NULL, 0, 1),
      ( 9, 'Irene Dudosa',          'facebook',      'Naucalpan',       'en_tratamiento',  4,  6, 10, 1, NULL, 1, 1),
      (10, 'Jorge Irregular',       'whatsapp',      'Lindavista',      'en_tratamiento',  6,  4, 14, 1, NULL, 0, 2),
      -- ---- Abandonando: mucho tiempo sin venir, faltas, sin cita (esperado: riesgo ALTO) ----
      (11, 'Karla Desaparecida',    'google',        'Tlalnepantla',    'en_tratamiento',  3,  5, 28, 2, NULL, 1, 1),
      (12, 'Luis Ausente',          'facebook',      'Lindavista',      'en_tratamiento',  4,  4, 35, 2, NULL, 2, 2),
      (13, 'Marta Perdida',         'web',           'Naucalpan',       'en_riesgo',       3,  6, 42, 3, NULL, 2, 1),
      (14, 'Nico Intermitente',     'otro',          'Tlalnepantla',    'en_riesgo',       5,  3, 31, 2, NULL, 0, 1),
      (15, 'Olga Sin Rumbo',        'whatsapp',      'Lindavista',      'en_tratamiento',  3,  7, 50, 3, NULL, 1, 2),
      (16, 'Pablo Inactivo',        'recomendacion', 'Lindavista',      'en_riesgo',       4,  5, 38, 2, NULL, 3, 2),
      (17, 'Quetzal Nuevo Ausente', 'google',        'Naucalpan',       'en_tratamiento',  3,  2, 22, 2, NULL, 0, 1),
      -- ---- Pocas sesiones ----
      (18, 'Rosa Reciente',         'google',        'Tlalnepantla',    'en_tratamiento',  3,  1,  2, 0,    1, 0, 1),
      (19, 'Sergio Primera',        'facebook',      'Lindavista',      'en_tratamiento',  7,  1, 20, 1, NULL, 0, 2),
      -- ---- Casos que NO deben generar alerta ----
      (20, 'Tania Alta',            'google',        'Tlalnepantla',    'alta',            3, 12,  4, 0, NULL, 0, 1),  -- dada de alta
      (21, 'Ulises Alta',           'recomendacion', 'Lindavista',      'alta',            4, 10,  9, 0, NULL, 0, 2),  -- dado de alta
      (22, 'Valeria Prospecto',     'web',           'Tlalnepantla',    'prospecto',       3,  1, 15, 0, NULL, 0, 1),  -- aún no en tratamiento
      (23, 'Wendy Antigua',         'google',        'Lindavista',      'en_tratamiento',  4,  6, 95, 1, NULL, 1, 2),  -- última asistencia > 60 días
      (24, 'Xavier Antiguo',        'facebook',      'Naucalpan',       'en_riesgo',       5,  5,120, 2, NULL, 0, 1)   -- última asistencia > 60 días
    ) AS t(idx, nombre, origen, zona, journey, freq, n_asist, dias_ultima, faltas, dias_futura, contactos, sede_n)
  LOOP
    sede := CASE WHEN p.sede_n = 1 THEN sede1 ELSE sede2 END;
    prof := CASE WHEN p.idx <= 12 THEN doc1 ELSE doc2 END;
    hora := make_interval(hours => 7 + (p.idx % 12));   -- una hora distinta por paciente: sin traslapes
    base := date_trunc('day', hoy) - make_interval(days => p.dias_ultima) + hora;

    EXECUTE format(
      'INSERT INTO pacientes (nombre_completo, telefono, origen, municipio_zona, notas, estado_journey, acepto_aviso_privacidad, archivado)
       VALUES (%L, %L, %L, %L, %L, %L, true, false) RETURNING id',
      'PRUEBA · ' || p.nombre, '55000000' || lpad(p.idx::text, 2, '0'), p.origen, p.zona,
      'DATO_DE_PRUEBA · perfil ' || p.idx, p.journey
    ) INTO pid;
    n_pac := n_pac + 1;

    -- Sesiones a las que asistió: la última en "base", las anteriores cada "freq" días hacia atrás
    FOR k IN 0 .. p.n_asist - 1 LOOP
      f := base - make_interval(days => k * p.freq);
      EXECUTE format(
        'INSERT INTO citas_sesiones (paciente_id, sede_id, profesional_id, fecha_hora, numero_sesion, estado, notas_sesion, creado_el)
         VALUES (%L, %L, %L, %L, %L, %L, %L, %L)',
        pid, sede, prof, f,
        CASE WHEN k = p.n_asist - 1 THEN '1ª Consulta' ELSE 'Sesión ' || (p.n_asist - k) END,
        'asistio', 'DATO_DE_PRUEBA', f - interval '3 days'
      );
      n_cit := n_cit + 1;
    END LOOP;

    -- Citas a las que faltó después de su última asistencia (solo si ya pasaron)
    FOR k IN 1 .. p.faltas LOOP
      f := base + make_interval(days => k * p.freq);
      IF f < hoy THEN
        EXECUTE format(
          'INSERT INTO citas_sesiones (paciente_id, sede_id, profesional_id, fecha_hora, numero_sesion, estado, notas_sesion, creado_el)
           VALUES (%L, %L, %L, %L, %L, %L, %L, %L)',
          pid, sede, prof, f, 'Sesión ' || (p.n_asist + k),
          'no_asistio', 'DATO_DE_PRUEBA', f - interval '3 days'
        );
        n_cit := n_cit + 1;
      END IF;
    END LOOP;

    -- Próxima cita ya agendada (señal de que el paciente sigue comprometido)
    IF p.dias_futura IS NOT NULL THEN
      f := date_trunc('day', hoy) + make_interval(days => p.dias_futura) + hora;
      EXECUTE format(
        'INSERT INTO citas_sesiones (paciente_id, sede_id, profesional_id, fecha_hora, numero_sesion, estado, notas_sesion, creado_el)
         VALUES (%L, %L, %L, %L, %L, %L, %L, %L)',
        pid, sede, prof, f, 'Sesión ' || (p.n_asist + 1),
        'confirmada', 'DATO_DE_PRUEBA', hoy - interval '1 day'
      );
      n_cit := n_cit + 1;
    END IF;

    -- Contactos de seguimiento hechos por recepción
    FOR k IN 1 .. p.contactos LOOP
      f := LEAST(base + make_interval(days => k * p.freq + 1), hoy - interval '1 hour');
      EXECUTE format(
        'INSERT INTO historial_seguimiento (paciente_id, fecha_contacto, canal, respuesta_paciente)
         VALUES (%L, %L, %L, %L)',
        pid, f, 'whatsapp',
        CASE WHEN k % 2 = 1 THEN 'Sin respuesta' ELSE 'Dijo que volverá pronto' END
      );
      n_seg := n_seg + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Datos de prueba creados: % pacientes, % citas, % contactos', n_pac, n_cit, n_seg;
END $$;


-- =============================================================================
-- 2) VERIFICAR  (opcional)
-- =============================================================================
SELECT p.estado_journey, count(DISTINCT p.id) AS pacientes,
       count(c.id) FILTER (WHERE c.estado = 'asistio')    AS citas_asistio,
       count(c.id) FILTER (WHERE c.estado = 'no_asistio') AS citas_no_asistio,
       count(c.id) FILTER (WHERE c.estado = 'confirmada') AS citas_futuras
FROM pacientes p
LEFT JOIN citas_sesiones c ON c.paciente_id = p.id
WHERE left(p.notas, 14) = 'DATO_DE_PRUEBA'
GROUP BY p.estado_journey
ORDER BY p.estado_journey;


-- =============================================================================
-- 3) LIMPIAR  (borra solo los datos de prueba; ejecútalo cuando termines)
-- =============================================================================
-- DELETE FROM historial_seguimiento
--  WHERE paciente_id IN (SELECT id FROM pacientes WHERE left(notas, 14) = 'DATO_DE_PRUEBA');
-- DELETE FROM citas_sesiones
--  WHERE paciente_id IN (SELECT id FROM pacientes WHERE left(notas, 14) = 'DATO_DE_PRUEBA');
-- DELETE FROM pacientes
--  WHERE left(notas, 14) = 'DATO_DE_PRUEBA';
