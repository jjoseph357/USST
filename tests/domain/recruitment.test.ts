import { describe, it, expect } from 'vitest';
import {
  SUBSYSTEMS_DATA,
  SELLING_POINTS_DATA,
  ROLE_TRACKS_DATA,
  SEED_BACKLOG,
  ROADMAP_PHASES_DATA,
  SEED_TASKS,
  FLIGHT_VIDEOS_DATA
} from '../../src/data/seed-schedule';

describe('Recruitment & Project Data Models', () => {
  it('contains exactly 6 core avionics subsystems matching the technical specification', () => {
    expect(SUBSYSTEMS_DATA.length).toBe(6);

    const numbers = SUBSYSTEMS_DATA.map(s => s.number);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);

    const titles = SUBSYSTEMS_DATA.map(s => s.title);
    expect(titles).toContain('Custom Flight Computer Hardware');
    expect(titles).toContain('Switch & Power Architecture Subsystem');
    expect(titles).toContain('Flight Software, Navigation & RTOS Infrastructure');
    expect(titles).toContain('RF Communications, Telemetry & Payload Integration');
    expect(titles).toContain('Custom Mission Ground Station & Full-Stack Web Dashboard');
    expect(titles).toContain('Airframe & Mechanical Integration');

    // Each subsystem must have clear goals, focus areas, and starter onboarding projects
    for (const sub of SUBSYSTEMS_DATA) {
      expect(sub.goal.length).toBeGreaterThan(10);
      expect(sub.keyFocusAreas.length).toBeGreaterThanOrEqual(2);
      expect(sub.starterProjects.length).toBeGreaterThanOrEqual(1);
      expect(sub.techStack.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('contains the 3 key selling points for new recruits', () => {
    expect(SELLING_POINTS_DATA.length).toBe(3);
    expect(SELLING_POINTS_DATA[0].title).toContain('Hands-On Experience from Day 1');
    expect(SELLING_POINTS_DATA[1].title).toContain('Industry-Grade Technical Stack');
    expect(SELLING_POINTS_DATA[2].title).toContain('End-to-End Ownership');
  });

  it('defines interactive role tracks covering all major engineering disciplines', () => {
    const trackIds = ROLE_TRACKS_DATA.map(t => t.id);
    expect(trackIds).toContain('all');
    expect(trackIds).toContain('hardware');
    expect(trackIds).toContain('firmware');
    expect(trackIds).toContain('algorithms');
    expect(trackIds).toContain('rf');
    expect(trackIds).toContain('fullstack');
    expect(trackIds).toContain('mechanical');
    expect(trackIds).toContain('beginner');

    const beginnerTrack = ROLE_TRACKS_DATA.find(t => t.id === 'beginner')!;
    expect(beginnerTrack.starterTaskNames.length).toBeGreaterThan(0);
  });

  it('verifies all 22 tasks in the technical backlog match the exact priorities and effort sizing', () => {
    expect(SEED_BACKLOG.length).toBe(22);

    // Hardware tasks
    const hwTasks = SEED_BACKLOG.filter(t => t.subsystem === 'Hardware');
    expect(hwTasks.length).toBe(14);

    // Software tasks
    const swTasks = SEED_BACKLOG.filter(t => t.subsystem === 'Software');
    expect(swTasks.length).toBe(8);

    // Sizing verification: Hardware total is 11.4 member-terms
    const hwTotalEffort = hwTasks.reduce((acc, t) => acc + (t.sizingTerms || 0), 0);
    expect(Math.round(hwTotalEffort * 10) / 10).toBe(11.4);

    // Software total is 7.6 member-terms
    const swTotalEffort = swTasks.reduce((acc, t) => acc + (t.sizingTerms || 0), 0);
    expect(Math.round(swTotalEffort * 10) / 10).toBe(7.6);

    // Combined effort is 19.0 member-terms
    const combinedTotal = hwTotalEffort + swTotalEffort;
    expect(Math.round(combinedTotal * 10) / 10).toBe(19.0);

    // Specific task checks
    const fcSchematic = SEED_BACKLOG.find(t => t.title.includes('FC Schematic Design'))!;
    expect(fcSchematic.priority).toBe('1');
    expect(fcSchematic.sizingTerms).toBe(2.0);

    const ukf = SEED_BACKLOG.find(t => t.title.includes('Unscented Kalman Filter'))!;
    expect(ukf.priority).toBe('4');
    expect(ukf.sizingTerms).toBe(1.5);

    const watchdog = SEED_BACKLOG.find(t => t.title.includes('Watchdog'))!;
    expect(watchdog.priority).toBe('1');
    expect(watchdog.sizingTerms).toBe(0.1);
    expect(watchdog.isStarterProject).toBe(true);

    const zephyr = SEED_BACKLOG.find(t => t.title.includes('Zephyr RTOS'))!;
    expect(zephyr.priority).toBe('9');
    expect(zephyr.sizingTerms).toBe(2.0);
  });

  it('validates the 7 roadmap phases leading to Launch Canada 2027', () => {
    expect(ROADMAP_PHASES_DATA.length).toBe(7);

    // Phase 1 begins in Sep 2026 with IDR
    expect(ROADMAP_PHASES_DATA[0].phaseName).toContain('Onboarding & Requirements');
    const idr = ROADMAP_PHASES_DATA[0].milestones.find(m => m.name.includes('Initial Design Review'))!;
    expect(idr.startDate).toBe('2026-09-25');
    expect(idr.isMajorReview).toBe(true);

    // Phase 7 is Launch Canada 2027 Competition
    const finalPhase = ROADMAP_PHASES_DATA[6];
    expect(finalPhase.phaseName).toContain('Launch Canada 2027');
    const comp = finalPhase.milestones.find(m => m.name.includes('Launch Canada 2027 Competition'))!;
    expect(comp.startDate).toBe('2027-08-10');
    expect(comp.endDate).toBe('2027-08-16');
  });

  it('verifies SEED_TASKS contains all required milestone deliverables and university breaks', () => {
    const milestoneIds = SEED_TASKS.map(t => t.id);
    expect(milestoneIds).toContain('recruitment');
    expect(milestoneIds).toContain('requirements');
    expect(milestoneIds).toContain('idr-review');
    expect(milestoneIds).toContain('pdr-review');
    expect(milestoneIds).toContain('cdr-review');
    expect(milestoneIds).toContain('hw-freeze');
    expect(milestoneIds).toContain('power-testing');
    expect(milestoneIds).toContain('ground-station-pcb');
    expect(milestoneIds).toContain('sensor-integration');
    expect(milestoneIds).toContain('sw-freeze');
    expect(milestoneIds).toContain('radio-testing');
    expect(milestoneIds).toContain('hitl-testing');
    expect(milestoneIds).toContain('airframe-integration');
    expect(milestoneIds).toContain('vehicle-harnessing');
    expect(milestoneIds).toContain('flight-readiness');
    expect(milestoneIds).toContain('launch-canada');

    // University academic breaks
    expect(milestoneIds).toContain('fall-reading-week');
    expect(milestoneIds).toContain('fall-exam-blackout');
    expect(milestoneIds).toContain('winter-reading-week');
    expect(milestoneIds).toContain('winter-exam-blackout');
  });

  it('maps every backlog task to a core subsystem (1-5) and tracks effort per subsystem', () => {
    for (const task of SEED_BACKLOG) {
      expect(task.subsystemId).toBeDefined();
      expect(task.subsystemId).toBeGreaterThanOrEqual(1);
      expect(task.subsystemId).toBeLessThanOrEqual(5);
      expect(task.subsystemName).toBeDefined();
      expect(task.subsystemName!.length).toBeGreaterThan(0);
    }

    // Subsystem 1: Custom Flight Computer Hardware (5 tasks, 5.8 member-terms)
    const sub1 = SEED_BACKLOG.filter(t => t.subsystemId === 1);
    expect(sub1.length).toBe(5);
    const sub1Effort = sub1.reduce((sum, t) => sum + (t.sizingTerms || 0), 0);
    expect(Math.round(sub1Effort * 10) / 10).toBe(5.8);

    // Subsystem 2: Switch & Power Architecture (4 tasks, 1.7 member-terms)
    const sub2 = SEED_BACKLOG.filter(t => t.subsystemId === 2);
    expect(sub2.length).toBe(4);
    const sub2Effort = sub2.reduce((sum, t) => sum + (t.sizingTerms || 0), 0);
    expect(Math.round(sub2Effort * 10) / 10).toBe(1.7);

    // Subsystem 3: Flight Software, Navigation & RTOS (5 tasks, 5.1 member-terms)
    const sub3 = SEED_BACKLOG.filter(t => t.subsystemId === 3);
    expect(sub3.length).toBe(5);
    const sub3Effort = sub3.reduce((sum, t) => sum + (t.sizingTerms || 0), 0);
    expect(Math.round(sub3Effort * 10) / 10).toBe(5.1);

    // Subsystem 4: RF Communications & Telemetry (5 tasks, 3.4 member-terms)
    const sub4 = SEED_BACKLOG.filter(t => t.subsystemId === 4);
    expect(sub4.length).toBe(5);
    const sub4Effort = sub4.reduce((sum, t) => sum + (t.sizingTerms || 0), 0);
    expect(Math.round(sub4Effort * 10) / 10).toBe(3.4);

    // Subsystem 5: Ground Station & Web Dashboard (3 tasks, 3.0 member-terms)
    const sub5 = SEED_BACKLOG.filter(t => t.subsystemId === 5);
    expect(sub5.length).toBe(3);
    const sub5Effort = sub5.reduce((sum, t) => sum + (t.sizingTerms || 0), 0);
    expect(Math.round(sub5Effort * 10) / 10).toBe(3.0);
  });

  it('identifies starter mini-projects across hardware and software tracks', () => {
    const starterTasks = SEED_BACKLOG.filter(t => t.isStarterProject);
    expect(starterTasks.length).toBe(7);

    const starterHw = starterTasks.filter(t => t.subsystem === 'Hardware');
    expect(starterHw.length).toBe(4);

    const starterSw = starterTasks.filter(t => t.subsystem === 'Software');
    expect(starterSw.length).toBe(3);

    const starterTotalEffort = starterTasks.reduce((sum, t) => sum + (t.sizingTerms || 0), 0);
    expect(Math.round(starterTotalEffort * 10) / 10).toBe(3.3);
  });

  it('configures the 3 flight footage videos with correct paths and the 40s offset for rocket cam', () => {
    expect(FLIGHT_VIDEOS_DATA.length).toBe(3);

    const rocketVid = FLIGHT_VIDEOS_DATA.find(v => v.id === 'rocket')!;
    expect(rocketVid).toBeDefined();
    expect(rocketVid.sourceUrl).toContain('lc2026_launch.mp4');
    expect(rocketVid.startTimeSeconds).toBe(40);
    expect(rocketVid.sourceUrl).toContain('#t=40');

    const streamVid = FLIGHT_VIDEOS_DATA.find(v => v.id === 'livestream')!;
    expect(streamVid).toBeDefined();
    expect(streamVid.sourceUrl).toContain('ScreenRecording_08-17-2026');

    const groundVid = FLIGHT_VIDEOS_DATA.find(v => v.id === 'ground')!;
    expect(groundVid).toBeDefined();
    expect(groundVid.sourceUrl).toContain('IMG_8186.MOV');
    expect(groundVid.startTimeSeconds).toBe(34);
    expect(groundVid.sourceUrl).toContain('#t=34');
  });
});
