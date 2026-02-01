'use client';

import { TemplateType, TEMPLATE_META, getOrderedShowcaseMocks } from '@/src/lib/videoShowcaseMockData';

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  const orderedMocks = getOrderedShowcaseMocks();

  return (
    <div className="border-b border-slate-800 px-6 py-3 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {orderedMocks.map((mock) => {
          const meta = TEMPLATE_META[mock.templateType];
          const isSelected = mock.templateType === selectedTemplate;

          return (
            <button
              key={mock.templateType}
              onClick={() => onSelectTemplate(mock.templateType)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isSelected
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }
              `}
              style={{
                borderBottom: isSelected ? `2px solid ${meta.color}` : '2px solid transparent',
              }}
            >
              <span className="text-base">{meta.icon}</span>
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
