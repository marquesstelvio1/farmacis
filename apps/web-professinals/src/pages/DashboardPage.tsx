export default function DashboardPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ marginBottom: 0 }}>Dashboard do Profissional</h1>
      <p style={{ marginTop: 0, color: "#475569" }}>
        Aqui ficam os indicadores principais: consultas, pacientes do dia e notificacoes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div className="card">
          <strong>Consultas hoje</strong>
          <p style={{ fontSize: 28, margin: "10px 0 0" }}>12</p>
        </div>
        <div className="card">
          <strong>Pendencias</strong>
          <p style={{ fontSize: 28, margin: "10px 0 0" }}>4</p>
        </div>
        <div className="card">
          <strong>Atendimentos concluidos</strong>
          <p style={{ fontSize: 28, margin: "10px 0 0" }}>27</p>
        </div>
      </div>
    </div>
  );
}
