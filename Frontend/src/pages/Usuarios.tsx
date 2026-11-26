import { useMemo, useState } from "react"
import type { Usuario } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { fecha } from "../lib/format"
import {
  Badge,
  ErrorState,
  Filters,
  Icon,
  Loading,
  PageHeader,
  Pagination,
} from "../components/ui"
import { ToggleUsuario, UsuarioForm } from "../components/forms"

const MODULOS: Record<string, string> = {
  ADMIN: "Todos",
  ENCARGADO: "Operaciones · Stock · Remitos",
}

export function Usuarios() {
  const { data, loading, error, reload } = useApiData<Usuario[]>("/usuarios")
  const [busqueda, setBusqueda] = useState("")
  const [nuevo, setNuevo] = useState(false)

  const usuarios = useMemo(
    () =>
      (data ?? []).filter((u) =>
        `${u.nombre} ${u.email}`.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [data, busqueda],
  )

  const activos = (data ?? []).filter((u) => u.activo).length
  const admins = (data ?? []).filter((u) => u.rol === "ADMIN").length
  const encargados = (data ?? []).filter((u) => u.rol === "ENCARGADO").length

  return (
    <div className="content">
      <PageHeader
        eyebrow="SISTEMA"
        title="Usuarios y permisos"
        subtitle="Administración de accesos, roles y actividad"
        action="Nuevo usuario"
        onAction={() => setNuevo(true)}
      />
      <div className="summary-line compact-summary">
        <div>
          <span>Usuarios activos</span>
          <strong>{activos}</strong>
        </div>
        <div>
          <span>Administradores</span>
          <strong>{admins}</strong>
        </div>
        <div>
          <span>Encargados</span>
          <strong>{encargados}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{data?.length ?? 0}</strong>
        </div>
      </div>
      <div className="table-panel">
        <Filters search="Buscar nombre o correo..." value={busqueda} onChange={setBusqueda} />
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>USUARIO</th>
                  <th>CORREO</th>
                  <th>ROL</th>
                  <th>ALTA</th>
                  <th>MÓDULOS HABILITADOS</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nombre}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.rol === "ADMIN" ? "Administrador" : "Encargado"}</td>
                    <td>{fecha(u.createdAt)}</td>
                    <td>{MODULOS[u.rol]}</td>
                    <td>
                      <Badge tone={u.activo ? "success" : "danger"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                    </td>
                    <td>
                      <ToggleUsuario id={u.id} activo={u.activo} onDone={reload} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && <p className="table-empty">No hay usuarios para mostrar.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${usuarios.length} usuarios`} />
      </div>
      {nuevo && (
        <UsuarioForm
          onClose={() => setNuevo(false)}
          onDone={() => {
            setNuevo(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}
