using simulynx from '../db/schema';

service WorkforceService @(path: 'workforce') {
  @readonly entity Organizations as projection on simulynx.Organizations;
  @readonly entity Departments as projection on simulynx.Departments;
  @readonly entity DepartmentSkills as projection on simulynx.DepartmentSkills;
  @readonly entity Roles as projection on simulynx.Roles;
  @readonly entity SkillRequirements as projection on simulynx.SkillRequirements;
  @readonly entity Skills as projection on simulynx.Skills;
  @readonly entity Personas as projection on simulynx.Personas;
  @readonly entity PersonaSkills as projection on simulynx.PersonaSkills;
  @readonly entity SkillGaps as projection on simulynx.SkillGaps;
  @readonly entity CareerPaths as projection on simulynx.CareerPaths;
  @readonly entity CareerPathSteps as projection on simulynx.CareerPathSteps;
  @readonly entity MobilityOptions as projection on simulynx.MobilityOptions;
  @readonly entity Locations as projection on simulynx.Locations;
  @readonly entity CareerStages as projection on simulynx.CareerStages;
  @readonly entity WorkModels as projection on simulynx.WorkModels;
}
