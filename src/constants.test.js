import { describe, it, expect, beforeEach } from 'vitest';
import {
  REGIONS,
  TIMELINE_STEPS,
  LANGUAGES,
  DATE_PATTERNS,
  buildSystemPrompt,
  parseDateString,
  generateCalendarUrl,
  loadState,
  saveState,
  clearState,
} from './constants';

// ──────────────────────────────────────────────
// Data shape / integrity tests
// ──────────────────────────────────────────────
describe('REGIONS', () => {
  it('contains at least two region groups', () => {
    expect(REGIONS.length).toBeGreaterThanOrEqual(2);
  });

  it('each group has a group name and options array', () => {
    REGIONS.forEach((group) => {
      expect(group).toHaveProperty('group');
      expect(group).toHaveProperty('options');
      expect(Array.isArray(group.options)).toBe(true);
      expect(group.options.length).toBeGreaterThan(0);
    });
  });

  it('includes Indian states', () => {
    const indiaGroup = REGIONS.find((g) => g.group === 'India');
    expect(indiaGroup).toBeDefined();
    expect(indiaGroup.options).toContain('India — Delhi (NCT)');
    expect(indiaGroup.options).toContain('India — Karnataka');
  });

  it('each option is a non-empty string', () => {
    REGIONS.forEach((group) => {
      group.options.forEach((opt) => {
        expect(typeof opt).toBe('string');
        expect(opt.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('TIMELINE_STEPS', () => {
  it('has exactly 5 steps', () => {
    expect(TIMELINE_STEPS).toHaveLength(5);
  });

  it('each step has id, title, description, and icon', () => {
    TIMELINE_STEPS.forEach((step) => {
      expect(step).toHaveProperty('id');
      expect(step).toHaveProperty('title');
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('icon');
      expect(typeof step.id).toBe('number');
      expect(typeof step.title).toBe('string');
    });
  });

  it('steps are numbered 1 through 5', () => {
    const ids = TIMELINE_STEPS.map((s) => s.id);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('LANGUAGES', () => {
  it('has at least 10 language options', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(10);
  });

  it('each language has code, name, and native fields', () => {
    LANGUAGES.forEach((lang) => {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('name');
      expect(lang).toHaveProperty('native');
      expect(typeof lang.code).toBe('string');
      expect(typeof lang.name).toBe('string');
    });
  });

  it('includes English as the first language', () => {
    expect(LANGUAGES[0].name).toBe('English');
  });

  it('includes Hindi', () => {
    const hindi = LANGUAGES.find((l) => l.name === 'Hindi');
    expect(hindi).toBeDefined();
    expect(hindi.native).toBe('हिन्दी');
  });
});

// ──────────────────────────────────────────────
// buildSystemPrompt
// ──────────────────────────────────────────────
describe('buildSystemPrompt', () => {
  it('returns a string containing the region', () => {
    const prompt = buildSystemPrompt('India — Delhi (NCT)', 'English');
    expect(prompt).toContain('India — Delhi (NCT)');
  });

  it('includes BallotBuddy identity', () => {
    const prompt = buildSystemPrompt('United States', 'English');
    expect(prompt).toContain('BallotBuddy');
  });

  it('does not add language prefix for English', () => {
    const prompt = buildSystemPrompt('India — Delhi (NCT)', 'English');
    expect(prompt).not.toMatch(/^Respond in/);
  });

  it('adds language prefix for non-English', () => {
    const prompt = buildSystemPrompt('India — Tamil Nadu', 'Tamil');
    expect(prompt).toMatch(/^Respond in Tamil:/);
  });

  it('handles empty region gracefully', () => {
    const prompt = buildSystemPrompt('', 'English');
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('BallotBuddy');
  });
});

// ──────────────────────────────────────────────
// DATE_PATTERNS
// ──────────────────────────────────────────────
describe('DATE_PATTERNS', () => {
  it('matches "January 15, 2026"', () => {
    const text = 'The deadline is January 15, 2026.';
    const found = DATE_PATTERNS.some((p) => {
      const regex = new RegExp(p.source, p.flags);
      return regex.test(text);
    });
    expect(found).toBe(true);
  });

  it('matches "15th March"', () => {
    const text = 'Come on 15th March to vote.';
    const found = DATE_PATTERNS.some((p) => {
      const regex = new RegExp(p.source, p.flags);
      return regex.test(text);
    });
    expect(found).toBe(true);
  });

  it('matches ISO format "2026-01-15"', () => {
    const text = 'Date: 2026-01-15';
    const found = DATE_PATTERNS.some((p) => {
      const regex = new RegExp(p.source, p.flags);
      return regex.test(text);
    });
    expect(found).toBe(true);
  });

  it('matches "15/01/2026"', () => {
    const text = 'Registration closes on 15/01/2026';
    const found = DATE_PATTERNS.some((p) => {
      const regex = new RegExp(p.source, p.flags);
      return regex.test(text);
    });
    expect(found).toBe(true);
  });

  it('does not match random text without dates', () => {
    const text = 'Hello, welcome to the voting guide!';
    const found = DATE_PATTERNS.some((p) => {
      const regex = new RegExp(p.source, p.flags);
      return regex.test(text);
    });
    expect(found).toBe(false);
  });
});

// ──────────────────────────────────────────────
// parseDateString
// ──────────────────────────────────────────────
describe('parseDateString', () => {
  it('parses a standard date like "January 15, 2026"', () => {
    const result = parseDateString('January 15, 2026');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(15);
  });

  it('parses ISO format "2026-03-20"', () => {
    const result = parseDateString('2026-03-20');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
  });

  it('parses Indian dd/mm/yyyy format "15/01/2026"', () => {
    const result = parseDateString('15/01/2026');
    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getFullYear()).toBe(2026);
  });

  it('returns null for invalid date strings', () => {
    const result = parseDateString('not a date');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseDateString('');
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────────────
// generateCalendarUrl
// ──────────────────────────────────────────────
describe('generateCalendarUrl', () => {
  it('returns a Google Calendar URL', () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const url = generateCalendarUrl('Election Day', date);
    expect(url).toContain('https://calendar.google.com/calendar/render');
  });

  it('includes the event title', () => {
    const date = new Date(2026, 0, 15);
    const url = generateCalendarUrl('Voter Registration Deadline', date);
    expect(url).toContain('Voter+Registration+Deadline');
  });

  it('includes the formatted date', () => {
    const date = new Date(2026, 0, 15);
    const url = generateCalendarUrl('Test', date);
    expect(url).toContain('20260115');
  });

  it('includes BallotBuddy in the details', () => {
    const date = new Date(2026, 5, 1);
    const url = generateCalendarUrl('Test', date);
    expect(url).toContain('BallotBuddy');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2026, 2, 5); // March 5
    const url = generateCalendarUrl('Test', date);
    expect(url).toContain('20260305');
  });
});

// ──────────────────────────────────────────────
// localStorage helpers
// ──────────────────────────────────────────────
describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveState', () => {
    it('saves state to localStorage', () => {
      const state = { region: 'India', started: true };
      saveState(state);
      const raw = localStorage.getItem('ballotbuddy_state');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw)).toEqual(state);
    });
  });

  describe('loadState', () => {
    it('returns null when no state saved', () => {
      expect(loadState()).toBeNull();
    });

    it('returns parsed state from localStorage', () => {
      const state = { region: 'USA', fontSize: 'large' };
      localStorage.setItem('ballotbuddy_state', JSON.stringify(state));
      expect(loadState()).toEqual(state);
    });

    it('returns null for corrupted JSON', () => {
      localStorage.setItem('ballotbuddy_state', '{broken json');
      expect(loadState()).toBeNull();
    });
  });

  describe('clearState', () => {
    it('removes state from localStorage', () => {
      localStorage.setItem('ballotbuddy_state', '{"test": true}');
      clearState();
      expect(localStorage.getItem('ballotbuddy_state')).toBeNull();
    });
  });
});
