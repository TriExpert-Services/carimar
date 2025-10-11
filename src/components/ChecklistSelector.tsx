import { useState, useEffect } from 'react';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ChecklistTemplateWithItems, ChecklistFrequency } from '../utils/checklistHelpers';
import { getChecklistTemplates } from '../utils/checklistHelpers';
import { useLanguage } from '../contexts/LanguageContext';

interface ChecklistSelectorProps {
  serviceType: string;
  frequency: ChecklistFrequency;
  selectedItems: string[];
  onSelectionChange: (selectedItemIds: string[]) => void;
}

export const ChecklistSelector = ({
  serviceType,
  frequency,
  selectedItems,
  onSelectionChange,
}: ChecklistSelectorProps) => {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState<ChecklistTemplateWithItems[]>([]);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [serviceType, frequency]);

  const loadTemplates = async () => {
    if (!serviceType) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getChecklistTemplates(serviceType, frequency);
    setTemplates(data);

    if (data.length > 0) {
      setExpandedTemplates(new Set(data.map(t => t.id)));
    }

    setLoading(false);
  };

  const toggleTemplate = (templateId: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newSelected = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelected);
  };

  const toggleAllInTemplate = (template: ChecklistTemplateWithItems) => {
    const templateItemIds = template.items.map(item => item.id);
    const allSelected = templateItemIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      onSelectionChange(selectedItems.filter(id => !templateItemIds.includes(id)));
    } else {
      const newSelected = [...new Set([...selectedItems, ...templateItemIds])];
      onSelectionChange(newSelected);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading checklist...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <p className="text-gray-600">
          {serviceType
            ? 'No checklist available for this service type.'
            : 'Please select a service type first to see available checklists.'}
        </p>
      </div>
    );
  }

  const totalItems = templates.reduce((sum, t) => sum + t.items.length, 0);
  const selectedCount = selectedItems.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Services Needed</h3>
          <p className="text-sm text-gray-600">
            Choose the specific tasks you want included in your service
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-emerald-600">
            {selectedCount} of {totalItems} selected
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {templates.map((template) => {
          const templateItemIds = template.items.map(item => item.id);
          const templateSelectedCount = templateItemIds.filter(id =>
            selectedItems.includes(id)
          ).length;
          const allSelected = templateItemIds.length === templateSelectedCount;
          const isExpanded = expandedTemplates.has(template.id);

          return (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleTemplate(template.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllInTemplate(template);
                    }}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      allSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : templateSelectedCount > 0
                        ? 'bg-emerald-200 border-emerald-400'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {allSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    {templateSelectedCount > 0 && !allSelected && (
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    )}
                  </button>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {language === 'en' ? template.name_en : template.name_es}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {templateSelectedCount} of {template.items.length} selected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    {template.room_type}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-2">
                    {template.items.map((item) => {
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.id)}
                            className="mt-0.5 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                              {language === 'en' ? item.name_en : item.name_es}
                              {item.is_required && (
                                <span className="ml-1 text-red-500 text-sm">*</span>
                              )}
                            </p>
                            {(item.description_en || item.description_es) && (
                              <p className="text-sm text-gray-600 mt-1">
                                {language === 'en' ? item.description_en : item.description_es}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Please select at least one service task to proceed with your quote.
          </p>
        </div>
      )}
    </div>
  );
};
