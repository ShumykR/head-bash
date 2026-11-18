export type Pt = [number, number];

/** Materials a car polygon can be drawn with (palette slot or special texture). */
export type CarMat =
  | 'body' | 'accent' | 'dark' | 'metal' | 'spike' | 'scoop' | 'rocket' | 'wood' | 'glass'
  | 'bone' | 'gold' | 'leaf' | 'white' | 'light' | 'black' | 'pink'
  | 'red' | 'yellow' | 'green' | 'blue' | 'orange' | 'brown' | 'purple' | 'chrome' | 'rubber' | 'cream' | 'teal' | 'tan' | 'sky' | 'grey';

export type Archetype =
  | 'allround' | 'heavy' | 'fast' | 'monster' | 'tiny' | 'long'
  | 'scoop' | 'ram' | 'spike' | 'rocket' | 'tall' | 'bouncy';

export interface CarPoly {
  /** Convex polygon, 3..8 vertices, car-local meters (car faces +x, y down). */
  pts: Pt[];
  mat?: CarMat;
  /** Overrides car density for this piece (e.g. heavy ram). */
  density?: number;
  friction?: number;
  /** Render-only piece (no collision). */
  deco?: boolean;
  /** Render only: cuts a see-through hole in everything drawn before it (an open cab window). */
  cut?: boolean;
  /** Physics-only piece (not drawn; a skin draws the look instead). */
  hide?: boolean;
  /** Draw a dark seam around this piece even over the same material (panels, doors). */
  ring?: boolean;
  /** Flat shading (no top highlight / bottom shadow): decals, stripes, lettering. */
  flat?: boolean;
  /** Glass that stays even right under the driver (who looks out of a roof hatch above it). */
  keep?: boolean;
  /** Render only: the round the car fires (a rocket on its rail); it vanishes while the shot recharges. */
  ammo?: boolean;
  /** Render only: running gear at rest (a track belt) that the game draws live, following the wheels. */
  gear?: boolean;
  /**
   * Render only: a limb that swings as the car rolls (a horse's leg, a porter's stride, a spider's
   * leg). It turns about `at` by `amp` degrees each way, once per stride, `phase` (0..1) into it.
   * Pieces with the same pivot, swing and phase move as one.
   */
  gait?: Gait;
  /** Render only: one pose of a frame-by-frame cycle (see PoseFrame). */
  pose?: PoseFrame;
}

/** `spin`: the piece turns round and round instead (a roller of that radius rolling along). */
export interface Gait { at: Pt; amp: number; phase?: number; spin?: number }

/** Render only: frame `i` of an `n`-frame cycle (a gallop drawn pose by pose); shown in turn as the car rolls. */
export interface PoseFrame { n: number; i: number }

/** A light cycle's wall of light: a glowing ribbon traced behind from `at` (car-local, its foot) up `h` m, fading over `life` s. */
export interface RibbonDef { at: Pt; h: number; mat: CarMat; life: number }

/** How the driver sits: in a seat (legs out in front, under the bodywork) or astride, feet on the pegs. */
export interface RiderDef {
  pose: 'sit' | 'ride' | 'stand';
  /** Where the gloves hold on (handlebar grip), car-local. */
  hand?: Pt;
  /** Where the boots rest (foot peg), car-local. */
  foot?: Pt;
  /** Drawn over the car (a rider astride a bike) rather than behind its bodywork. */
  front?: boolean;
  /** How far the hips sit behind the shoulders (m; a racer lying along a light cycle leans a lot). */
  lean?: number;
}

export interface WheelDef {
  x: number;
  y: number;
  r: number;
  /** Driven by the motor (default true). */
  drive?: boolean;
  density?: number;
  /** Rim style for the sprite generator. */
  rim?: 'spokes' | 'disc' | 'star' | 'monster';
  /** Physics-only wheel (sled runners, bumper-car skirt): not drawn. */
  hidden?: boolean;
}

/**
 * How a car meets the ground. Wheels roll; a track belt wraps the road wheels and its lugs run with
 * them; runners (sled runners, skis, skates) slide and throw up snow; a hover car floats on a
 * glowing air cushion that kicks up dust.
 */
export type DriveKind = 'wheels' | 'tracks' | 'runners' | 'hover';

export interface CarPalette {
  body: string;
  accent: string;
  dark: string;
  glass: string;
  light: string;
}

/** Special action on its own button. Every car's action is unique (see cars/kit.ts). */
export type AbilityKind =
  // hops and leaps
  | 'jump' | 'stomp' | 'bounce' | 'rear' | 'surprise' | 'ollie' | 'pounce' | 'hydraulics' | 'backflip' | 'moonjump'
  // rushes and strikes
  | 'nitro' | 'drs' | 'dash' | 'sting' | 'gore' | 'flip' | 'bump' | 'bite' | 'frenzy' | 'slide'
  | 'punch' | 'kick' | 'scoop' | 'tailwhip' | 'rocketfist'
  // area effects
  | 'slam' | 'puff' | 'roar' | 'discharge' | 'howl' | 'stasis' | 'beam' | 'storm'
  // self
  | 'fly' | 'glide' | 'shield' | 'shell' | 'reflect' | 'heavy' | 'phase' | 'invis' | 'blink' | 'swap' | 'recall' | 'icewall'
  | 'charge' | 'flashbang' | 'shadowstep'
  // things
  | 'shoot' | 'drop' | 'dump';
export type ProjectileKind =
  | 'cannon' | 'snowball' | 'ball' | 'laser' | 'firework' | 'toast' | 'harpoon' | 'bubble' | 'pumpkin'
  | 'bone' | 'missile' | 'water' | 'ice' | 'fire' | 'urn' | 'zap' | 'cork' | 'burger' | 'web'
  | 'golf' | 'bullet' | 'bigsnow' | 'bat' | 'penguin' | 'mega' | 'torpedo' | 'volley' | 'tea' | 'plasma'
  | 'seeker' | 'fist' | 'railgun' | 'atom' | 'hook' | 'quill' | 'ink'
  | 'popshell' | 'grapeshot' | 'slush' | 'twinsnow' | 'twinball' | 'tracer' | 'dragonshell' | 'chainshot' | 'bigrocket' | 'tankshell'
  | 'tentacle' | 'eyelaser' | 'fireball' | 'ghostfire' | 'star';

/** Loose things a car carries (start in the bed and spill out), drops, or an arena scatters around. */
export type ItemKind =
  | 'ball' | 'log' | 'barrel' | 'gift' | 'pumpkin' | 'snowball' | 'trash' | 'rock' | 'egg' | 'bone'
  | 'crate' | 'hay' | 'cow' | 'penguin' | 'coal' | 'mine' | 'bomb' | 'peel'
  | 'icecream' | 'coffin' | 'concrete' | 'oil' | 'tar' | 'spikes' | 'sandbag' | 'melon' | 'tire'
  | 'icewall' | 'flame' | 'cone' | 'toyblock' | 'toycar';

export interface AbilityDef {
  kind: AbilityKind;
  /** For 'shoot'. */
  projectile?: ProjectileKind;
  /** For 'drop' / 'dump': what comes out. */
  item?: ItemKind;
  /** Car-specific name shown in menus ("Тостомет", "Сирена"…). */
  name?: string;
  /** For 'shoot': car-local muzzle point(s) the shots leave from (pellets cycle through them). */
  muzzle?: Pt[];
  /** For 'shoot': launch angle above the car's forward axis, radians (default: a little above level). */
  aim?: number;
}

/** Passive, always-on quirk of a car (shown next to its active ability). */
export type TraitDef =
  /** Floats and paddles in water instead of drowning. */
  | { kind: 'swim' }
  /** Drops an item from the back every few seconds while driving. */
  | { kind: 'spill'; item: ItemKind; every: number }
  /** Shrugs off the first head hit of each round. */
  | { kind: 'medkit' }
  /** Sticky tracks: much more grip on slopes and walls. */
  | { kind: 'grip' }
  /** Spiky hull: whoever rams it bounces off. */
  | { kind: 'quills' }
  /** Rubber body: bounces off everything. */
  | { kind: 'rubber' }
  /** Electric skin: touching it stuns. */
  | { kind: 'shock' };

export interface CargoDef {
  kind: ItemKind;
  n: number;
  /** Bed span in car-local meters: x from..to, y = top of the bed. */
  at: [number, number, number];
  /** How high the hold reaches above `at`'s top (a closed body); cargo above it has left. */
  depth?: number;
}

/** A weight hanging on a chain (wrecking ball, mace tail). */
export interface FlailDef {
  /** Car-local anchor. */
  at: Pt;
  len: number;
  r: number;
  look: 'wrecking' | 'mace' | 'anchor';
  /** Hangs off this link (a crane boom) instead of the chassis. */
  on?: number;
}

/**
 * A moving piece of the car with its own physics: a trailer on a hitch, a crane boom,
 * a tail, a jaw, a spinning saw. It hangs off the chassis (or off another link) on a hinge.
 */
export interface LinkDef {
  /** Polygons in car-local coordinates at rest (same flags as the body: deco = drawn only, hide = physics only). */
  polys: CarPoly[];
  /** Hinge point, car-local. */
  at: Pt;
  /** Index of the link this one hangs off (arm segments, tail chains); the chassis when omitted. */
  to?: number;
  /** Swing limits around the rest pose, radians, for a car facing right (positive = clockwise on screen). Omit for a free hinge. */
  swing?: [number, number];
  /** Springiness pulling the piece back to rest (the most torque the spring gives, N·m). */
  spring?: number;
  /** How fast the sprung piece sways back, Hz (default 2.6); 0 = a stiff servo that only gives under a hard knock (load-bearing necks). */
  hz?: number;
  /** Motor spin, rad/s (saws, rollers, propellers). */
  spin?: number;
  /** The piece's own free-rolling wheels (trailers). */
  wheels?: WheelDef[];
  /** Density of the colliding polygons (default 0.5). */
  density?: number;
  /** Drawn behind the body instead of in front. */
  behind?: boolean;
  /** Trim (antenna, flag, ribbon): it sways with the car but collides with nothing. */
  trim?: boolean;
}

/** Collection a car belongs to (menu filter + themed arenas). */
export type CategoryId =
  | 'originals' | 'retro' | 'halloween' | 'winter' | 'alien' | 'dome' | 'dino'
  | 'robo' | 'summer' | 'soccer' | 'cny' | 'rift' | 'toys';

export interface CarDef {
  id: string;
  name: string;
  /** Collection for the garage filter (defaults to 'originals'). */
  category?: CategoryId;
  archetype: Archetype;
  blurb: string;
  palette: CarPalette;
  /** Collision + render polygons. */
  body: CarPoly[];
  /** Running gear (default: wheels). */
  drive?: DriveKind;
  /** A live track belt round the wheels: how far it stands off the wheel rims and its material. */
  belt?: {
    grow: number; mat: CarMat;
    /**
     * A belt that runs round its own idlers rather than the road wheels (a snow coach's track under
     * the rear of the body, with a ski in front): idler centres x0..x1 at height y, radius r, car-local,
     * and that many bogie wheels drawn turning inside it.
     */
    idlers?: { x0: number; x1: number; y: number; r: number; bogies: number };
  };
  /** Render-only decoration: window polygons, stripes. */
  windows?: Pt[][];
  stripe?: { y: number; h: number };
  wheels: WheelDef[];
  suspension: {
    /** Spring frequency, Hz. */
    hz: number;
    /** Damping ratio. */
    damping: number;
    /** Max travel from rest each way, meters. */
    travel: number;
  };
  motor: {
    /** Max motor torque per driven wheel, N·m. */
    torque: number;
    /** Top linear speed at the wheel rim, m/s. */
    speed: number;
  };
  /** Chassis density, kg/m². */
  density: number;
  /** Offset added to the computed center of mass (car-local). */
  com?: Pt;
  tireFriction: number;
  /** Driver head (sensor). Car-local. */
  head: { x: number; y: number; r: number };
  /** Max nose-up angle the ground tilt assist aims for (rad). */
  wheelie?: number;
  /** Angular acceleration available in the air, rad/s². */
  air: number;
  /** Rocket booster: pushes forward while driving forward. */
  boost?: { accel: number; fuel: number; regen: number };
  /** Extra bounce on the chassis. */
  restitution?: number;
  /** Special action on the action button; cars without one just drive. */
  ability?: AbilityDef;
  /** Passive quirks. */
  traits?: TraitDef[];
  /** Loose cargo that sits in the bed at the start of each round. */
  cargo?: CargoDef;
  /** Swinging weight on a chain. */
  flail?: FlailDef;
  /** The driver sits inside a cab under a roof: only the helmet shows, in the open window. */
  cabin?: boolean;
  /** The driver's small body under the helmet (default: seated). */
  rider?: RiderDef;
  /** A wall of light left behind (render only). */
  ribbon?: RibbonDef;
  /** Stride of the animated limbs (`gait` pieces), metres rolled per step cycle (default 1.2). */
  stride?: number;
  /** Moving pieces on hinges (trailers, booms, tails, saws). */
  links?: LinkDef[];
  /** The driver rides on this link (a crane basket, a howdah) instead of the chassis; `head` stays in car-local rest coordinates. */
  headOn?: number;
  /** Draw head/tail lights (default true). */
  lights?: boolean;
  /** Where the car's own barrel / launcher is: shots leave from here (see AbilityDef.muzzle). */
  gun?: { at: Pt[]; aim: number };
  /** Watertight hull (boats, fish, sharks…): floats and paddles in water. Not a quirk, so many cars can share it; the amphibian has the 'swim' trait on top. */
  swims?: boolean;
  /** Gravity scale for the whole car (<1 = floaty hover/flying vehicles). */
  float?: number;
  /** Animated decoration (smoke, steam, sparks, beams…): drawn only, never part of the sprite or the physics. */
  fx?: FxDef[];
}

export type FxKind = 'smoke' | 'steam' | 'wisp' | 'spark' | 'bubble' | 'frost' | 'flame' | 'trail' | 'rain' | 'bolt' | 'beam';
/**
 * One animated effect on a car, in car-local metres (facing +x). Particles leave `at`
 * heading `dir` (degrees: 0 forward, -90 up, 180 back); `bolt` and `beam` run from `at` to `to`.
 */
export interface FxDef { kind: FxKind; at: Pt; to?: Pt; dir?: number; size?: number; mat?: CarMat; rate?: number }
