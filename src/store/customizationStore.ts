// src/store/customizationStore.ts
import { create } from 'zustand';
import type {
  Alignment,
  AdvancedCustomization,
  DeviceView,
  GlobalStyle,
  MoveDirection,
  Section,
  SectionConfig,
  SectionType,
} from '@/src/types/customization';
import {
  DEFAULT_DEVICE_VIEW,
  createDefaultLayout,
  defaultAlignmentFor,
  defaultGlobalStyle,
} from '@/src/types/customization';
import { deleteCustomizationLayout, saveCustomizationLayout } from '@/src/actions/customization';

// Re-export (la fuente de verdad vive en src/types/customization.ts)
export { createDefaultLayout, defaultGlobalStyle };

export const HISTORY_LIMIT = 50;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeDeviceView = (value: unknown): DeviceView =>
  value === 'phone' || value === 'tablet' || value === 'desktop'
    ? value
    : DEFAULT_DEVICE_VIEW;

// Convierte lo que llega de la API (Json de Prisma) en un layout válido.
// Si es null / no es objeto / falta algún campo, cae en el default con deviceView 'desktop'.
export const normalizeLayout = (raw: unknown): AdvancedCustomization => {
  const fallback = createDefaultLayout();
  if (!isRecord(raw)) return fallback;

  return {
    version: 1,
    global: isRecord(raw.global)
      ? ({ ...fallback.global, ...raw.global } as GlobalStyle)
      : fallback.global,
    sections: Array.isArray(raw.sections) ? (raw.sections as Section[]) : fallback.sections,
    deviceView: normalizeDeviceView(raw.deviceView),
  };
};

const defaultConfigFor = (type: SectionType): SectionConfig => {
  switch (type) {
    case 'header':
      return { showLogo: true, layout: 'centered', style: 'classic' };
    case 'category-nav':
      return { style: 'pills', sticky: true, showCount: true };
    case 'menu':
      return {
        layout: 'GRID',
        layoutStyle: 'CLASSIC',
        showImages: true,
        showPrices: true,
        showDescriptions: true,
        columns: 2,
        gap: 'md',
        cardStyle: 'default',
      };
    case 'social':
      return { platforms: [], layout: 'row', iconSize: 'md', showLabels: true };
    case 'text':
      return { body: '', fontSize: 'md', textAlign: 'center', padding: '24px 16px' };
    case 'image':
      return { imageUrl: '', alt: '', opacity: 1, borderRadius: '12px', height: 'md' };
    case 'carousel':
      return {
        autoPlay: true,
        interval: 4000,
        showDots: true,
        showArrows: true,
        perView: 3,
        height: 'sm',
        items: [],
      };
  }
};

const createSection = (type: SectionType, config?: SectionConfig): Section => ({
  id: crypto.randomUUID(),
  type,
  visible: true,
  alignment: defaultAlignmentFor(type),
  config: config ?? defaultConfigFor(type),
});

const mapSection = (
  layout: AdvancedCustomization,
  id: string,
  updater: (section: Section) => Section,
): AdvancedCustomization => ({
  ...layout,
  sections: layout.sections.map((section) => (section.id === id ? updater(section) : section)),
});

const applyChange = (
  state: CustomizationState,
  layoutJson: AdvancedCustomization,
): Partial<CustomizationState> => ({
  layoutJson,
  history: [...state.history, state.layoutJson].slice(-HISTORY_LIMIT),
  future: [],
  dirty: true,
});

export interface CustomizationState {
  layoutJson: AdvancedCustomization;
  storeId: string | null;
  history: AdvancedCustomization[];
  future: AdvancedCustomization[];
  dirty: boolean;
  saving: boolean;
  /** Sección seleccionada en el editor (abre SectionConfigPanel) */
  selectedSectionId: string | null;

  setStoreId: (storeId: string) => void;
  selectSection: (id: string | null) => void;
  setLayoutJson: (layout: unknown) => void;
  /**
   * Carga un layout que el server ya persistió (ej: plantilla aplicada),
   * dejando el estado anterior en el historial para poder deshacerlo (Ctrl+Z).
   * `dirty` queda en false: no hay nada nuevo que guardar.
   */
  stageLayout: (layout: unknown) => void;
  setSectionVisible: (id: string, visible: boolean) => void;
  setSectionAlignment: (id: string, alignment: Alignment) => void;
  updateSectionConfig: (id: string, configPartial: Partial<SectionConfig>) => void;
  addSection: (type: SectionType, config?: SectionConfig) => string;
  removeSection: (id: string) => void;
  moveSection: (id: string, direction: MoveDirection) => void;
  reorderSections: (activeId: string, overId: string) => void;
  setDeviceView: (device: DeviceView) => void;
  setGlobalStyle: <K extends keyof GlobalStyle>(field: K, value: GlobalStyle[K]) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useCustomizationStore = create<CustomizationState>()((set, get) => ({
  layoutJson: createDefaultLayout(),
  storeId: null,
  history: [],
  future: [],
  dirty: false,
  saving: false,
  selectedSectionId: null,

  setStoreId: (storeId) => set({ storeId }),

  selectSection: (id) => set({ selectedSectionId: id }),

  setLayoutJson: (layout) =>
    set({
      layoutJson: normalizeLayout(layout),
      history: [],
      future: [],
      dirty: false,
    }),

  stageLayout: (layout) =>
    set((state) => ({
      layoutJson: normalizeLayout(layout),
      history: [...state.history, state.layoutJson].slice(-HISTORY_LIMIT),
      future: [],
      dirty: false,
      selectedSectionId: null,
    })),

  setSectionVisible: (id, visible) =>
    set((state) => applyChange(state, mapSection(state.layoutJson, id, (s) => ({ ...s, visible })))),

  setSectionAlignment: (id, alignment) =>
    set((state) =>
      applyChange(state, mapSection(state.layoutJson, id, (s) => ({ ...s, alignment }))),
    ),

  updateSectionConfig: (id, configPartial) =>
    set((state) =>
      applyChange(
        state,
        mapSection(state.layoutJson, id, (s) => ({
          ...s,
          config: { ...s.config, ...configPartial } as SectionConfig,
        })),
      ),
    ),

  addSection: (type, config) => {
    const section = createSection(type, config);
    set((state) => ({
      ...applyChange(state, {
        ...state.layoutJson,
        sections: [...state.layoutJson.sections, section],
      }),
      // Seleccionar la nueva sección para configurarla de una vez
      selectedSectionId: section.id,
    }));
    return section.id;
  },

  removeSection: (id) =>
    set((state) => {
      const sections = state.layoutJson.sections.filter((s) => s.id !== id);
      if (sections.length === state.layoutJson.sections.length) return state;
      // Las imágenes de la sección quedan huerfanas; se purgan en el server
      // (saveCustomizationLayout) al guardar, nunca aquí: un undo debe poder
      // restaurar la sección sin que sus imágenes se hayan borrado del bucket.
      const change = applyChange(state, { ...state.layoutJson, sections });
      return state.selectedSectionId === id ? { ...change, selectedSectionId: null } : change;
    }),

  moveSection: (id, direction) =>
    set((state) => {
      const sections = [...state.layoutJson.sections];
      const index = sections.findIndex((s) => s.id === id);
      if (index === -1) return state;

      const isFirst = index === 0;
      const isLast = index === sections.length - 1;
      if ((direction === 'up' || direction === 'start') && isFirst) return state;
      if ((direction === 'down' || direction === 'end') && isLast) return state;

      const [section] = sections.splice(index, 1);
      const target =
        direction === 'up'
          ? index - 1
          : direction === 'down'
            ? index + 1
            : direction === 'start'
              ? 0
              : sections.length;
      sections.splice(target, 0, section);

      return applyChange(state, { ...state.layoutJson, sections });
    }),

  // Reordenación por drag & drop (dnd-kit): mueve `activeId` a la posición de `overId`
  reorderSections: (activeId, overId) =>
    set((state) => {
      const sections = [...state.layoutJson.sections];
      const from = sections.findIndex((s) => s.id === activeId);
      const to = sections.findIndex((s) => s.id === overId);
      if (from === -1 || to === -1 || from === to) return state;

      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);

      return applyChange(state, { ...state.layoutJson, sections });
    }),

  setDeviceView: (device) =>
    set((state) =>
      state.layoutJson.deviceView === device
        ? state
        : applyChange(state, { ...state.layoutJson, deviceView: device }),
    ),

  setGlobalStyle: (field, value) =>
    set((state) =>
      applyChange(state, {
        ...state.layoutJson,
        global: { ...state.layoutJson.global, [field]: value } as GlobalStyle,
      }),
    ),

  undo: () => {
    if (get().history.length === 0) return;
    set((state) => ({
      layoutJson: state.history[state.history.length - 1],
      history: state.history.slice(0, -1),
      future: [state.layoutJson, ...state.future].slice(0, HISTORY_LIMIT),
      dirty: true,
    }));
  },

  redo: () => {
    if (get().future.length === 0) return;
    set((state) => ({
      layoutJson: state.future[0],
      history: [...state.history, state.layoutJson].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
      dirty: true,
    }));
  },

  save: async () => {
    const { storeId, layoutJson, saving } = get();
    if (!storeId || saving) return;

    set({ saving: true });
    try {
      await saveCustomizationLayout(storeId, layoutJson);
      set({ saving: false, dirty: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  reset: async () => {
    const { storeId } = get();
    if (storeId) await deleteCustomizationLayout(storeId);

    set({
      layoutJson: createDefaultLayout(),
      history: [],
      future: [],
      dirty: false,
      saving: false,
    });
  },
}));
