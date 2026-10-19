'use client';

export interface TocItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function TableOfContents({
  items,
  activeId,
  onItemClick,
  className = '',
}: TableOfContentsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={className}>
      <h2 className="text-xl sm:text-[22px] font-semibold text-primary mb-4 font-serif">
        Contents
      </h2>
      <ul className="space-y-2.5">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', `#${item.id}`);
                  }
                  if (onItemClick) {
                    onItemClick(item.id);
                  }
                }}
                className={`block font-serif [text-decoration:none]! no-underline text-[14.5px] sm:text-[15px] leading-snug transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
