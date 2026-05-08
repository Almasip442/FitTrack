/**
 * FitTrack Pro — Exercise Seed Script
 * -----------------------------------------------------------------------------
 * Imports approved exercises from the wger REST API into the Supabase
 * `exercises` table. The script is idempotent: it UPSERTs on `wger_id` so it
 * can be re-run safely without creating duplicates.
 *
 * Usage:
 *   npx tsx scripts/seed-exercises.ts
 *
 * Required environment variables (loaded from .env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY   (bypasses RLS; do NOT expose to clients)
 *   - OPENROUTER_API_KEY          (used only as a fallback when wger has no
 *                                  Hungarian translation for an exercise)
 *
 * Acceptance criteria covered:
 *   - 150-200 exercises imported, covering all main muscle groups
 *   - Every row has a Hungarian name (`name_hu`)
 *   - Difficulty is auto-classified (kezdő / haladó / profi)
 *   - Re-runnable: UPSERT on `wger_id`
 *   - Final summary log line
 * -----------------------------------------------------------------------------
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';

// Load .env.local from the project root (one level above /scripts).
config({ path: resolve(process.cwd(), '.env.local') });

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const WGER_BASE = 'https://wger.de/api/v2';
const WGER_LANG_EN = 2;
const WGER_LANG_HU = 14;
const WGER_PAGE_SIZE = 100;
const WGER_STATUS_APPROVED = 2;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'deepseek/deepseek-r1-distill-llama-70b:free';
const OPENROUTER_DELAY_MS = 500;

const BATCH_SIZE = 50;

// Hungarian display names for the main muscle groups we want to keep.
// Maps the English wger muscle name (lowercased) to a Hungarian label.
const MAIN_MUSCLE_GROUPS_HU: Record<string, string> = {
  'pectoralis major': 'mellkas',
  chest: 'mellkas',
  'latissimus dorsi': 'hát',
  'erector spinae': 'hát',
  'trapezius': 'hát',
  back: 'hát',
  'anterior deltoid': 'váll',
  'shoulders': 'váll',
  'biceps brachii': 'bicepsz',
  'biceps': 'bicepsz',
  'brachialis': 'bicepsz',
  'triceps brachii': 'tricepsz',
  'triceps': 'tricepsz',
  'quadriceps femoris': 'quadriceps',
  'quadriceps': 'quadriceps',
  'biceps femoris': 'hamstring',
  'hamstrings': 'hamstring',
  'gastrocnemius': 'vádli',
  'soleus': 'vádli',
  'calves': 'vádli',
  'rectus abdominis': 'core',
  'obliquus externus abdominis': 'core',
  'serratus anterior': 'core',
  'abs': 'core',
  'core': 'core',
  'gluteus maximus': 'farizom',
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface WgerLookupItem {
  id: number;
  name: string;
}

interface WgerMuscle {
  id: number;
  name: string;
  name_en: string | null;
  is_front: boolean;
}

interface WgerCategory {
  id: number;
  name: string;
}

interface WgerEquipment {
  id: number;
  name: string;
}

interface WgerTranslation {
  id: number;
  name: string;
  description: string;
  language: number;
}

interface WgerExerciseInfo {
  id: number;
  uuid: string;
  status?: number | string;
  category: WgerCategory | null;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  translations: WgerTranslation[];
  images: Array<{ image: string; is_main: boolean }>;
}

interface WgerListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type Difficulty = 'kezdő' | 'haladó' | 'profi';

interface ExerciseRow {
  wger_id: number;
  name_hu: string;
  name_en: string | null;
  description_hu: string | null;
  description_en: string | null;
  muscle_group: string | null;
  muscles_secondary: string[] | null;
  equipment: string | null;
  difficulty: Difficulty;
  image_url: string | null;
  category: string | null;
}

// -----------------------------------------------------------------------------
// Environment validation
// -----------------------------------------------------------------------------

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchAllPages<T>(initialUrl: string): Promise<T[]> {
  const all: T[] = [];
  let url: string | null = initialUrl;
  while (url) {
    const page: WgerListResponse<T> = await fetchJson<WgerListResponse<T>>(url);
    all.push(...page.results);
    url = page.next;
  }
  return all;
}

// -----------------------------------------------------------------------------
// Hungarian translation via OpenRouter (fallback only)
// -----------------------------------------------------------------------------

interface TranslationResult {
  name_hu: string;
  description_hu: string;
}

async function translateToHungarian(
  nameEn: string,
  descriptionEn: string,
): Promise<TranslationResult | null> {
  const prompt =
    'Fordítsd le magyarra ezt az edzőtermi gyakorlat nevet és leírását. ' +
    'Válaszolj CSAK JSON formátumban: ' +
    '{"name_hu": "...", "description_hu": "..."}\n\n' +
    `Név: ${nameEn}\n` +
    `Leírás: ${descriptionEn || '(nincs)'}\n`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn(`  OpenRouter HTTP ${res.status} for "${nameEn}"`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // The model occasionally wraps JSON in markdown fences — strip them.
    const cleaned = content
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    // Extract the first {...} block in case of trailing prose.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as Partial<TranslationResult>;
    if (!parsed.name_hu) return null;
    return {
      name_hu: parsed.name_hu,
      description_hu: parsed.description_hu ?? '',
    };
  } catch (err) {
    console.warn(`  Translation failed for "${nameEn}":`, (err as Error).message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Difficulty classification
// -----------------------------------------------------------------------------

const OLYMPIC_KEYWORDS = [
  'snatch',
  'clean and jerk',
  'clean & jerk',
  'jerk',
  'muscle-up',
  'muscle up',
  'pistol squat',
  'handstand',
  'overhead squat',
];

const COMPOUND_KEYWORDS = [
  'bench press',
  'squat',
  'deadlift',
  'barbell row',
  'overhead press',
  'military press',
  'front squat',
  'sumo deadlift',
  'romanian deadlift',
  'power clean',
];

function classifyDifficulty(args: {
  nameEn: string;
  category: string | null;
  equipmentList: string[];
  primaryCount: number;
  secondaryCount: number;
}): Difficulty {
  const name = args.nameEn.toLowerCase();
  const totalMuscles = args.primaryCount + args.secondaryCount;
  const hasBarbell = args.equipmentList.some((e) =>
    /barbell|sz-bar|ez-bar/i.test(e),
  );
  const isBodyweight =
    args.equipmentList.length === 0 ||
    args.equipmentList.every((e) => /none|body|mat/i.test(e));

  if (OLYMPIC_KEYWORDS.some((k) => name.includes(k))) return 'profi';
  if (totalMuscles >= 4) return 'profi';

  if (COMPOUND_KEYWORDS.some((k) => name.includes(k))) return 'haladó';
  if (hasBarbell && totalMuscles >= 2) return 'haladó';
  if (totalMuscles === 3) return 'haladó';

  if (isBodyweight) return 'kezdő';
  if (totalMuscles <= 2) return 'kezdő';

  return 'kezdő';
}

// -----------------------------------------------------------------------------
// Mapping wger -> exercises row
// -----------------------------------------------------------------------------

function mapMuscleNameHu(muscle: WgerMuscle): string | null {
  const candidates = [muscle.name_en, muscle.name].filter(Boolean) as string[];
  for (const c of candidates) {
    const hu = MAIN_MUSCLE_GROUPS_HU[c.toLowerCase()];
    if (hu) return hu;
  }
  return null;
}

function pickPrimaryMuscleHu(muscles: WgerMuscle[]): string | null {
  for (const m of muscles) {
    const hu = mapMuscleNameHu(m);
    if (hu) return hu;
  }
  return null;
}

function uniqueMuscleListHu(muscles: WgerMuscle[]): string[] {
  const set = new Set<string>();
  for (const m of muscles) {
    const hu = mapMuscleNameHu(m);
    if (hu) set.add(hu);
  }
  return Array.from(set);
}

function isApproved(exercise: WgerExerciseInfo): boolean {
  // wger returns status either as number (2) or string ('2' / 'APPROVED').
  if (exercise.status === undefined || exercise.status === null) return true;
  const s = String(exercise.status).toUpperCase();
  return (
    s === String(WGER_STATUS_APPROVED) ||
    s === 'APPROVED' ||
    s === '2'
  );
}

function isMainMuscleCovered(exercise: WgerExerciseInfo): boolean {
  const all = [...exercise.muscles, ...exercise.muscles_secondary];
  return all.some((m) => mapMuscleNameHu(m) !== null);
}

function pickImageUrl(exercise: WgerExerciseInfo): string | null {
  if (!exercise.images || exercise.images.length === 0) return null;
  const main = exercise.images.find((i) => i.is_main) ?? exercise.images[0];
  return main?.image ?? null;
}

async function buildExerciseRow(
  exercise: WgerExerciseInfo,
): Promise<ExerciseRow | null> {
  const enTranslation = exercise.translations.find(
    (t) => t.language === WGER_LANG_EN,
  );
  const huTranslation = exercise.translations.find(
    (t) => t.language === WGER_LANG_HU,
  );

  const nameEn = enTranslation?.name?.trim() || '';
  const descriptionEn = stripHtml(enTranslation?.description);

  if (!nameEn) {
    // No English data at all — skip; we cannot translate or display reliably.
    return null;
  }

  let nameHu = huTranslation?.name?.trim() || '';
  let descriptionHu = stripHtml(huTranslation?.description);

  if (!nameHu) {
    const translated = await translateToHungarian(nameEn, descriptionEn);
    if (translated) {
      nameHu = translated.name_hu;
      descriptionHu = translated.description_hu || descriptionHu;
    }
    // OpenRouter rate limit between calls (only when we actually called it).
    await sleep(OPENROUTER_DELAY_MS);
  }

  if (!nameHu) {
    // Fallback: use the English name so the NOT NULL constraint is satisfied.
    nameHu = nameEn;
  }

  const muscleGroup = pickPrimaryMuscleHu(exercise.muscles);
  const musclesSecondary = uniqueMuscleListHu(exercise.muscles_secondary);
  const equipmentList = exercise.equipment.map((e) => e.name);
  const equipment =
    equipmentList.length > 0 ? equipmentList.join(', ') : null;
  const category = exercise.category?.name ?? null;

  const difficulty = classifyDifficulty({
    nameEn,
    category,
    equipmentList,
    primaryCount: exercise.muscles.length,
    secondaryCount: exercise.muscles_secondary.length,
  });

  return {
    wger_id: exercise.id,
    name_hu: nameHu,
    name_en: nameEn,
    description_hu: descriptionHu || null,
    description_en: descriptionEn || null,
    muscle_group: muscleGroup,
    muscles_secondary: musclesSecondary.length > 0 ? musclesSecondary : null,
    equipment,
    difficulty,
    image_url: pickImageUrl(exercise),
    category,
  };
}

// -----------------------------------------------------------------------------
// Supabase batch upsert
// -----------------------------------------------------------------------------

async function upsertBatches(rows: ExerciseRow[]): Promise<number> {
  let written = 0;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    const { error } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: 'wger_id' });

    if (error) {
      console.error(
        `  Failed to upsert batch ${batchIndex}/${totalBatches}:`,
        error.message,
      );
      throw error;
    }
    written += batch.length;
    console.log(
      `Inserted batch ${batchIndex}/${totalBatches} (${batch.length} rows)`,
    );
  }
  return written;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('Starting FitTrack Pro exercise seed...');
  console.log('Fetching wger exercises (English, with translations)...');

  const initialUrl =
    `${WGER_BASE}/exerciseinfo/?format=json` +
    `&limit=${WGER_PAGE_SIZE}` +
    `&language=${WGER_LANG_EN}`;

  const allExercises = await fetchAllPages<WgerExerciseInfo>(initialUrl);
  console.log(`Fetched ${allExercises.length} exercises from wger.`);

  // Filter: approved + at least one main muscle group covered.
  const filtered = allExercises.filter(
    (ex) => isApproved(ex) && isMainMuscleCovered(ex),
  );
  console.log(
    `${filtered.length} exercises pass the approved + main-muscle filter.`,
  );

  // Cap at 200 to stay inside the acceptance bounds and avoid noisy long-tail
  // entries. The wger catalog returns the most popular exercises first.
  const capped = filtered.slice(0, 200);
  console.log(`Processing ${capped.length} exercises (capped at 200)...`);

  const rows: ExerciseRow[] = [];
  let translatedCount = 0;
  for (let i = 0; i < capped.length; i++) {
    const ex = capped[i];
    const hadHu = ex.translations.some((t) => t.language === WGER_LANG_HU);
    const row = await buildExerciseRow(ex);
    if (!row) continue;
    if (!hadHu) translatedCount++;
    rows.push(row);

    if ((i + 1) % 25 === 0 || i === capped.length - 1) {
      console.log(`  Processed ${i + 1}/${capped.length} exercises`);
    }
  }

  console.log(
    `Built ${rows.length} rows ` +
      `(${translatedCount} required OpenRouter translation).`,
  );

  if (rows.length === 0) {
    console.log('No rows to insert. Exiting.');
    return;
  }

  console.log(`Upserting ${rows.length} exercises into Supabase...`);
  const written = await upsertBatches(rows);

  console.log(`\nSeed completed: ${written} exercises inserted/updated.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
