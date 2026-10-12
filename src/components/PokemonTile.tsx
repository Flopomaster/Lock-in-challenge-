import { getSpecies, typesInGen } from '../data/pokedex'
import { displayName } from '../db/repository'
import type { Encounter } from '../db/types'
import { useT } from '../lib/settings'
import type { SpriteStyle } from '../lib/sprites'
import Sprite from './Sprite'
import { TypeBadge } from './ui'

export default function PokemonTile({ encounter, style, onClick }: { encounter: Encounter; style: SpriteStyle; onClick?: () => void }) {
  const t = useT()
  const species = getSpecies(encounter.speciesId)
  return (
    <button type="button" onClick={onClick} className="card flex flex-col items-center px-2 pb-2.5 pt-1.5 text-center transition active:scale-[0.97]">
      <div className="relative">
        <Sprite id={encounter.speciesId} style={style} size={68} shiny={encounter.shiny} />
        {encounter.shiny && <span className="absolute -top-0.5 end-0 text-xs">✨</span>}
      </div>
      <div className="w-full truncate text-sm font-bold">
        <bdi>{displayName(encounter)}</bdi>
      </div>
      <div className="text-[11px] text-text-dim">
        {encounter.level ? `${t('lv')} ${encounter.level}` : species?.name}
        {encounter.gender === 'm' && ' ♂'}
        {encounter.gender === 'f' && ' ♀'}
      </div>
      {species && (
        <div className="mt-1 flex gap-0.5">
          {typesInGen(species, style.gen).map((ty) => (
            <TypeBadge key={ty} type={ty} small />
          ))}
        </div>
      )}
    </button>
  )
}
