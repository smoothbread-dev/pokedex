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

const POKEMON_GEN2 = [
  "chikorita","bayleef","meganium","cyndaquil","quilava","typhlosion",
  "totodile","croconaw","feraligatr","sentret","furret","hoothoot",
  "noctowl","ledyba","ledian","spinarak","ariados","crobat",
  "chinchou","lanturn","pichu","cleffa","igglybuff","togepi",
  "togetic","natu","xatu","mareep","flaaffy","ampharos",
  "bellossom","marill","azumarill","sudowoodo","politoed","hoppip",
  "skiploom","jumpluff","aipom","sunkern","sunflora","yanma",
  "wooper","quagsire","espeon","umbreon","murkrow","slowking",
  "misdreavus","unown","wobbuffet","girafarig","pineco","forretress",
  "dunsparce","gligar","steelix","snubbull","granbull","qwilfish",
  "scizor","shuckle","heracross","sneasel","teddiursa","ursaring",
  "slugma","magcargo","swinub","piloswine","corsola","remoraid",
  "octillery","delibird","mantine","skarmory","houndour","houndoom",
  "kingdra","phanpy","donphan","porygon2","stantler","smeargle",
  "tyrogue","hitmontop","smoochum","elekid","magby","miltank",
  "blissey","raikou","entei","suicune","larvitar","pupitar",
  "tyranitar","lugia","ho-oh","celebi"
];

const TYPES_GEN2 = [
  "Grass","Grass","Grass","Fire","Fire","Fire",
  "Water","Water","Water","Normal","Normal",
  "Normal/Flying","Normal/Flying","Bug/Flying","Bug/Flying",
  "Bug/Poison","Bug/Poison","Poison/Flying",
  "Water/Electric","Water/Electric","Electric","Fairy",
  "Normal/Fairy","Fairy","Fairy/Flying",
  "Psychic/Flying","Psychic/Flying","Electric","Electric","Electric",
  "Grass","Water/Fairy","Water/Fairy","Rock","Water",
  "Grass/Flying","Grass/Flying","Grass/Flying",
  "Normal","Grass","Grass","Bug/Flying",
  "Water/Ground","Water/Ground","Psychic","Dark",
  "Dark/Flying","Water/Psychic","Ghost","Psychic",
  "Psychic","Normal/Psychic","Bug","Bug/Steel",
  "Normal","Ground/Flying","Steel/Ground",
  "Fairy","Fairy","Water/Poison",
  "Bug/Steel","Bug/Rock","Bug/Fighting","Dark/Ice",
  "Normal","Normal","Fire","Fire/Rock",
  "Ice/Ground","Ice/Ground","Water/Rock","Water","Water",
  "Ice/Flying","Water/Flying","Steel/Flying",
  "Dark/Fire","Dark/Fire","Water/Dragon",
  "Ground","Ground","Normal","Normal","Normal",
  "Fighting","Fighting","Ice/Psychic","Electric","Fire",
  "Normal","Normal","Electric","Fire","Water",
  "Rock/Ground","Rock/Ground","Rock/Dark",
  "Psychic/Flying","Fire/Flying","Psychic/Grass",
];

const ALIASES_GEN2 = {
  "ho-oh":    ["ho oh","hooh"],
  "porygon2": ["porygon 2"],
};

const POKEMON_GEN3 = [
  "treecko","grovyle","sceptile","torchic","combusken","blaziken",
  "mudkip","marshtomp","swampert","poochyena","mightyena","zigzagoon",
  "linoone","wurmple","silcoon","beautifly","cascoon","dustox",
  "lotad","lombre","ludicolo","seedot","nuzleaf","shiftry",
  "taillow","swellow","wingull","pelipper","ralts","kirlia",
  "gardevoir","surskit","masquerain","shroomish","breloom","slakoth",
  "vigoroth","slaking","nincada","ninjask","shedinja","whismur",
  "loudred","exploud","makuhita","hariyama","azurill","nosepass",
  "skitty","delcatty","sableye","mawile","aron","lairon",
  "aggron","meditite","medicham","electrike","manectric","plusle",
  "minun","volbeat","illumise","roselia","gulpin","swalot",
  "carvanha","sharpedo","wailmer","wailord","numel","camerupt",
  "torkoal","spoink","grumpig","spinda","trapinch","vibrava",
  "flygon","cacnea","cacturne","swablu","altaria","zangoose",
  "seviper","lunatone","solrock","barboach","whiscash","corphish",
  "crawdaunt","baltoy","claydol","lileep","cradily","anorith",
  "armaldo","feebas","milotic","castform","kecleon","shuppet",
  "banette","duskull","dusclops","tropius","chimecho","absol",
  "wynaut","snorunt","glalie","spheal","sealeo","walrein",
  "clamperl","huntail","gorebyss","relicanth","luvdisc","bagon",
  "shelgon","salamence","beldum","metang","metagross","regirock",
  "regice","registeel","latias","latios","kyogre","groudon",
  "rayquaza","jirachi","deoxys"
];


const TYPES_GEN3 = [
  "Grass","Grass","Grass","Fire","Fire/Fighting","Fire/Fighting",
  "Water","Water/Ground","Water/Ground","Dark","Dark","Normal",
  "Normal","Bug","Bug","Bug/Flying","Bug","Bug/Poison",
  "Water/Grass","Water/Grass","Water/Grass","Grass","Grass/Dark","Grass/Dark",
  "Normal/Flying","Normal/Flying","Water/Flying","Water/Flying","Psychic/Fairy","Psychic/Fairy",
  "Psychic/Fairy","Bug/Water","Bug/Flying","Grass","Grass/Fighting","Normal",
  "Normal","Normal","Bug","Bug/Flying","Bug/Ghost","Normal",
  "Normal","Normal","Fighting","Fighting","Normal/Fairy","Rock",
  "Normal","Normal","Dark/Ghost","Steel/Fairy","Steel/Rock","Steel/Rock",
  "Steel/Rock","Fighting/Psychic","Fighting/Psychic","Electric","Electric","Electric",
  "Electric","Bug","Bug","Grass/Poison","Poison","Poison",
  "Water/Dark","Water/Dark","Water","Water","Fire/Ground","Fire/Ground",
  "Fire","Psychic","Psychic","Normal","Ground","Ground/Dragon",
  "Ground/Dragon","Grass","Grass/Dark","Normal/Flying","Dragon/Flying","Normal",
  "Poison","Rock/Psychic","Rock/Psychic","Water/Ground","Water/Ground","Water",
  "Water/Dark","Ground/Psychic","Ground/Psychic","Rock/Grass","Rock/Grass","Rock/Bug",
  "Rock/Bug","Water","Water","Normal","Normal","Ghost",
  "Ghost","Ghost","Ghost","Grass/Flying","Psychic","Dark",
  "Psychic","Ice","Ice","Ice/Water","Ice/Water","Ice/Water",
  "Water","Water","Water","Water/Rock","Water","Dragon",
  "Dragon","Dragon/Flying","Steel/Psychic","Steel/Psychic","Steel/Psychic","Rock",
  "Ice","Steel","Dragon/Psychic","Dragon/Psychic","Water","Ground",
  "Dragon/Flying","Steel/Psychic","Psychic"
];

const ALIASES_GEN3 = {
  "deoxys": ["deoxys-normal"],
};

const DIFF = {
  beginner: { timer: 0, hintCost: 0, choices: 2 },
  easy:     { timer: 15, hintCost: 0  },
  normal:   { timer: 10, hintCost: 5  },
  hard:     { timer: 6,  hintCost: 10 },
};

const CATEGORIES = {
  1:'Starter',2:'Starter',3:'Starter',4:'Starter',5:'Starter',6:'Starter',
  7:'Starter',8:'Starter',9:'Starter',
  133:'Eeveelution',134:'Eeveelution',135:'Eeveelution',136:'Eeveelution',
  138:'Fossil',139:'Fossil',140:'Fossil',141:'Fossil',142:'Fossil',
  144:'Legendary',145:'Legendary',146:'Legendary',150:'Legendary',
  151:'Mythical',
  152:'Starter',153:'Starter',154:'Starter',155:'Starter',156:'Starter',157:'Starter',
  158:'Starter',159:'Starter',160:'Starter',
  172:'Baby',173:'Baby',174:'Baby',175:'Baby',236:'Baby',238:'Baby',239:'Baby',240:'Baby',
  196:'Eeveelution',197:'Eeveelution',
  243:'Legendary',244:'Legendary',245:'Legendary',249:'Legendary',250:'Legendary',
  251:'Mythical',
  252:'Starter',253:'Starter',254:'Starter',255:'Starter',256:'Starter',257:'Starter',
  258:'Starter',259:'Starter',260:'Starter',
  345:'Fossil',346:'Fossil',347:'Fossil',348:'Fossil',
  377:'Legendary',378:'Legendary',379:'Legendary',
  380:'Legendary',381:'Legendary',
  382:'Legendary',383:'Legendary',384:'Legendary',
  385:'Mythical',386:'Mythical',
};

function getCategory(id) {
  if (CATEGORIES[id]) return CATEGORIES[id] + ' Pokémon';
  if (id <= 151) return 'Kanto Pokémon';
  if (id <= 251) return 'Johto Pokémon';
  return 'Hoenn Pokémon';
}

const SPRITE_URL      = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_OFFICIAL = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const SPRITE_SHOWDOWN = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
const SPRITE_URL_SHINY      = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
const SPRITE_OFFICIAL_SHINY = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
const SPRITE_SHOWDOWN_SHINY = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${id}.gif`;
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
