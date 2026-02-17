import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
}
export function Card({
  children,
  className = '',
  title,
  icon,
  action,
  variant = 'default',
  ...props
}: CardProps) {
  const borderColor = {
    default: 'border-slate-800',
    danger: 'border-rose-900/50',
    success: 'border-emerald-900/50'
  }[variant];
  const glowColor = {
    default: 'shadow-cyan-900/5',
    danger: 'shadow-rose-900/10',
    success: 'shadow-emerald-900/10'
  }[variant];
  return <div className={`bg-slate-900/50 backdrop-blur-sm border ${borderColor} rounded-xl overflow-hidden shadow-lg ${glowColor} ${className}`} {...props}>
      {(title || icon) && <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            {icon && <span className="text-cyan-400">{icon}</span>}
            <h3 className="font-bold text-slate-200 text-lg">{title}</h3>
          </div>
          {action && <div>{action}</div>}
        </div>}
      <div className="p-6">{children}</div>
    </div>;
}