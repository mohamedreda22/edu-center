interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
}

export default function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}
