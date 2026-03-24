import { cn, sanitizeUrl } from '../../lib/utils';

export default function Avatar({ src, alt, size = 'md', className, verified = false }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className="relative inline-block">
      <div className={cn('rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800', sizes[size], className)}>
        {src ? (
          <img src={sanitizeUrl(src)} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
            {alt?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
