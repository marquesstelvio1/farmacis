const appointments = [
  { id: 1, patient: "Maria Luisa", time: "09:00", status: "Confirmada" },
  { id: 2, patient: "Joao Pedro", time: "10:30", status: "Aguardando" },
  { id: 3, patient: "Carlos Manuel", time: "14:00", status: "Confirmada" }
];

export default function AgendaPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ marginBottom: 0 }}>Agenda</h1>
      <p style={{ marginTop: 0, color: "#475569" }}>
        Visualize e gerencie os atendimentos do profissional.
      </p>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f1f5f9" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 12 }}>Paciente</th>
              <th style={{ textAlign: "left", padding: 12 }}>Horario</th>
              <th style={{ textAlign: "left", padding: 12 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((item) => (
              <tr key={item.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: 12 }}>{item.patient}</td>
                <td style={{ padding: 12 }}>{item.time}</td>
                <td style={{ padding: 12 }}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
