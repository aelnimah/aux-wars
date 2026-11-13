// Round themes. Each pack is a question the room answers ("Best pregame song?")
// plus a pool of songs. Songs are resolved to previews + artwork at game time.
// The Artist Spotlight pack builds rounds on the fly from SPOTLIGHT_ARTISTS (best songs by one artist).

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
Montell Jordan - This Is How We Do It
Salt-N-Pepa - Push It
Snoop Dogg - Gin and Juice
Mariah Carey - Fantasy
Aaliyah - Try Again
Brandy & Monica - The Boy Is Mine
Ginuwine - Pony
Missy Elliott - The Rain (Supa Dupa Fly)
Mary J. Blige - Real Love
Boyz II Men - End of the Road
SWV - Weak
En Vogue - Don't Let Go (Love)
Janet Jackson - That's the Way Love Goes
Shaggy - It Wasn't Me
Usher - You Make Me Wanna...`),
  },
  {
    id: 'nightdrive', emoji: '🌙', name: 'Late Night Drive', question: 'Best song for a late night drive?',
    desc: 'Moody, smooth, windows down',
    songs: L(`
The Weeknd - Blinding Lights
The Weeknd - Starboy
Frank Ocean - Nights
Post Malone - Circles
SZA - Snooze
Childish Gambino - Redbone
Bruno Mars - Locked out of Heaven
The Neighbourhood - Sweater Weather
Khalid - Location
Lorde - Royals
Joji - Slow Dancing in the Dark
Billie Eilish - bad guy
Mac Miller - Self Care
Kanye West - Runaway
Kid Cudi - Day 'N' Nite
Don Toliver - No Idea
Tame Impala - The Less I Know The Better
Glass Animals - Heat Waves`),
  },
  {
    id: 'gym', emoji: '💪', name: 'Gym Beast Mode', question: 'Best workout song?',
    desc: 'Heavy, fast, loud',
    songs: L(`
Eminem - Till I Collapse
DMX - X Gon' Give It To Ya
Lil Wayne - A Milli
Kendrick Lamar - Backseat Freestyle
Pop Smoke - Dior
21 Savage - a lot
Cardi B - I Like It
Meek Mill - Dreams and Nightmares
Nas - Made You Look
Gucci Mane - Lemonade
Run The Jewels - Legend Has It
Travis Scott - Antidote
Future - Stick Talk
Megan Thee Stallion - Body
Lil Uzi Vert - Money Longer
DJ Khaled - I'm the One
Nicki Minaj - Super Bass
Kanye West - Black Skinhead
Kanye West - Power`),
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
Justin Timberlake - CAN'T STOP THE FEELING!
Luis Fonsi - Despacito
Bad Bunny - Tití Me Preguntó
Shakira - Waka Waka (This Time for Africa)
Ed Sheeran - Shape of You
Lil Nas X - Old Town Road
Rihanna - Work
Bob Marley & The Wailers - Three Little Birds
Wiz Khalifa - Black and Yellow
Mark Ronson - Uptown Funk
Doja Cat - Woman
Jack Johnson - Banana Pancakes`),
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
    id: 'guilty', emoji: '🙈', name: 'Guilty Pleasures', question: 'Best guilty-pleasure song?', desc: 'Admit you know every word',
    songs: L(`
Britney Spears - Toxic
Miley Cyrus - Party In The U.S.A.
Carly Rae Jepsen - Call Me Maybe
Kesha - TiK ToK
Katy Perry - Firework
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
Meghan Trainor - All About That Bass
Jonas Brothers - Burnin' Up`),
  },
  {
    id: 'wedding', emoji: '💍', name: 'Wedding Dance Floor', question: 'Best wedding dance song?', desc: 'Grandma and the DJ approve',
    songs: L(`
Bruno Mars - Marry You
Beyoncé - Love On Top
Ed Sheeran - Perfect
John Legend - All of Me
DJ Casper - Cha Cha Slide
Flo Rida - Low (feat. T-Pain)
Chris Brown - Forever
Marvin Gaye - Ain't No Mountain High Enough
Kool & The Gang - Jungle Boogie
Cupid - Cupid Shuffle
Whitney Houston - I Wanna Dance With Somebody (Who Loves Me)
Stevie Wonder - Signed, Sealed, Delivered I'm Yours
Justin Timberlake - Can't Stop the Feeling!
Etta James - At Last
Frankie Valli & The Four Seasons - Can't Take My Eyes off You`),
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
  {
    id: 'afro', emoji: '🌍', name: 'Afrobeats Heat', question: 'Best Afrobeats song?', desc: 'Lagos to the world',
    songs: L(`
Burna Boy - Last Last
Burna Boy - Ye
Burna Boy - City Boys
Burna Boy - On the Low
Wizkid - Essence
Wizkid - Ojuelegba
Wizkid - Come Closer
Davido - Fall
Davido - Unavailable
Davido - If
Rema - Calm Down
Rema - Soundgasm
Tems - Free Mind
Ayra Starr - Rush
CKay - love nwantiti (ah ah ah)
Fireboy DML - Peru
Asake - Sungba
Asake - Lonely At The Top
Omah Lay - Soso
Tyla - Water
Tiwa Savage - Somebody's Son
Kizz Daniel - Buga
Ruger - Dior
Libianca - People`),
  },
  {
    id: 'afroslow', emoji: '💛', name: 'Afrobeats Love Songs', question: 'Best Afrobeats love song?', desc: 'Smooth, romantic, melodic',
    songs: L(`
Wizkid - Joro
Davido - Assurance
Omah Lay - Understand
Tiwa Savage - Eminado
Ayra Starr - Bloody Samaritan
Fireboy DML - Apple
Tems - Higher
Rema - Dumebi
Burna Boy - Anybody
Oxlade - KU LO SA
Joeboy - Sip (Alcohol)
Asake - Organise
Wizkid - Smile
Davido - Stand Strong
Fireboy DML - Jealous
Omah Lay - Bad Influence
Tems - Crazy Tings
Rema - Charm`),
  },
  {
    id: 'dancehall', emoji: '🏝️', name: 'Dancehall & Reggae', question: 'Best dancehall or reggae song?', desc: 'Island heat',
    songs: L(`
Sean Paul - Temperature
Sean Paul - Get Busy
Shaggy - Boombastic
Shaggy - It Wasn't Me
Popcaan - Unstoppable
Koffee - Toast
Spice - Go Down Deh
Beenie Man - Who Am I (Sim Simma)
Shenseea - Lick
Buju Banton - Champion
Mavado - On the Rock
Damian Marley - Welcome to Jamrock
Chronixx - Skankin' Sweet
Rihanna - Rude Boy
Major Lazer - Lean On
Kranium - Nobody Has to Know
Bob Marley & The Wailers - Could You Be Loved
Gyptian - Hold You
Vybz Kartel - Fever`),
  },
  {
    id: 'modrnb', emoji: '🎶', name: 'Modern R&B', question: 'Best modern R&B song?', desc: 'Today’s smooth voices',
    songs: L(`
Brent Faiyaz - Dead Man Walking
GIVĒON - Heartbreak Anniversary
Chris Brown - Under The Influence
Summer Walker - Girls Need Love
Jhené Aiko - Triggered
Ari Lennox - Shea Butter Baby
Kehlani - Nights Like This
Bryson Tiller - Exchange
PARTYNEXTDOOR - Come and See Me
The Weeknd - Earned It
Usher - Don't Waste My Time
Victoria Monét - On My Mama
Coco Jones - ICU
Muni Long - Hrs and Hrs
Tinashe - 2 On
Kali Uchis - Telepatía
Daniel Caesar - Get You
Khalid - Talk
Jorja Smith - Blue Lights`),
  },
  {
    id: 'throwrnb', emoji: '💿', name: 'Throwback R&B', question: 'Best 2000s R&B song?', desc: 'Slow dances and ringtones',
    songs: L(`
Usher - Burn
Usher - Confessions Part II
Alicia Keys - No One
Ne-Yo - Closer
Chris Brown - Run It!
Rihanna - SOS
Mario - Let Me Love You
Ashanti - Foolish
Mary J. Blige - Be Without You
Keyshia Cole - Love
Jagged Edge - Let's Get Married
Trey Songz - Can't Help but Wait
Omarion - O
B2K - Bump, Bump, Bump
Amerie - 1 Thing
Mýa - Case of the Ex
112 - Peaches & Cream
Monica - So Gone
Brandy - Full Moon
Ciara - Goodies
Jazmine Sullivan - Bust Your Windows`),
  },
  {
    id: 'trap', emoji: '🔊', name: 'Trap Heat', question: 'Best trap song?', desc: 'Hi-hats and 808s',
    songs: L(`
Young Thug - Best Friend
Gucci Mane - Wasted
Chief Keef - Love Sosa
21 Savage - Bank Account
Lil Baby - Yes Indeed
Travis Scott - Butterfly Effect
Playboi Carti - Shoota
Offset - Clout
Rae Sremmurd - Black Beatles
2 Chainz - No Lie
Rich The Kid - Plug Walk
Fetty Wap - 679
DaBaby - SUGE (Yea Yea)
Lil Pump - Gucci Gang
BlocBoy JB - Look Alive
Tory Lanez - Say It
Future - Wicked
Migos - T-Shirt`),
  },
  {
    id: 'uk', emoji: '🇬🇧', name: 'UK Rap & Grime', question: 'Best UK rap song?', desc: 'London, Manchester and beyond',
    songs: L(`
Stormzy - Big For Your Boots
Skepta - That's Not Me
Dave - Starlight
Central Cee - Doja
Little Simz - Venom
AJ Tracey - Ladbroke Grove
J Hus - Did You See
Aitch - Taste (Make It Shake)
Headie One - Both
Giggs - Talkin' the Hardest
Wiley - Wearing My Rolex
Dizzee Rascal - Bonkers
Kano - Hail
Stormzy - Vossi Bop
Skepta - Shutdown`),
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
Eurythmics - Sweet Dreams (Are Made Of This)
Kenny Loggins - Danger Zone
Run-D.M.C. - Walk This Way
Culture Club - Karma Chameleon
Hall & Oates - Maneater
Lionel Richie - Hello
Janet Jackson - What Have You Done for Me Lately
Stevie Wonder - I Just Called to Say I Love You
Bananarama - Cruel Summer
Michael Jackson - Billie Jean`),
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
Dua Lipa - Physical
Robyn - Dancing On My Own
Kylie Minogue - Can't Get You Out of My Head
Madonna - Hung Up
Bee Gees - Stayin' Alive
Parliament - Flash Light
Prince - Let's Go Crazy`),
  },
  {
    id: 'karaoke', emoji: '🎙️', name: 'Karaoke Classics', question: 'Best karaoke song?', desc: 'The ones you will absolutely attempt',
    songs: L(`
ABBA - Dancing Queen
Elton John - Tiny Dancer
Frank Sinatra - My Way
Aretha Franklin - Respect
Cyndi Lauper - Girls Just Want to Have Fun
Prince - Purple Rain
Michael Jackson - Don't Stop 'Til You Get Enough
Madonna - Like a Prayer
Céline Dion - My Heart Will Go On
Kelly Clarkson - Stronger (What Doesn't Kill You)
Ricky Martin - Livin' la Vida Loca
Blondie - Heart Of Glass
Billy Joel - Piano Man
Stevie Wonder - Superstition
Lionel Richie - All Night Long (All Night)
Rick Astley - Never Gonna Give You Up
Tina Turner - Proud Mary
Whitney Houston - I Wanna Dance With Somebody (Who Loves Me)
Mariah Carey - Hero
Backstreet Boys - I Want It That Way`),
  },
  {
    id: 'roadtrip', emoji: '🚗', name: 'Singalong Classics', question: 'Best song to scream in the car?', desc: 'Everybody knows the words',
    songs: L(`
Backstreet Boys - I Want It That Way
Whitney Houston - I Will Always Love You
Elton John - Rocket Man
Neil Diamond - Sweet Caroline
Taylor Swift - Shake It Off
Lizzo - Good as Hell
Lady Gaga - Bad Romance
Beyoncé - Single Ladies (Put a Ring on It)
Bruno Mars - Just the Way You Are
Katy Perry - Firework
Kelly Clarkson - Since U Been Gone
Britney Spears - Oops!...I Did It Again
Destiny's Child - Survivor
Michael Jackson - Man in the Mirror
Céline Dion - It's All Coming Back to Me Now
Adele - Rolling in the Deep
Rihanna - Umbrella
Shakira - Hips Don't Lie
Ed Sheeran - Shape of You
Pharrell Williams - Happy`),
  },
  {
    id: 'movie', emoji: '🎬', name: 'Movie Soundtracks', question: 'Best song from a movie?', desc: 'Credits-rolling classics',
    songs: L(`
Bill Medley - (I've Had) The Time Of My Life
Wiz Khalifa - See You Again
Lady Gaga - Shallow
Adele - Skyfall
Billie Eilish - No Time To Die
Kendrick Lamar - All The Stars
Ray Parker Jr. - Ghostbusters
Berlin - Take My Breath Away
Eminem - Lose Yourself
Kenny Loggins - Footloose
Celine Dion - My Heart Will Go On
Phil Collins - You'll Be In My Heart
Glen Hansard - Falling Slowly
Whitney Houston - I Will Always Love You
Lionel Richie - Say You, Say Me
Irene Cara - Flashdance... What a Feeling
Coolio - Gangsta's Paradise
Will Smith - Men in Black
Beyoncé - Listen
Rihanna - Lift Me Up`),
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
Marvin Gaye - Let's Get It On
Sade - By Your Side
Erykah Badu - On & On`),
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
    id: 'onehit', emoji: '🦄', name: 'One-Hit Wonders', question: 'Best one-hit wonder?', desc: 'They only needed one',
    songs: L(`
Soft Cell - Tainted Love
Los del Río - Macarena (Bayside Boys Mix)
Vanilla Ice - Ice Ice Baby
Technotronic - Pump Up The Jam
Baha Men - Who Let The Dogs Out
Right Said Fred - I'm Too Sexy
Sir Mix-A-Lot - Baby Got Back
Dexys Midnight Runners - Come On Eileen
OMI - Cheerleader
Carl Douglas - Kung Fu Fighting
Lou Bega - Mambo No. 5 (A Little Bit of...)
Haddaway - What Is Love
Natalie Imbruglia - Torn
Gotye - Somebody That I Used To Know
Chingy - Right Thurr
Sean Kingston - Beautiful Girls
Cupid - Cupid Shuffle`),
  },
  // Random-artist rounds: "Best Drake song?". Artists come from SPOTLIGHT_ARTISTS below.
  { id: 'spotlight', emoji: '🎯', name: 'Artist Spotlight', spotlight: true, desc: 'A random artist from the list below: best song by them?' },
];

export const packById = (id) => PACKS.find((p) => p.id === id);
export const FIXED_PACKS = PACKS.filter((p) => !p.spotlight).map((p) => p.id);
export const ALL_PACKS = PACKS.map((p) => p.id); // 'Surprise me' draws from everything
export const DEFAULT_PACKS = FIXED_PACKS;

export const hueOf = (id) => { let h = 7; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

// Established artists only (no brand-new acts). Add or remove names freely.
export const SPOTLIGHT_ARTISTS = [
  'Drake', 'Kanye West', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'JAY-Z', 'Eminem', '50 Cent', 'Nicki Minaj', 'Cardi B',
  'Lil Wayne', 'Snoop Dogg', 'Nas', 'OutKast', 'Tyler, The Creator', 'A$AP Rocky', 'Future', 'Migos', 'Megan Thee Stallion',
  'Missy Elliott', '2Pac', 'The Notorious B.I.G.', 'Dr. Dre', 'Ludacris', 'Nelly', 'Lil Baby', '21 Savage', 'Post Malone',
  'Juice WRLD', 'Mac Miller', 'Kid Cudi', 'Beyoncé', 'Rihanna', 'Usher', 'Alicia Keys', 'Chris Brown', 'The Weeknd', 'SZA',
  'Frank Ocean', 'Bruno Mars', 'Mary J. Blige', 'Aaliyah', 'Brandy', 'Ne-Yo', 'Whitney Houston', 'Mariah Carey', 'Stevie Wonder',
  'Marvin Gaye', 'Sade', 'Jhené Aiko', 'Summer Walker', 'Khalid', 'Daniel Caesar', 'Janet Jackson', "Destiny's Child", 'Boyz II Men',
  'Michael Jackson', 'Prince', 'Madonna', 'Taylor Swift', 'Ariana Grande', 'Dua Lipa', 'Billie Eilish', 'Justin Timberlake',
  'Britney Spears', 'Lady Gaga', 'Katy Perry', 'Adele', 'Ed Sheeran', 'Justin Bieber', 'Harry Styles', 'Doja Cat', 'Lizzo',
  'Selena Gomez', 'Miley Cyrus', 'Elton John', 'ABBA', 'Backstreet Boys', 'Burna Boy', 'Wizkid', 'Davido', 'Rema', 'Tems',
  'Asake', 'Ayra Starr', 'Tiwa Savage', 'Fireboy DML', 'Omah Lay', 'Tyla', 'Sean Paul', 'Shaggy', 'Bob Marley & The Wailers',
  'Bad Bunny', 'Shakira', 'J Balvin', 'Daddy Yankee', 'Karol G', 'Enrique Iglesias',
];
