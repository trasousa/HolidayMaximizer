import { describe, expect, it } from 'vitest';
import { generateSmartSuggestions } from '@/lib/services/optimizationService';
import { computePlanStats } from '@/lib/services/statsService';
import { appliesToRegion, parseNagerHolidays, parseOpenHolidays } from '@/lib/services/holidayProviders';
import { customHolidaysForYear, mergeByDate } from '@/lib/services/holidayService';
import { countBusinessDays, dayOfWeek, eachDate } from '@/lib/utils/date';
import { Holiday } from '@/lib/types';

const settings = { minPtoDays: 1, maxPtoDays: 5, minEfficiency: 1.5, requireHoliday: true };
const h = (date: string, name = 'Holiday'): Holiday => ({ date, name, scope: 'national' });

describe('date utils', () => {
  it('computes weekdays independent of the time zone', () => {
    expect(dayOfWeek('2026-01-05')).toBe(1); // Monday
    expect(dayOfWeek('2026-03-29')).toBe(0); // Sunday (DST change in Europe)
  });

  it('counts business days excluding weekends and holidays', () => {
    expect(countBusinessDays('2026-04-01', '2026-04-07', new Set(['2026-04-03']))).toBe(4);
    expect(eachDate('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });
});

describe('generateSmartSuggestions', () => {
  it('bridges a Thursday holiday with one Friday PTO day', () => {
    // 2026-06-04 is Corpus Christi (Thursday)
    const result = generateSmartSuggestions({ year: 2026, holidays: [h('2026-06-04')], settings });
    const bridge = result.find((s) => s.startDate === '2026-06-05');
    expect(bridge).toMatchObject({ endDate: '2026-06-05', costInPto: 1, totalDaysOff: 4, breakStart: '2026-06-04', breakEnd: '2026-06-07' });
  });

  it('spans multiple gaps and offers one longer alternative per period', () => {
    // Easter 2026: Good Friday Apr 3, Easter Monday Apr 6 (e.g. UK)
    const result = generateSmartSuggestions({ year: 2026, holidays: [h('2026-04-03'), h('2026-04-06')], settings: { ...settings, maxPtoDays: 8 } });
    const easter = result.filter((s) => s.breakStart <= '2026-04-12' && s.breakEnd >= '2026-03-28');
    expect(easter.length).toBeLessThanOrEqual(2);
    // Best efficiency: Apr 7–10 (4 PTO) → Apr 3–12 = 10 days (2.5x) beats Mar 30–Apr 2 (also 2.5x, earlier);
    expect(easter[0].efficiency).toBeGreaterThanOrEqual(2.5);
    // The longer alternative chains both weeks around the holidays.
    const long = easter.find((s) => s.costInPto === 8);
    expect(long?.totalDaysOff).toBe(16);
  });

  it('never charges PTO on weekends, holidays or already booked days', () => {
    const holidays = [h('2026-12-25'), h('2026-12-26'), h('2027-01-01')];
    const booked = ['2026-12-28', '2026-12-29'];
    const result = generateSmartSuggestions({ year: 2026, holidays, settings, bookedDates: booked });
    for (const s of result) {
      for (const d of s.ptoDates) {
        expect([0, 6]).not.toContain(dayOfWeek(d));
        expect(holidays.map((x) => x.date)).not.toContain(d);
        expect(booked).not.toContain(d);
      }
    }
    // Dec 30–31 joins the booked days, Christmas and New Year (2027 holiday data) into one break.
    const newYear = result.find((s) => s.startDate === '2026-12-30');
    expect(newYear).toMatchObject({ costInPto: 2, breakStart: '2026-12-25', breakEnd: '2027-01-03' });
  });

  it('respects the min efficiency, earliest date and the holiday requirement', () => {
    const holidays = [h('2026-05-01'), h('2026-10-05')];
    const all = generateSmartSuggestions({ year: 2026, holidays, settings: { ...settings, requireHoliday: false }, limit: 100 });
    expect(all.every((s) => s.efficiency >= 1.5)).toBe(true);
    const withHoliday = generateSmartSuggestions({ year: 2026, holidays, settings, limit: 100 });
    expect(withHoliday.every((s) => s.usesHoliday)).toBe(true);
    const future = generateSmartSuggestions({ year: 2026, holidays, settings, earliestDate: '2026-06-01' });
    expect(future.every((s) => s.breakStart >= '2026-06-01')).toBe(true);
    expect(future.some((s) => s.holidayDates.includes('2026-10-05'))).toBe(true);
  });

  it('supports Friday/Saturday weekends', () => {
    // Sunday holiday in a Fri/Sat weekend country → bridge after it is Monday–Thursday
    const result = generateSmartSuggestions({ year: 2026, holidays: [h('2026-09-20')], settings, weekendDays: [5, 6] });
    const s = result.find((x) => x.holidayDates.includes('2026-09-20'));
    expect(s?.ptoDates.every((d) => ![5, 6].includes(dayOfWeek(d)))).toBe(true);
  });
});

describe('computePlanStats', () => {
  const categories = [
    { id: 'PTO', name: 'PTO', color: '#000', isPto: true },
    { id: 'RemoteWork', name: 'Remote', color: '#000', isPto: false },
  ];
  const base = { profileId: 'p', commuteHours: 0 };

  it('counts only working days of PTO trips in the planning year, once', () => {
    const stats = computePlanStats({
      year: 2026,
      categories,
      holidays: [h('2026-06-04')],
      vacations: [
        { ...base, id: '1', startDate: '2026-06-01', endDate: '2026-06-05', type: 'PTO' }, // 4 working days (holiday Thu)
        { ...base, id: '2', startDate: '2026-06-03', endDate: '2026-06-03', type: 'PTO' }, // overlap, counted once
        { ...base, id: '3', startDate: '2025-12-29', endDate: '2026-01-02', type: 'PTO' }, // only Jan 1–2 in 2026
        { ...base, id: '4', startDate: '2026-07-06', endDate: '2026-07-10', type: 'RemoteWork' },
      ],
    });
    expect(stats.used).toBe(4 + 2);
    // Jun 1–5 + weekend before (May 30–31) and after (Jun 6–7) = 9; Jan 1–4 (Thu–Sun) = 4.
    expect(stats.total).toBe(9 + 4);
  });

  it('adds a previewed suggestion to the projection', () => {
    const suggestion = generateSmartSuggestions({ year: 2026, holidays: [h('2026-06-04')], settings }).find((s) => s.startDate === '2026-06-05')!;
    const stats = computePlanStats({ year: 2026, categories, holidays: [h('2026-06-04')], vacations: [], preview: suggestion });
    expect(stats.used).toBe(1);
    // Thu holiday + Fri PTO + weekend: the projection matches what the suggestion promised.
    expect(stats.total).toBe(suggestion.totalDaysOff);
    expect(stats.total).toBe(4);
    expect(stats.isProjection).toBe(true);
  });
});

describe('holiday providers', () => {
  it('keeps only day-off types from Nager.Date', () => {
    const parsed = parseNagerHolidays([
      { date: '2026-01-01', name: "New Year's Day", localName: 'Ano Novo', countryCode: 'PT', global: true, counties: null, types: ['Public'] },
      { date: '2026-02-17', name: 'Carnival', localName: 'Carnaval', countryCode: 'PT', global: true, counties: null, types: ['Optional'] },
      { date: '2026-07-01', name: 'Madeira Day', localName: 'Dia da Madeira', countryCode: 'PT', global: false, counties: ['PT-30'], types: ['Public'] },
    ]);
    expect(parsed.map((p) => p.date)).toEqual(['2026-01-01', '2026-07-01']);
    expect(parsed[1].regions).toEqual(['PT-30']);
  });

  it('parses OpenHolidays and matches municipality codes to their district', () => {
    const parsed = parseOpenHolidays(
      [
        { startDate: '2026-06-13', endDate: '2026-06-13', type: 'Public', nationwide: false, name: [{ language: 'EN', text: 'St. Anthony' }, { language: 'PT', text: 'Santo António' }], subdivisions: [{ code: 'PT-LI-LI' }] },
        { startDate: '2026-12-24', endDate: '2026-12-25', type: 'Public', nationwide: true, name: [{ language: 'EN', text: 'Christmas' }] },
        { startDate: '2026-02-17', endDate: '2026-02-17', type: 'Optional', nationwide: true, name: [{ language: 'EN', text: 'Carnival' }] },
      ],
      'PT'
    );
    expect(parsed.map((p) => p.date)).toEqual(['2026-06-13', '2026-12-24', '2026-12-25']);
    expect(parsed[0].localName).toBe('Santo António');
    expect(appliesToRegion(parsed[0], 'PT-LI-LI')).toBe(true);
    expect(appliesToRegion(parsed[0], 'PT-PO-PO')).toBe(false);
    expect(appliesToRegion({ ...parsed[0], regions: ['PT-LI'] }, 'PT-LI-LI')).toBe(true);
    expect(appliesToRegion(parsed[1], undefined)).toBe(true);
  });

  it('merges same-day holidays and materialises recurring custom ones', () => {
    const merged = mergeByDate([h('2026-06-24', 'A'), { ...h('2026-06-24', 'B'), scope: 'regional' }]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ name: 'A / B', scope: 'national' });
    const custom = customHolidaysForYear(
      [
        { id: '1', date: '2025-06-13', name: 'Santo António', recurring: true },
        { id: '2', date: '2026-03-02', name: 'Company day', recurring: false },
        { id: '3', date: '2027-03-02', name: 'Next year', recurring: false },
      ],
      2026
    );
    expect(custom.map((c) => c.date)).toEqual(['2026-06-13', '2026-03-02']);
  });
});
