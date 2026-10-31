export const SCENES = [
  { id: 'chat', label: 'Chat', fields: [{ key: 'chat', label: 'Message', rows: 3 }] },
  { id: 'title', label: 'Title', fields: [{ key: 'title', label: 'Title', rows: 2 }, { key: 'subtitle', label: 'Subtitle', rows: 2 }] },
  { id: 'actionbar', label: 'Action bar', fields: [{ key: 'actionbar', label: 'Message', rows: 2 }] },
  { id: 'item', label: 'Item', fields: [{ key: 'itemName', label: 'Name', rows: 1 }, { key: 'itemLore', label: 'Lore (one line each)', rows: 4 }] },
  { id: 'bossbar', label: 'Boss bar', fields: [{ key: 'bossbar', label: 'Title', rows: 2 }] },
  { id: 'sidebar', label: 'Sidebar', fields: [{ key: 'sidebarTitle', label: 'Title', rows: 1 }, { key: 'sidebarLines', label: 'Lines (one per line)', rows: 5 }] },
]

export const DEFAULT_TEXTS = {
  chat: "<gradient:#ff5555:#ffaa00><bold>TINYTAG</bold></gradient> <dark_gray>»</dark_gray> <gray>Welcome back, <white>Steve</white>! <hover:show_text:'<green>Opens the server rules'><click:open_url:https://example.com/rules><aqua><u>Read the rules</u></aqua></click></hover>",
  title: '<gradient:#00c6ff:#0072ff><bold>Welcome</bold></gradient>',
  subtitle: '<gray>to <rainbow>TinyTag</rainbow> <dark_gray>·</dark_gray> <yellow>have fun!',
  actionbar: '<red>❤ 20</red> <dark_gray>|</dark_gray> <gradient:#55ff55:#00aa00>Level up soon</gradient>',
  itemName: '<!italic><gradient:#ffd700:#ff8c00><bold>Sunfire Blade</bold></gradient>',
  itemLore: '<!italic><gray>A sword forged in sunlight.\n<!italic><gray>Damage: <red>+12\n<!italic><gray>Rarity: <gradient:#ff55ff:#ffaa00>LEGENDARY</gradient>',
  bossbar: '<gradient:#ff5555:#aa0000><bold>Ender Dragon</bold></gradient> <gray>- <white>70%',
  sidebarTitle: '<gradient:#ffaa00:#ff5555><bold>TINYTAG</bold></gradient>',
  sidebarLines: '<gray>Rank: <gold>VIP\n<gray>Coins: <yellow>1,250\n\n<aqua>play.example.com',
}

export const MESSAGE_PRESETS = [
  { name: 'Server prefix', text: '<gradient:#ff5555:#ffaa00><bold>MYSERVER</bold></gradient> <dark_gray>»</dark_gray> <gray>Welcome back, <white>Steve</white>!' },
  { name: 'Rainbow', text: '<rainbow>Every color of the rainbow</rainbow>' },
  { name: 'Fire', text: '<gradient:#ff0000:#ffaa00:#ffff55>Burning bright</gradient>' },
  { name: 'Ocean', text: '<gradient:#00c6ff:#0072ff>Deep blue sea</gradient>' },
  { name: 'Candy', text: '<gradient:#ff6ad5:#c774e8:#94d0ff><bold>Sweet as candy</bold></gradient>' },
  { name: 'Hover & click', text: "<hover:show_text:'<green>Opens the wiki'><click:open_url:https://example.com><aqua><u>Click me</u></aqua></click></hover> for help" },
  { name: 'Obfuscated', text: '<gold>Secret code: <obf>abcdefgh</obf>' },
  { name: 'Legacy codes', legacy: true, text: '&6&lGold bold &r&7then gray &#ff5555hex red &x&5&5&5&5&f&fbungee blue' },
  { name: 'Transition', text: '<transition:#ff0000:#00ff00:#0000ff:0.5>One color picked from a transition</transition>' },
]

export const GRADIENT_PRESETS = [
  { name: 'Fire', stops: ['#ff0000', '#ffaa00', '#ffff55'] },
  { name: 'Ocean', stops: ['#00c6ff', '#0072ff'] },
  { name: 'Sunset', stops: ['#ff512f', '#dd2476'] },
  { name: 'Mint', stops: ['#00b09b', '#96c93d'] },
  { name: 'Gold', stops: ['#ffd700', '#ff8c00'] },
  { name: 'Candy', stops: ['#ff6ad5', '#c774e8', '#94d0ff'] },
]

export const BOSS_COLOR_OPTIONS = ['pink', 'blue', 'red', 'green', 'yellow', 'purple', 'white'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
export const BOSS_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'notched_6', label: '6 segments' },
  { value: 'notched_10', label: '10 segments' },
  { value: 'notched_12', label: '12 segments' },
  { value: 'notched_20', label: '20 segments' },
]
export const BACKGROUND_OPTIONS = [
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
  { id: 'dark', label: 'Dirt' },
  { id: 'black', label: 'Black' },
]
