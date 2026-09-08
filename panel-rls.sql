-- =============================================================================
-- GHAAMASHA · Políticas para el panel interno
-- Ejecuta este bloque completo en el SQL Editor de tu proyecto Supabase.
-- No toca las políticas de anon (formulario público del sitio web).
-- =============================================================================

-- citas_sesiones: un doctor solo ve/edita SUS citas; admin y recepcion, todas
DROP POLICY IF EXISTS "Personal autenticado puede ver citas" ON citas_sesiones;
CREATE POLICY "Personal autenticado puede ver citas"
  ON citas_sesiones FOR SELECT
  TO authenticated
  USING (
    fn_rol_actual() IN ('admin','recepcion')
    OR (fn_rol_actual() = 'doctor' AND profesional_id = auth.uid())
  );

DROP POLICY IF EXISTS "Personal autenticado puede editar citas" ON citas_sesiones;
CREATE POLICY "Personal autenticado puede editar citas"
  ON citas_sesiones FOR UPDATE
  TO authenticated
  USING (
    fn_rol_actual() IN ('admin','recepcion')
    OR (fn_rol_actual() = 'doctor' AND profesional_id = auth.uid())
  )
  WITH CHECK (
    fn_rol_actual() IN ('admin','recepcion')
    OR (fn_rol_actual() = 'doctor' AND profesional_id = auth.uid())
  );

DROP POLICY IF EXISTS "Personal autenticado puede crear citas" ON citas_sesiones;
CREATE POLICY "Personal autenticado puede crear citas"
  ON citas_sesiones FOR INSERT
  TO authenticated
  WITH CHECK (fn_rol_actual() IN ('admin','recepcion','doctor'));

-- pacientes: un doctor solo ve/edita pacientes con al menos una cita suya
DROP POLICY IF EXISTS "Personal autenticado puede ver pacientes" ON pacientes;
CREATE POLICY "Personal autenticado puede ver pacientes"
  ON pacientes FOR SELECT
  TO authenticated
  USING (
    fn_rol_actual() IN ('admin','recepcion')
    OR (fn_rol_actual() = 'doctor' AND EXISTS (
      SELECT 1 FROM citas_sesiones c
      WHERE c.paciente_id = pacientes.id AND c.profesional_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Personal autenticado puede editar pacientes" ON pacientes;
CREATE POLICY "Personal autenticado puede editar pacientes"
  ON pacientes FOR UPDATE
  TO authenticated
  USING (
    fn_rol_actual() IN ('admin','recepcion')
    OR (fn_rol_actual() = 'doctor' AND EXISTS (
      SELECT 1 FROM citas_sesiones c
      WHERE c.paciente_id = pacientes.id AND c.profesional_id = auth.uid()
    ))
  )
  WITH CHECK (
    fn_rol_actual() IN ('admin','recepcion')
    OR (fn_rol_actual() = 'doctor' AND EXISTS (
      SELECT 1 FROM citas_sesiones c
      WHERE c.paciente_id = pacientes.id AND c.profesional_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Personal autenticado puede crear pacientes" ON pacientes;
CREATE POLICY "Personal autenticado puede crear pacientes"
  ON pacientes FOR INSERT
  TO authenticated
  WITH CHECK (fn_rol_actual() IN ('admin','recepcion','doctor'));

-- historial_seguimiento: solo admin y recepcion
DROP POLICY IF EXISTS "Personal autenticado puede ver historial" ON historial_seguimiento;
CREATE POLICY "Personal autenticado puede ver historial"
  ON historial_seguimiento FOR SELECT
  TO authenticated
  USING (fn_rol_actual() IN ('admin','recepcion'));

DROP POLICY IF EXISTS "Personal autenticado puede crear historial" ON historial_seguimiento;
CREATE POLICY "Personal autenticado puede crear historial"
  ON historial_seguimiento FOR INSERT
  TO authenticated
  WITH CHECK (fn_rol_actual() IN ('admin','recepcion'));

DROP POLICY IF EXISTS "Personal autenticado puede editar historial" ON historial_seguimiento;
CREATE POLICY "Personal autenticado puede editar historial"
  ON historial_seguimiento FOR UPDATE
  TO authenticated
  USING (fn_rol_actual() IN ('admin','recepcion'))
  WITH CHECK (fn_rol_actual() IN ('admin','recepcion'));

-- Necesario para el panel: admin y recepcion deben poder listar al personal
-- (selector de terapeuta en el calendario y en la agenda por staff).
-- Cada usuario sigue viendo su propio perfil.
DROP POLICY IF EXISTS "Personal puede ver directorio de usuarios" ON usuarios_sistema;
CREATE POLICY "Personal puede ver directorio de usuarios"
  ON usuarios_sistema FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR fn_rol_actual() IN ('admin','recepcion')
  );
