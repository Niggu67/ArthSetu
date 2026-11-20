import { Scheme, LearningModule } from "@/types";
import { Translations } from "@/i18n";

/**
 * Returns a localized representation of a Scheme.
 * Preserves official statutory title, while translating category, description,
 * benefits, and required document checklist according to current language.
 */
export function getLocalizedScheme(scheme: Scheme, t: Translations): Scheme {
  const localData = t.schemesData[scheme.id];
  if (!localData) return scheme;

  return {
    ...scheme,
    name: localData.name || scheme.name,
    category: localData.category || scheme.category,
    description: localData.description || scheme.description,
    benefits: localData.benefits || scheme.benefits,
    required_documents: localData.requiredDocuments || scheme.required_documents,
  };
}

/**
 * Returns a localized list of Schemes.
 */
export function getLocalizedSchemes(schemes: Scheme[], t: Translations): Scheme[] {
  return schemes.map((s) => getLocalizedScheme(s, t));
}

/**
 * Returns a localized LearningModule.
 */
export function getLocalizedModule(module: LearningModule, t: Translations): LearningModule {
  const localData = t.learningData[module.id];
  if (!localData) return module;

  return {
    ...module,
    title: localData.title || module.title,
    category: localData.category || module.category,
    description: localData.description || module.description,
    realWorldExample: localData.realWorldExample || module.realWorldExample,
    keyTakeaway: localData.keyTakeaway || module.keyTakeaway,
  };
}

/**
 * Returns a localized list of LearningModules.
 */
export function getLocalizedModules(modules: LearningModule[], t: Translations): LearningModule[] {
  return modules.map((m) => getLocalizedModule(m, t));
}
