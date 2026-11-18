// One locked look for the whole game: Ash and Gold (chosen by Michael, Nov 17, 2026).
// The rule: the dead world is grey ash; only wealth has color (gold, bronze, warm light);
// only things that watch her are red. No gradients: every band that used to fade uses one color.
export const ASH = {
  ash0: '#0e0f12', ash1: '#1b1c21', ash2: '#2e3036', ash3: '#45474d', ash4: '#6b6c70', ash5: '#8f8d87',
  bone: '#ebe6d8', boneLo: '#b8b2a3',
  bronzeLo: '#261f15', bronze: '#3a2f1f', bronzeHi: '#54432a',
  goldLo: '#8a5f1c', gold: '#d6a03c', goldHi: '#f2d58c', lit: '#f5ce77',
  red: '#e3412b', redHi: '#ffd9d0',
  // the one thing borrowed from the Camera Feed look: the watchers' amber, only when the satellite locks on
  amber: '#ffb01f'
};
const A = ASH;
export const LOOKS = {
  A: {
    name: 'Ash and Gold',
    // the dead world
    skyTop: A.ash1, skyMid: A.ash1, skyLow: A.ash1, star: A.ash4, moon: A.bone, moonShade: A.boneLo,
    hill: A.ash0, ground: A.ash2, groundTop: A.ash3, path: A.ash2, pathHi: A.ash3,
    crack: A.ash0, rubble: A.ash3, rubbleHi: A.ash4, dust: A.ash5, shaft: A.boneLo,
    // wealth: the house, its garden, its things
    hedge: A.bronzeLo, hedgeHi: A.bronze,
    wall: A.bronze, wallHi: A.bronzeHi, wallLo: A.bronzeLo, wallLine: A.bronzeLo,
    col: A.boneLo, colHi: A.bone, colLo: A.ash5,
    gold: A.gold, goldHi: A.goldHi, goldLo: A.goldLo, glint: A.goldHi,
    win: A.lit, winHi: A.goldHi, winLo: A.ash0, glass: A.ash2, glassLit: A.lit, lamp: A.lit,
    floor: A.bronzeLo, floorHi: A.bronze, floorLo: A.ash0,
    wood: A.bronze, woodHi: A.bronzeHi, fabric: A.goldLo, fabricLo: A.bronze,
    robot: A.boneLo, robotLed: A.gold,
    void: '#000000', voidEdge: A.bone,
    // people
    kid: A.bone, kidLo: A.boneLo, hair: A.ash0, bone: A.boneLo, sib: A.ash5, sibHi: A.bone, sibLo: A.ash3,
    // what watches her
    device: A.ash3, led: A.red, hazard: A.red, hazardCore: A.redHi, overlay: A.red
  }
};
export const LOOK_KEYS = Object.keys(LOOKS);
