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
  {
    id: '80s', emoji: '🕹️', name: '80s Throwback', question: 'Best 80s song?', desc: 'Synths, big hair, big hooks',
    songs: L(`
Michael Jackson - Thriller
Michael Jackson - Beat It
Prince - Kiss
Madonna - Material Girl
a-ha - Take On Me
Whitney Houston - How Will I Know
Cyndi Lauper - Time After Time
Duran Duran - Hungry Like the Wolf
Tears for Fears - Everybody Wants To Rule The World
Phil Collins - In the Air Tonight
Wham! - Wake Me Up Before You Go-Go
The Police - Every Breath You Take
Eurythmics - Sweet Dreams (Are Made Of This)
Kenny Loggins - Danger Zone
Run-D.M.C. - Walk This Way
Queen - Another One Bites the Dust
Def Leppard - Pour Some Sugar On Me
Rick Springfield - Jessie's Girl
Billy Idol - White Wedding
Culture Club - Karma Chameleon
Hall & Oates - Maneater`),
  },
  {
    id: '2010s', emoji: '📱', name: '2010s Bangers', question: 'Best 2010s hit?', desc: 'Radio hits from the streaming era',
    songs: L(`
Rihanna - We Found Love
Ed Sheeran - Thinking out Loud
Taylor Swift - Blank Space
Katy Perry - Roar
Adele - Hello
Fetty Wap - Trap Queen
Justin Bieber - Sorry
The Chainsmokers - Closer
Imagine Dragons - Radioactive
Maroon 5 - Sugar
Ariana Grande - 7 rings
Post Malone - rockstar
Lil Uzi Vert - XO Tour Llif3
Sia - Chandelier
Pitbull - Timber
PSY - Gangnam Style
Macklemore & Ryan Lewis - Can't Hold Us
Shawn Mendes - Treat You Better
Selena Gomez - Good for You
Halsey - Without Me
Drake - Hotline Bling
The Weeknd - Can't Feel My Face`),
  },
  {
    id: 'slowjams', emoji: '🕯️', name: 'Slow Jams', question: 'Best slow jam?', desc: 'R&B for the smooth hours',
    songs: L(`
Marvin Gaye - Sexual Healing
Boyz II Men - I'll Make Love To You
Sade - Smooth Operator
Luther Vandross - Never Too Much
Aaliyah - Are You That Somebody?
Brandy - Sittin' Up In My Room
Jodeci - Forever My Lady
Maxwell - Ascension (Don't Ever Wonder)
D'Angelo - Untitled (How Does It Feel)
Alicia Keys - Fallin'
Anita Baker - Sweet Love
SZA - Good Days
Daniel Caesar - Best Part
H.E.R. - Focus
Summer Walker - Playing Games
Ne-Yo - Because Of You
Jhené Aiko - The Worst
Beyoncé - Drunk in Love
Toni Braxton - Un-Break My Heart
Usher - You Make Me Wanna...`),
  },
  {
    id: 'country', emoji: '🤠', name: 'Country Roads', question: 'Best country song?', desc: 'Twang, trucks and heartbreak',
    songs: L(`
Johnny Cash - Ring of Fire
Dolly Parton - Jolene
Garth Brooks - Friends In Low Places
Luke Combs - Beautiful Crazy
Morgan Wallen - Last Night
Chris Stapleton - Tennessee Whiskey
Zach Bryan - Something in the Orange
Carrie Underwood - Before He Cheats
Tim McGraw - Humble And Kind
Luke Bryan - Country Girl (Shake It For Me)
Florida Georgia Line - Cruise
Alan Jackson - Chattahoochee
Willie Nelson - On the Road Again
Taylor Swift - Love Story
Blake Shelton - Honey Bee
Jason Aldean - Dirt Road Anthem
Kacey Musgraves - Rainbow
Lainey Wilson - Heart Like A Truck
Brooks & Dunn - Boot Scootin' Boogie`),
  },
  {
    id: 'rock', emoji: '🎸', name: 'Rock Anthems', question: 'Best rock song ever?', desc: 'Riffs, guitars, air-guitar moments',
    songs: L(`
Led Zeppelin - Stairway to Heaven
AC/DC - Back In Black
Foo Fighters - Everlong
Red Hot Chili Peppers - Under the Bridge
Pearl Jam - Alive
Metallica - Master of Puppets
Green Day - Basket Case
blink-182 - All The Small Things
The White Stripes - Seven Nation Army
Arctic Monkeys - R U Mine?
Muse - Uprising
Paramore - Misery Business
My Chemical Romance - Welcome to the Black Parade
Pink Floyd - Another Brick in the Wall, Pt. 2
The Rolling Stones - Paint It, Black
The Who - Baba O'Riley
Deep Purple - Smoke on the Water
Van Halen - Jump
Aerosmith - Dream On
Kings of Leon - Sex on Fire`),
  },
  {
    id: 'latin', emoji: '💃', name: 'Latin Heat', question: 'Best Latin banger?', desc: 'Reggaeton, pop and classics',
    songs: L(`
Bad Bunny - DÁKITI
Daddy Yankee - Gasolina
Shakira - Whenever, Wherever
J Balvin - Mi Gente
KAROL G - TUSA
ROSALÍA - DESPECHÁ
Maluma - Felices los 4
Enrique Iglesias - Bailando
Marc Anthony - Vivir Mi Vida
Selena - Bidi Bidi Bom Bom
Celia Cruz - La Vida Es Un Carnaval
Santana - Smooth
Jennifer Lopez - On The Floor
Camila Cabello - Havana
Peso Pluma - Ella Baila Sola
Anitta - Envolver
Wisin & Yandel - Rakata
Don Omar - Danza Kuduro
Bad Bunny - Me Porto Bonito
Nicky Jam - El Perdón`),
  },
  {
    id: 'onehit', emoji: '🦄', name: 'One-Hit Wonders', question: 'Best one-hit wonder?', desc: 'They only needed one',
    songs: L(`
The Knack - My Sharona
Soft Cell - Tainted Love
Los del Río - Macarena (Bayside Boys Mix)
Chumbawamba - Tubthumping
Vanilla Ice - Ice Ice Baby
Technotronic - Pump Up The Jam
Baha Men - Who Let The Dogs Out
Right Said Fred - I'm Too Sexy
Sir Mix-A-Lot - Baby Got Back
Spin Doctors - Two Princes
Tommy Tutone - 867-5309 / Jenny
Dexys Midnight Runners - Come On Eileen
OMI - Cheerleader
Carl Douglas - Kung Fu Fighting
Lou Bega - Mambo No. 5 (A Little Bit of...)
Haddaway - What Is Love
Natalie Imbruglia - Torn
Fountains Of Wayne - Stacy's Mom
Gotye - Somebody That I Used To Know`),
  },
  {
    id: 'guilty', emoji: '🙈', name: 'Guilty Pleasures', question: 'Best guilty-pleasure song?', desc: 'Admit you know every word',
    songs: L(`
Britney Spears - Toxic
Miley Cyrus - Party In The U.S.A.
Carly Rae Jepsen - Call Me Maybe
Kesha - TiK ToK
Katy Perry - Firework
Nickelback - Photograph
Taylor Swift - You Belong With Me
Vengaboys - We Like To Party!
Savage Garden - Truly Madly Deeply
Ariana Grande - thank u, next
Pitbull - Give Me Everything
LMFAO - Party Rock Anthem
Justin Bieber - Baby
One Direction - What Makes You Beautiful
Avril Lavigne - Sk8er Boi
Vanessa Carlton - A Thousand Miles
Sugar Ray - Fly
Meghan Trainor - All About That Bass
Jonas Brothers - Burnin' Up`),
  },
  {
    id: 'rainy', emoji: '🌧️', name: 'Rainy Day', question: 'Best song for a rainy day?', desc: 'Blankets, tea, feelings',
    songs: L(`
Norah Jones - Don't Know Why
Bon Iver - Holocene
Billie Eilish - ocean eyes
Lana Del Rey - Video Games
Coldplay - The Scientist
Radiohead - No Surprises
Cigarettes After Sex - Apocalypse
Mazzy Star - Fade Into You
Adele - Hometown Glory
Ed Sheeran - Photograph
Jeff Buckley - Hallelujah
Damien Rice - The Blower's Daughter
The xx - Intro
Frank Ocean - Pink + White
Nina Simone - Feeling Good
Bill Withers - Ain't No Sunshine
Sam Cooke - A Change Is Gonna Come
Tracy Chapman - Fast Car
Lorde - Ribs`),
  },
  {
    id: 'disco', emoji: '🪩', name: 'Disco & Funk Fever', question: 'Best groove?', desc: 'Impossible to sit still',
    songs: L(`
ABBA - Mamma Mia
Earth, Wind & Fire - September
Jackson 5 - I Want You Back
Stevie Wonder - Sir Duke
Kool & The Gang - Celebration
CHIC - Le Freak
Diana Ross - I'm Coming Out
Gloria Gaynor - I Will Survive
Donna Summer - Hot Stuff
Sister Sledge - We Are Family
Village People - Y.M.C.A.
Lipps Inc. - Funkytown
Daft Punk - Around the World
Justice - D.A.N.C.E.
Dua Lipa - Physical
Robyn - Dancing On My Own
Kylie Minogue - Can't Get You Out of My Head
Madonna - Hung Up
Parliament - Flash Light`),
  },
  {
    id: 'wedding', emoji: '💍', name: 'Wedding Dance Floor', question: 'Best wedding dance song?', desc: 'Grandma and the DJ approve',
    songs: L(`
Bruno Mars - Marry You
Beyoncé - Love On Top
Ed Sheeran - Perfect
John Legend - All of Me
Etta James - At Last
Frankie Valli & The Four Seasons - Can't Take My Eyes off You
DJ Casper - Cha Cha Slide
Flo Rida - Low (feat. T-Pain)
Chris Brown - Forever
Marvin Gaye - Ain't No Mountain High Enough
Kool & The Gang - Jungle Boogie
Cupid - Cupid Shuffle
Whitney Houston - I Wanna Dance With Somebody (Who Loves Me)
Journey - Don't Stop Believin'
Shania Twain - You're Still The One
Stevie Wonder - Signed, Sealed, Delivered I'm Yours
Justin Timberlake - Can't Stop the Feeling!`),
  },
  {
    id: 'movie', emoji: '🎬', name: 'Movie Soundtracks', question: 'Best song from a movie?', desc: 'Credits-rolling classics',
    songs: L(`
Aerosmith - I Don't Want to Miss a Thing
Bill Medley - (I've Had) The Time Of My Life
Wiz Khalifa - See You Again
Lady Gaga - Shallow
Adele - Skyfall
Billie Eilish - No Time To Die
Kendrick Lamar - All The Stars
Simple Minds - Don't You (Forget About Me)
Ray Parker Jr. - Ghostbusters
Berlin - Take My Breath Away
Bryan Adams - (Everything I Do) I Do It For You
Eminem - Lose Yourself
Kenny Loggins - Footloose
Survivor - Eye Of The Tiger
Celine Dion - My Heart Will Go On
Phil Collins - You'll Be In My Heart
Glen Hansard - Falling Slowly
Queen - Bohemian Rhapsody
Whitney Houston - I Will Always Love You`),
  },
  {
    id: 'oldschool', emoji: '📻', name: 'Old-School Rap', question: 'Best old-school rap song?', desc: 'Golden-era and 2000s hip-hop',
    songs: L(`
Jay-Z - Hard Knock Life (Ghetto Anthem)
Nas - If I Ruled The World (Imagine That)
Wu-Tang Clan - C.R.E.A.M.
Outkast - Ms. Jackson
Eminem - Without Me
Ja Rule - Always On Time
Busta Rhymes - Touch It
Nelly - Dilemma
Mase - Feel So Good
DMX - Party Up (Up In Here)
A Tribe Called Quest - Can I Kick It?
LL COOL J - Mama Said Knock You Out
Fat Joe - Lean Back
Ying Yang Twins - Salt Shaker
Chingy - Right Thurr
Three 6 Mafia - Stay Fly
Missy Elliott - Get Ur Freak On
Snoop Dogg - Drop It Like It's Hot
Dr. Dre - Still D.R.E.
The Notorious B.I.G. - Hypnotize`),
  },
  {
    id: 'newschool', emoji: '⚡', name: 'New-School Rap', question: 'Best modern rap song?', desc: 'Last decade and a half of rap',
    songs: L(`
Lil Baby - Drip Too Hard
Roddy Ricch - The Box
Playboi Carti - Magnolia
Future - Life Is Good
Gunna - fukumean
Pop Smoke - What You Know Bout Love
Juice WRLD - Lucid Dreams
XXXTENTACION - SAD!
Lil Tecca - Ransom
A$AP Rocky - Praise The Lord (Da Shine)
Kodak Black - ZEZE
Migos - Walk It Talk It
21 Savage - redrum
Metro Boomin - Creepin'
Kendrick Lamar - Not Like Us
Drake - Nice For What
Tyga - Taste
Jack Harlow - First Class
Lil Durk - All My Life
J. Cole - m y . l i f e`),
  },
  {
    id: 'edm', emoji: '🎛️', name: 'Dance Floor', question: 'Best dance track?', desc: 'Festival drops and club classics',
    songs: L(`
Avicii - Wake Me Up
Calvin Harris - One Kiss
Zedd - Clarity
Marshmello - Alone
Daft Punk - One More Time
deadmau5 - Strobe
Skrillex - Scary Monsters And Nice Sprites
Disclosure - Latch
Fatboy Slim - Right Here, Right Now
Darude - Sandstorm
Eric Prydz - Pjanoo
David Guetta - Memories
Tiësto - Adagio For Strings
Alesso - Heroes (we could be)
Major Lazer - Lean On
Flume - Never Be Like You
Fred again.. - Delilah (pull me out of this)
Armin van Buuren - Blah Blah Blah`),
  },
  {
    id: 'sunday', emoji: '☕', name: 'Sunday Morning', question: 'Best Sunday-morning song?', desc: 'Pancakes and good vibes',
    songs: L(`
Jack Johnson - Better Together
Norah Jones - Come Away With Me
Jason Mraz - I'm Yours
Bill Withers - Lovely Day
The Beatles - Here Comes The Sun
Stevie Wonder - Isn't She Lovely
Van Morrison - Brown Eyed Girl
Ben E. King - Stand By Me
Otis Redding - (Sittin' On) The Dock Of The Bay
Carole King - You've Got A Friend
James Taylor - Fire and Rain
Khruangbin - Time (You and I)
Leon Bridges - Coming Home
Michael Kiwanuka - Cold Little Heart
Harry Styles - Adore You
Paolo Nutini - Pencil Full Of Lead`),
  },
  {
    id: 'popqueens', emoji: '👑', name: 'Pop Queens', question: 'Best pop-girl anthem?', desc: 'Divas and main characters',
    songs: L(`
Beyoncé - Halo
Rihanna - Diamonds
Lady Gaga - Just Dance
Taylor Swift - Anti-Hero
Ariana Grande - Problem
Katy Perry - Dark Horse
Dua Lipa - New Rules
Billie Eilish - Happier Than Ever
Olivia Rodrigo - good 4 u
Sabrina Carpenter - Espresso
Chappell Roan - Good Luck, Babe!
Charli xcx - 360
Tate McRae - greedy
Doja Cat - Paint The Town Red
Miley Cyrus - Wrecking Ball
Selena Gomez - Lose You To Love Me
Kesha - Praying
Lorde - Green Light
Carly Rae Jepsen - Cut To The Feeling`),
  },
  // Live Deezer charts: always fresh, wide open.
  { id: 'spotlight', emoji: '🎯', name: 'Artist Spotlight (live)', spotlight: true, desc: 'A random chart artist: best song by them?' },
  { id: 'chart-all', emoji: '📈', name: 'Top Charts (live)', question: 'Best song on the charts right now?', desc: 'Whatever is hot this week', chart: 0 },
  { id: 'chart-rap', emoji: '📈', name: 'Rap Charts (live)', question: 'Best rap song on the charts?', desc: 'Current hip-hop top tracks', chart: 116 },
  { id: 'chart-pop', emoji: '📈', name: 'Pop Charts (live)', question: 'Best pop song on the charts?', desc: 'Current pop top tracks', chart: 132 },
  { id: 'chart-rock', emoji: '📈', name: 'Rock Charts (live)', question: 'Best rock song on the charts?', desc: 'Current rock top tracks', chart: 152 },
  { id: 'chart-rnb', emoji: '📈', name: 'R&B Charts (live)', question: 'Best R&B song on the charts?', desc: 'Current R&B top tracks', chart: 165 },
  { id: 'chart-dance', emoji: '📈', name: 'Dance Charts (live)', question: 'Best dance track on the charts?', desc: 'Current dance top tracks', chart: 113 },
];

export const packById = (id) => PACKS.find((p) => p.id === id);
export const FIXED_PACKS = PACKS.filter((p) => !p.chart && !p.spotlight).map((p) => p.id);
export const ALL_PACKS = PACKS.map((p) => p.id); // 'Surprise me' draws from everything
export const DEFAULT_PACKS = FIXED_PACKS;

export const hueOf = (id) => { let h = 7; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
