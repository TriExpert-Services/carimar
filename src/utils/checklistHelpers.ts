import { supabase } from '../lib/supabase';
import {
  ChecklistTemplate,
  ChecklistItem,
  QuoteChecklistSelection,
  BookingChecklistCompletion,
  ChecklistFrequency,
} from '../types';

export interface ChecklistTemplateWithItems extends ChecklistTemplate {
  items: ChecklistItem[];
}

export const getChecklistTemplates = async (
  serviceType: string,
  frequency: ChecklistFrequency | 'all' = 'all'
): Promise<ChecklistTemplateWithItems[]> => {
  try {
    let query = supabase
      .from('checklist_templates')
      .select('*')
      .eq('active', true)
      .eq('service_type', serviceType);

    if (frequency !== 'all') {
      query = query.or(`frequency.eq.${frequency},frequency.eq.all`);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return [];
    }

    if (!templates || templates.length === 0) return [];

    const templatesWithItems = await Promise.all(
      templates.map(async (template) => {
        const { data: items, error: itemsError } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('template_id', template.id)
          .order('order_index', { ascending: true });

        if (itemsError) {
          console.error('Error fetching items:', itemsError);
          return { ...template, items: [] };
        }

        return { ...template, items: items || [] };
      })
    );

    return templatesWithItems as ChecklistTemplateWithItems[];
  } catch (error) {
    console.error('Error in getChecklistTemplates:', error);
    return [];
  }
};

export const saveQuoteChecklistSelections = async (
  quoteId: string,
  selections: { checklistItemId: string; notes?: string }[]
): Promise<boolean> => {
  try {
    const records = selections.map((sel) => ({
      quote_id: quoteId,
      checklist_item_id: sel.checklistItemId,
      selected: true,
      notes: sel.notes,
    }));

    const { error } = await supabase.from('quote_checklist_selections').insert(records);

    if (error) {
      console.error('Error saving checklist selections:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveQuoteChecklistSelections:', error);
    return false;
  }
};

export const getQuoteChecklistSelections = async (
  quoteId: string
): Promise<QuoteChecklistSelection[]> => {
  const { data, error } = await supabase
    .from('quote_checklist_selections')
    .select('*')
    .eq('quote_id', quoteId);

  if (error) {
    console.error('Error fetching quote selections:', error);
    return [];
  }

  return data || [];
};

export const createBookingChecklist = async (bookingId: string, quoteId: string): Promise<boolean> => {
  try {
    const selections = await getQuoteChecklistSelections(quoteId);

    if (selections.length === 0) return true;

    const checklistRecords = selections.map((sel) => ({
      booking_id: bookingId,
      checklist_item_id: sel.checklist_item_id,
      completed: false,
    }));

    const { error } = await supabase.from('booking_checklist_completion').insert(checklistRecords);

    if (error) {
      console.error('Error creating booking checklist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createBookingChecklist:', error);
    return false;
  }
};

export const getBookingChecklistWithItems = async (bookingId: string) => {
  try {
    const { data: completions, error } = await supabase
      .from('booking_checklist_completion')
      .select('*')
      .eq('booking_id', bookingId);

    if (error) {
      console.error('Error fetching booking checklist:', error);
      return [];
    }

    if (!completions || completions.length === 0) return [];

    const itemIds = completions.map((c) => c.checklist_item_id);
    const { data: items, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*')
      .in('id', itemIds);

    if (itemsError) {
      console.error('Error fetching checklist items:', itemsError);
      return [];
    }

    const result = completions.map((completion) => {
      const item = items?.find((i) => i.id === completion.checklist_item_id);
      return {
        ...completion,
        item,
      };
    });

    return result;
  } catch (error) {
    console.error('Error in getBookingChecklistWithItems:', error);
    return [];
  }
};

export const updateChecklistItem = async (
  completionId: string,
  updates: {
    completed?: boolean;
    employee_notes?: string;
    quality_rating?: number;
  }
): Promise<boolean> => {
  try {
    const updateData: any = { ...updates };
    if (updates.completed !== undefined && updates.completed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('booking_checklist_completion')
      .update(updateData)
      .eq('id', completionId);

    if (error) {
      console.error('Error updating checklist item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateChecklistItem:', error);
    return false;
  }
};

export const getChecklistProgress = async (
  bookingId: string
): Promise<{ total: number; completed: number; percentage: number }> => {
  try {
    const { data, error } = await supabase
      .from('booking_checklist_completion')
      .select('completed')
      .eq('booking_id', bookingId);

    if (error || !data) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    const total = data.length;
    const completed = data.filter((item) => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  } catch (error) {
    console.error('Error in getChecklistProgress:', error);
    return { total: 0, completed: 0, percentage: 0 };
  }
};

export const isChecklistComplete = async (bookingId: string): Promise<boolean> => {
  const progress = await getChecklistProgress(bookingId);
  return progress.percentage === 100 && progress.total > 0;
};
