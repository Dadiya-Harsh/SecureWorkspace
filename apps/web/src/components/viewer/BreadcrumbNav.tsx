import React from 'react';
import { useVaultStore } from '../../store/useVaultStore';

export const BreadcrumbNav: React.FC = () => {
  const currentDirectory = useVaultStore((s) => s.currentDirectory);
  const setCurrentDirectory = useVaultStore((s) => s.setCurrentDirectory);

  const parts = currentDirectory ? currentDirectory.split('/').filter(Boolean) : [];

  return (
    <nav className="flex items-center gap-2 text-sm sm:text-base font-medium">
      <button
        onClick={() => setCurrentDirectory('')}
        className={`hover:text-[#14201C] cursor-pointer transition-colors ${
          parts.length === 0 ? 'font-bold text-[#14201C]' : 'text-[#5A6662]'
        }`}
      >
        Vault
      </button>

      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        const subPath = parts.slice(0, index + 1).join('/');

        return (
          <React.Fragment key={subPath}>
            <span className="text-[#8E9A96] select-none">/</span>
            <button
              onClick={() => setCurrentDirectory(subPath)}
              disabled={isLast}
              className={`transition-colors ${
                isLast
                  ? 'font-bold text-[#14201C] cursor-default'
                  : 'text-[#5A6662] hover:text-[#14201C] cursor-pointer'
              }`}
            >
              {part}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
