// Round themes. Each pack is a question the room answers ("Best pregame song?")
// plus a pool of songs. Songs are resolved to previews + artwork at game time.
// Chart packs pull live from Deezer's charts instead of a fixed list.

const L = (s) => s.trim().split('\n').map((l) => l.split(' - ')).map(([artist, ...t]) => [artist.trim(), t.join(' - ').trim()]);

export const PACKS = [
  {
    id: 'pregame', emoji: '🔥', name: 'Pregame Hype', question: 'Best pregame song?',
    desc: 'Get-ready-to-go-out energy',
    songs: L(`
Kanye West - Power
Kendrick Lamar - HUMBLE.
Travis Scott - SICKO MODE
Eminem - Lose Yourself
Drake - Started From the Bottom
Lil Jon - Get Low
Migos - Bad and Boujee
DJ Khaled - All I Do Is Win
Cardi B - Bodak Yellow
Megan Thee Stallion - Savage
Future - Mask Off
50 Cent - In da Club
Jay-Z - Empire State of Mind
Beyoncé - Formation
Lizzo - Juice
Calvin Harris - Feel So Close
Martin Garrix - Animals
Avicii - Levels
The Weeknd - Can't Feel My Face
Dua Lipa - Don't Start Now
Doja Cat - Say So
Lil Nas X - INDUSTRY BABY
Kanye West - Stronger
Missy Elliott - Work It`),
  },
  {
    id: 'hiphop', emoji: '🎤', name: 'Hip-Hop Heavyweights', question: 'Best rap song?',
    desc: 'Drake, Kanye, 50, Kendrick, Cole, Travis & friends',
    songs: L(`
Drake - God's Plan
Drake - Hotline Bling
Drake - One Dance
Drake - Passionfruit
Kanye West - Gold Digger
Kanye West - Heartless
Kanye West - Flashing Lights
Kanye West - Jesus Walks
50 Cent - Candy Shop
50 Cent - P.I.M.P.
50 Cent - 21 Questions
Kendrick Lamar - DNA.
Kendrick Lamar - Alright
Kendrick Lamar - Swimming Pools (Drank)
Kendrick Lamar - Money Trees
J. Cole - No Role Modelz
J. Cole - Middle Child
J. Cole - Work Out
Travis Scott - goosebumps
Travis Scott - HIGHEST IN THE ROOM
Travis Scott - FE!N
Eminem - The Real Slim Shady
Jay-Z - 99 Problems
Nas - N.Y. State of Mind
Tyler, The Creator - EARFQUAKE`),
  },
  {
    id: 'roadtrip', emoji: '🚗', name: 'Road Trip Singalongs', question: 'Best song to scream in the car?',
    desc: 'Everybody knows the words',
    songs: L(`
Queen - Bohemian Rhapsody
Journey - Don't Stop Believin'
Bon Jovi - Livin' on a Prayer
Fleetwood Mac - Dreams
John Denver - Take Me Home, Country Roads
Tom Petty - Free Fallin'
The Killers - Mr. Brightside
Oasis - Wonderwall
Bruce Springsteen - Born to Run
Eagles - Hotel California
Lynyrd Skynyrd - Sweet Home Alabama
Toto - Africa
Guns N' Roses - Sweet Child O' Mine
Neil Diamond - Sweet Caroline
Backstreet Boys - I Want It That Way
Shania Twain - Man! I Feel Like A Woman!
Whitney Houston - I Wanna Dance with Somebody
Elton John - Rocket Man
Fall Out Boy - Sugar, We're Goin Down
Taylor Swift - Shake It Off
Lizzo - Good as Hell
Lady Gaga - Bad Romance`),
  },
  {
    id: 'y2k', emoji: '📀', name: 'Throwback 2000s', question: 'Best 2000s banger?',
    desc: 'Middle school dance energy',
    songs: L(`
Outkast - Hey Ya!
Beyoncé - Crazy in Love
Usher - Yeah!
Black Eyed Peas - I Gotta Feeling
Rihanna - Umbrella
Nelly - Hot In Herre
Ludacris - Stand Up
Gwen Stefani - Hollaback Girl
Kelly Clarkson - Since U Been Gone
Fall Out Boy - Dance, Dance
Green Day - American Idiot
Linkin Park - In the End
Evanescence - Bring Me To Life
Justin Timberlake - SexyBack
Akon - Smack That
T.I. - Whatever You Like
Lil Wayne - Lollipop
Shakira - Hips Don't Lie
Mariah Carey - We Belong Together
Amy Winehouse - Rehab
MGMT - Kids
Ne-Yo - So Sick
Sean Kingston - Beautiful Girls`),
  },
  {
    id: '90s', emoji: '📼', name: '90s Nostalgia', question: 'Best 90s classic?',
    desc: 'Boy bands, G-funk, grunge',
    songs: L(`
Nirvana - Smells Like Teen Spirit
TLC - No Scrubs
Spice Girls - Wannabe
Backstreet Boys - Everybody (Backstreet's Back)
*NSYNC - Bye Bye Bye
Britney Spears - ...Baby One More Time
2Pac - California Love
The Notorious B.I.G. - Juicy
Dr. Dre - Nuthin' But A "G" Thang
Coolio - Gangsta's Paradise
Lauryn Hill - Doo Wop (That Thing)
Destiny's Child - Say My Name
Aqua - Barbie Girl
Ace of Base - The Sign
Smash Mouth - All Star
Alanis Morissette - You Oughta Know
Radiohead - Creep
Blur - Song 2
Montell Jordan - This Is How We Do It
Salt-N-Pepa - Push It
Snoop Dogg - Gin and Juice
Cher - Believe
Hanson - MMMBop
Eiffel 65 - Blue (Da Ba Dee)`),
  },
  {
    id: 'nightdrive', emoji: '🌙', name: 'Late Night Drive', question: 'Best song for a late night drive?',
    desc: 'Moody, smooth, windows down',
    songs: L(`
The Weeknd - Blinding Lights
The Weeknd - Starboy
Frank Ocean - Nights
Kavinsky - Nightcall
Tame Impala - The Less I Know The Better
Daft Punk - Instant Crush
Post Malone - Circles
SZA - Snooze
Childish Gambino - Redbone
Bruno Mars - Locked out of Heaven
The Neighbourhood - Sweater Weather
Arctic Monkeys - Do I Wanna Know?
Khalid - Location
Lorde - Royals
Joji - Slow Dancing in the Dark
Billie Eilish - bad guy
Glass Animals - Heat Waves
Mac Miller - Self Care
Kanye West - Runaway
Kid Cudi - Day 'N' Nite
Don Toliver - No Idea`),
  },
  {
    id: 'gym', emoji: '💪', name: 'Gym Beast Mode', question: 'Best workout song?',
    desc: 'Heavy, fast, loud',
    songs: L(`
Eminem - Till I Collapse
Survivor - Eye of the Tiger
Metallica - Enter Sandman
Rage Against The Machine - Killing In the Name
DMX - X Gon' Give It To Ya
Lil Wayne - A Milli
Kendrick Lamar - Backseat Freestyle
Pop Smoke - Dior
21 Savage - a lot
Cardi B - I Like It
David Guetta - Titanium
Swedish House Mafia - Don't You Worry Child
The Prodigy - Firestarter
Linkin Park - Faint
AC/DC - Thunderstruck
Queen - We Will Rock You
Meek Mill - Dreams and Nightmares
Nas - Made You Look
Gucci Mane - Lemonade
Run The Jewels - Legend Has It`),
  },
  {
    id: 'heartbreak', emoji: '💔', name: 'Heartbreak Hotel', question: 'Best breakup song?',
    desc: 'Cry in the shower tunes',
    songs: L(`
Adele - Someone Like You
Adele - Rolling in the Deep
Taylor Swift - All Too Well
Olivia Rodrigo - drivers license
Sam Smith - Stay With Me
Whitney Houston - I Will Always Love You
Gotye - Somebody That I Used To Know
Drake - Marvins Room
Frank Ocean - Thinking Bout You
SZA - Kill Bill
Billie Eilish - when the party's over
Lewis Capaldi - Someone You Loved
The Weeknd - Call Out My Name
Alicia Keys - If I Ain't Got You
Beyoncé - Irreplaceable
Fleetwood Mac - Go Your Own Way
Mary J. Blige - Not Gon' Cry
Miley Cyrus - Flowers
Bruno Mars - When I Was Your Man
Coldplay - Fix You`),
  },
  {
    id: 'summer', emoji: '☀️', name: 'Summer Anthems', question: 'Best summer song?',
    desc: 'Sun, sand, speakers',
    songs: L(`
Pharrell Williams - Happy
Dua Lipa - Levitating
Harry Styles - As It Was
Katy Perry - California Gurls
DJ Jazzy Jeff & The Fresh Prince - Summertime
Sublime - What I Got
Justin Timberlake - CAN'T STOP THE FEELING!
Daft Punk - Get Lucky
Luis Fonsi - Despacito
Bad Bunny - Tití Me Preguntó
Shakira - Waka Waka (This Time for Africa)
Calvin Harris - This Is What You Came For
Ed Sheeran - Shape of You
Lil Nas X - Old Town Road
Rihanna - Work
Bob Marley & The Wailers - Three Little Birds
Jack Johnson - Banana Pancakes
Wiz Khalifa - Black and Yellow
Mark Ronson - Uptown Funk
Doja Cat - Woman
Kygo - Firestone`),
  },
  {
    id: 'karaoke', emoji: '🎙️', name: 'Karaoke Classics', question: 'Best karaoke song?',
    desc: 'The ones you will absolutely attempt',
    songs: L(`
ABBA - Dancing Queen
Queen - Don't Stop Me Now
Elton John - Tiny Dancer
Frank Sinatra - My Way
Aretha Franklin - Respect
Cyndi Lauper - Girls Just Want to Have Fun
Prince - Purple Rain
Michael Jackson - Billie Jean
Michael Jackson - Don't Stop 'Til You Get Enough
Madonna - Like a Prayer
Céline Dion - My Heart Will Go On
Meat Loaf - I'd Do Anything For Love (But I Won't Do That)
Kelly Clarkson - Stronger (What Doesn't Kill You)
Ricky Martin - Livin' la Vida Loca
Blondie - Heart Of Glass
Pat Benatar - Love Is a Battlefield
Billy Joel - Piano Man
Bee Gees - Stayin' Alive
Stevie Wonder - Superstition
Lionel Richie - All Night Long (All Night)
Rick Astley - Never Gonna Give You Up
Tina Turner - Proud Mary`),
  },
  // Live Deezer charts: always fresh, wide open.
  { id: 'chart-all', emoji: '📈', name: 'Top Charts (live)', question: 'Best song on the charts right now?', desc: 'Whatever is hot this week', chart: 0 },
  { id: 'chart-rap', emoji: '📈', name: 'Rap Charts (live)', question: 'Best rap song on the charts?', desc: 'Current hip-hop top tracks', chart: 116 },
  { id: 'chart-pop', emoji: '📈', name: 'Pop Charts (live)', question: 'Best pop song on the charts?', desc: 'Current pop top tracks', chart: 132 },
  { id: 'chart-rock', emoji: '📈', name: 'Rock Charts (live)', question: 'Best rock song on the charts?', desc: 'Current rock top tracks', chart: 152 },
  { id: 'chart-rnb', emoji: '📈', name: 'R&B Charts (live)', question: 'Best R&B song on the charts?', desc: 'Current R&B top tracks', chart: 165 },
  { id: 'chart-dance', emoji: '📈', name: 'Dance Charts (live)', question: 'Best dance track on the charts?', desc: 'Current dance top tracks', chart: 113 },
];

export const packById = (id) => PACKS.find((p) => p.id === id);
export const DEFAULT_PACKS = PACKS.filter((p) => !p.chart).map((p) => p.id);
