export default function Loading() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  )
}
