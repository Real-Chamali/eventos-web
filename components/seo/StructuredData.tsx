/**
 * Componente para inyectar Structured Data (JSON-LD)
 * Útil para páginas client components que necesitan structured data
 */

interface StructuredDataProps {
  data: object | object[]
}

export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}

