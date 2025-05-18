interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

interface DetailsListProps {
  details: DetailItemProps[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

export function DetailsList({ details, columns = 2, className }: DetailsListProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <dl className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {details.map((detail, index) => (
        <DetailItem key={index} label={detail.label} value={detail.value} />
      ))}
    </dl>
  );
}
