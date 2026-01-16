import { Link } from 'react-router-dom';
import { Category } from '@/lib/mockData';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link to={`/category/${category.id}`}>
      <div className="group glass-card p-6 transition-all duration-300 hover:border-primary/50 hover:glow-primary cursor-pointer animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="text-4xl mb-4">{category.icon}</div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary">{category.marketCount} markets</span>
        </div>
      </div>
    </Link>
  );
}
