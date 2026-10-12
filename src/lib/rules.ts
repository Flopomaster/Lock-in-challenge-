import type { StringKey } from '../i18n/strings'
import type { RuleSet, Variant } from '../db/types'

export const RULES: { key: keyof RuleSet; label: StringKey; desc: StringKey }[] = [
  { key: 'dupes', label: 'ruleDupes', desc: 'ruleDupesDesc' },
  { key: 'shiny', label: 'ruleShiny', desc: 'ruleShinyDesc' },
  { key: 'nicknames', label: 'ruleNicknames', desc: 'ruleNicknamesDesc' },
  { key: 'levelCaps', label: 'ruleLevelCaps', desc: 'ruleLevelCapsDesc' },
  { key: 'noItems', label: 'ruleNoItems', desc: 'ruleNoItemsDesc' },
  { key: 'setMode', label: 'ruleSetMode', desc: 'ruleSetModeDesc' },
]

const CLASSIC: RuleSet = { dupes: true, shiny: true, nicknames: true, levelCaps: false, noItems: false, setMode: false }

export const VARIANT_RULES: Record<Variant, RuleSet> = {
  classic: CLASSIC,
  hardcore: { ...CLASSIC, levelCaps: true, noItems: true, setMode: true },
  soullink: CLASSIC,
  custom: CLASSIC,
}

export const VARIANT_LABELS: Record<Variant, StringKey> = {
  classic: 'variantClassic',
  hardcore: 'variantHardcore',
  soullink: 'variantSoullink',
  custom: 'variantCustom',
}
