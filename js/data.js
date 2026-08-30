const POKEMON = [
  "bulbasaur","ivysaur","venusaur","charmander","charmeleon","charizard",
  "squirtle","wartortle","blastoise","caterpie","metapod","butterfree",
  "weedle","kakuna","beedrill","pidgey","pidgeotto","pidgeot",
  "rattata","raticate","spearow","fearow","ekans","arbok",
  "pikachu","raichu","sandshrew","sandslash","nidoran-f","nidorina",
  "nidoqueen","nidoran-m","nidorino","nidoking","clefairy","clefable",
  "vulpix","ninetales","jigglypuff","wigglytuff","zubat","golbat",
  "oddish","gloom","vileplume","paras","parasect","venonat",
  "venomoth","diglett","dugtrio","meowth","persian","psyduck",
  "golduck","mankey","primeape","growlithe","arcanine","poliwag",
  "poliwhirl","poliwrath","abra","kadabra","alakazam","machop",
  "machoke","machamp","bellsprout","weepinbell","victreebel","tentacool",
  "tentacruel","geodude","graveler","golem","ponyta","rapidash",
  "slowpoke","slowbro","magnemite","magneton","farfetchd","doduo",
  "dodrio","seel","dewgong","grimer","muk","shellder",
  "cloyster","gastly","haunter","gengar","onix","drowzee",
  "hypno","krabby","kingler","voltorb","electrode","exeggcute",
  "exeggutor","cubone","marowak","hitmonlee","hitmonchan","lickitung",
  "koffing","weezing","rhyhorn","rhydon","chansey","tangela",
  "kangaskhan","horsea","seadra","goldeen","seaking","staryu",
  "starmie","mr-mime","scyther","jynx","electabuzz","magmar",
  "pinsir","tauros","magikarp","gyarados","lapras","ditto",
  "eevee","vaporeon","jolteon","flareon","porygon","omanyte",
  "omastar","kabuto","kabutops","aerodactyl","snorlax","articuno",
  "zapdos","moltres","dratini","dragonair","dragonite","mewtwo","mew"
];

const TYPES = [
  "Grass/Poison","Grass/Poison","Grass/Poison",
  "Fire","Fire","Fire/Flying",
  "Water","Water","Water",
  "Bug","Bug","Bug/Flying",
  "Bug/Poison","Bug/Poison","Bug/Poison",
  "Normal/Flying","Normal/Flying","Normal/Flying",
  "Normal","Normal",
  "Normal/Flying","Normal/Flying",
  "Poison","Poison",
  "Electric","Electric",
  "Ground","Ground",
  "Poison","Poison","Poison/Ground",
  "Poison","Poison","Poison/Ground",
  "Normal","Normal",
  "Fire","Fire",
  "Normal","Normal",
  "Poison/Flying","Poison/Flying",
  "Grass/Poison","Grass/Poison","Grass/Poison",
  "Bug/Grass","Bug/Grass",
  "Bug/Poison","Bug/Poison",
  "Ground","Ground",
  "Normal","Normal",
  "Water","Water",
  "Fighting","Fighting",
  "Fire","Fire",
  "Water","Water","Water/Fighting",
  "Psychic","Psychic","Psychic",
  "Fighting","Fighting","Fighting",
  "Grass/Poison","Grass/Poison","Grass/Poison",
  "Water/Poison","Water/Poison",
  "Rock/Ground","Rock/Ground","Rock/Ground",
  "Fire","Fire",
  "Water/Psychic","Water/Psychic",
  "Electric","Electric",
  "Normal/Flying",
  "Normal/Flying","Normal/Flying",
  "Water","Water/Ice",
  "Poison","Poison",
  "Water","Water/Ice",
  "Ghost/Poison","Ghost/Poison","Ghost/Poison",
  "Rock/Ground",
  "Psychic","Psychic",
  "Water","Water",
  "Electric","Electric",
  "Grass/Psychic","Grass/Psychic",
  "Ground","Ground",
  "Fighting","Fighting",
  "Normal",
  "Poison","Poison",
  "Ground/Rock","Ground/Rock",
  "Normal",
  "Grass",
  "Normal",
  "Water","Water",
  "Water","Water",
  "Water","Water/Psychic",
  "Psychic",
  "Bug/Flying",
  "Ice/Psychic",
  "Electric",
  "Fire",
  "Bug",
  "Normal",
  "Water","Water/Flying",
  "Water/Ice",
  "Normal",
  "Normal",
  "Water","Electric","Fire",
  "Normal",
  "Rock/Water","Rock/Water",
  "Rock/Water","Rock/Water",
  "Rock/Flying",
  "Normal",
  "Ice/Flying",
  "Electric/Flying",
  "Fire/Flying",
  "Dragon","Dragon","Dragon/Flying",
  "Psychic","Psychic",
];

const ALIASES = {
  "nidoran-f": ["nidoran","nidoran f","nidoran female"],
  "nidoran-m": ["nidoran","nidoran m","nidoran male"],
  "farfetchd":  ["farfetch'd","farfetchd"],
  "mr-mime":    ["mr mime","mr. mime","mrmime"],
};

const DIFF = {
  easy:   { timer: 15, hintCost: 0  },
  normal: { timer: 10, hintCost: 5  },
  hard:   { timer: 8,  hintCost: 10 },
};

const SPRITE_URL      = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_OFFICIAL = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const SPRITE_SHOWDOWN = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
const CRY_LEGACY = id => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${id}.ogg`;
const CRY_LATEST = id => `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

const TYPE_CHART = {
  Normal:   { Fighting:2, Ghost:0 },
  Fire:     { Ground:2, Rock:2, Water:2, Bug:0.5, Steel:0.5, Fire:0.5, Grass:0.5, Ice:0.5, Fairy:0.5 },
  Water:    { Electric:2, Grass:2, Water:0.5, Fire:0.5, Ice:0.5, Steel:0.5 },
  Electric: { Ground:2, Electric:0.5, Flying:0.5, Steel:0.5 },
  Grass:    { Fire:2, Ice:2, Poison:2, Flying:2, Bug:2, Water:0.5, Electric:0.5, Grass:0.5, Ground:0.5 },
  Ice:      { Fire:2, Fighting:2, Rock:2, Steel:2, Ice:0.5 },
  Fighting: { Flying:2, Psychic:2, Fairy:2, Bug:0.5, Rock:0.5, Dark:0.5 },
  Poison:   { Ground:2, Psychic:2, Bug:0.5, Grass:0.5, Fighting:0.5, Poison:0.5, Fairy:0.5 },
  Ground:   { Water:2, Grass:2, Ice:2, Electric:0, Poison:0.5, Rock:0.5 },
  Flying:   { Electric:2, Ice:2, Rock:2, Ground:0, Bug:0.5, Fighting:0.5, Grass:0.5 },
  Psychic:  { Bug:2, Ghost:2, Dark:2, Fighting:0.5, Psychic:0.5 },
  Bug:      { Fire:2, Flying:2, Rock:2, Ground:0.5, Fighting:0.5, Grass:0.5 },
  Rock:     { Water:2, Grass:2, Fighting:2, Ground:2, Steel:2, Normal:0.5, Fire:0.5, Poison:0.5, Flying:0.5 },
  Ghost:    { Ghost:2, Dark:2, Normal:0, Fighting:0 },
  Dragon:   { Ice:2, Dragon:2, Fairy:2, Fire:0.5, Water:0.5, Electric:0.5, Grass:0.5 },
  Dark:     { Fighting:2, Bug:2, Fairy:2, Ghost:0.5, Dark:0.5, Psychic:0 },
  Steel:    { Fire:2, Fighting:2, Ground:2, Normal:0.5, Grass:0.5, Ice:0.5, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:0.5, Dragon:0.5, Steel:0.5, Fairy:0.5, Poison:0, Electric:0.5 },
  Fairy:    { Poison:2, Steel:2, Fighting:0.5, Bug:0.5, Dark:0.5, Dragon:0 },
};

const ALL_ATTACK_TYPES = ['Normal','Fire','Water','Electric','Grass','Ice','Fighting','Poison',
  'Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];

function computeWeaknesses(typeStr) {
  const types = typeStr.split('/');
  const result = {};
  ALL_ATTACK_TYPES.forEach(function(atk) {
    var mult = 1;
    types.forEach(function(def) { mult *= (TYPE_CHART[def] && TYPE_CHART[def][atk] !== undefined ? TYPE_CHART[def][atk] : 1); });
    if (mult !== 1) result[atk] = mult;
  });
  return result;
}

function displayName(name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
