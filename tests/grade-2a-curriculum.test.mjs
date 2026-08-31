import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const graph=JSON.parse(await readFile(new URL('../curriculum/grade-2a.skill-graph.json',import.meta.url),'utf8'));
const skills=new Map(graph.skills.map(skill=>[skill.id,skill]));

function assertKnown(ids,label){
  for(const id of ids) assert.ok(skills.has(id),`${label} references unknown skill ${id}`);
}

test('Grade 2A graph is planning-only and cannot silently alter runtime progression',()=>{
  assert.equal(graph.status,'planning-only');
  assert.equal(graph.runtimeIntegration,false);
  assert.equal(graph.scopePolicy.commonGraph,true);
  assert.equal(graph.scopePolicy.publisherLayersAreChildFacing,false);
  assert.equal(graph.scopePolicy.schoolProgressMayAffectSurfacingOnly,true);
  assert.equal(graph.scopePolicy.masteryControlsProgression,true);
  assert.equal(graph.scopePolicy.questionBankIncluded,false);
});

test('skill ids are unique, stable-shaped and prerequisites resolve',()=>{
  assert.equal(skills.size,graph.skills.length);
  for(const skill of graph.skills){
    assert.match(skill.id,/^g2a\.[a-z]+(?:[a-z-]*\.)?[a-z0-9-]+$/);
    assert.ok(skill.title.length>0);
    assert.ok(skill.domain.length>0);
    assertKnown(skill.prerequisites,`${skill.id} prerequisites`);
    assert.ok(Array.isArray(skill.externalPrerequisites));
    assert.ok(skill.curriculumCodes.length>0);
    for(const code of skill.curriculumCodes) assert.ok(graph.curriculumCodes[code],`${skill.id} uses undocumented curriculum code ${code}`);
  }
});

test('prerequisite graph is acyclic',()=>{
  const visiting=new Set();
  const visited=new Set();
  const visit=id=>{
    if(visited.has(id)) return;
    assert.ok(!visiting.has(id),`cycle detected at ${id}`);
    visiting.add(id);
    for(const prerequisite of skills.get(id).prerequisites) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  };
  for(const id of skills.keys()) visit(id);
});

test('every skill has misconception, hint, retry, mastery and review metadata',()=>{
  const catalog=graph.pedagogyCatalog;
  for(const skill of graph.skills){
    const p=skill.pedagogy;
    assert.ok(p.misconceptions.length>0,`${skill.id} lacks misconceptions`);
    for(const id of p.misconceptions) assert.ok(catalog.misconceptions[id],`${skill.id} has unknown misconception ${id}`);
    assert.ok(catalog.hintStrategies[p.hintStrategy],`${skill.id} has unknown hint strategy`);
    assert.ok(catalog.retryStrategies[p.retryStrategy],`${skill.id} has unknown retry strategy`);
    assert.ok(catalog.masteryProfiles[p.masteryProfile],`${skill.id} has unknown mastery profile`);
    assert.ok(catalog.reviewProfiles[p.reviewProfile],`${skill.id} has unknown review profile`);
  }
});

test('bounded Grade 2A coverage areas are populated and scope-consistent',()=>{
  const required=new Set([
    'place-value-200','nani-300-extension','two-digit-add-sub-regrouping','centimetres-length',
    'add-sub-relationships-applications','two-step-add-sub','multiplication-concepts-and-2-to-9-facts',
    'time-hours-minutes','capacity-weight-area-plane-figures'
  ]);
  assert.deepEqual(new Set(graph.coverageRequirements.map(row=>row.id)),required);
  for(const row of graph.coverageRequirements){
    assert.ok(row.skillIds.length>0,`${row.id} has no skills`);
    assertKnown(row.skillIds,`${row.id} coverage`);
    for(const id of row.skillIds) assert.equal(skills.get(id).scope,row.requiredScope,`${row.id} has wrong scope for ${id}`);
  }
});

test('multiplication coverage includes every factor family 2 through 9',()=>{
  for(let factor=2;factor<=9;factor++) assert.ok(skills.has(`g2a.mul.facts-${factor}`));
});

test('all skills belong to at least one child-facing World and Worlds are not publisher chapters',()=>{
  const covered=new Set();
  for(const world of graph.worlds){
    assert.match(world.id,/^world\.[a-z0-9-]+$/);
    assert.ok(world.childTitle.length>0);
    assert.ok(world.questIdentity.length>0);
    assert.ok(world.missionPromise.length>0);
    assertKnown(world.skillIds,`${world.id} world`);
    world.skillIds.forEach(id=>covered.add(id));
    assert.ok(!/unit|chapter|單元|課/i.test(world.childTitle),`${world.id} looks like a textbook chapter`);
  }
  assert.deepEqual(covered,new Set(skills.keys()));
});

test('publisher layers reference the common graph and preserve unresolved Kang Hsuan units',()=>{
  assert.deepEqual(Object.keys(graph.publisherMappings).sort(),['han-lin','kang-hsuan','nani']);
  for(const [publisher,mapping] of Object.entries(graph.publisherMappings)){
    assert.equal(mapping.role,'alignment-only');
    assert.ok(mapping.sourceIds.length>0);
    for(const group of mapping.alignmentGroups) assertKnown(group.skillIds,`${publisher} mapping`);
  }
  const kang=graph.publisherMappings['kang-hsuan'];
  assert.equal(kang.verificationStatus,'pending-primary-unit-list');
  assert.ok(kang.alignmentGroups.every(group=>group.publisherUnit===null));
  assert.ok(kang.alignmentGroups.some(group=>group.confidence==='unresolved-version-placement'));
});

test('sources and uncertainties are explicit and internally linked',()=>{
  const sourceIds=new Set(graph.sources.map(source=>source.id));
  assert.equal(sourceIds.size,graph.sources.length);
  for(const mapping of Object.values(graph.publisherMappings)){
    for(const sourceId of mapping.sourceIds) assert.ok(sourceIds.has(sourceId),`unknown source ${sourceId}`);
  }
  assert.ok(graph.sources.some(source=>source.kind==='official-curriculum'));
  assert.ok(graph.unresolvedQuestions.length>=4);
  for(const item of graph.unresolvedQuestions){
    assert.match(item.id,/^uq-/);
    assert.ok(item.question.endsWith('?'));
    assert.ok(item.reason.length>0);
    assert.ok(item.blockingFor.length>0);
  }
});

test('non-negotiable arithmetic safety remains visible in skill definitions',()=>{
  const subtraction=graph.skills.filter(skill=>skill.id.startsWith('g2a.sub.')||skill.id==='g2a.twostep.sub-sub'||skill.id==='g2a.twostep.mixed');
  assert.ok(subtraction.every(skill=>/nonnegative|negative result/i.test(skill.title)));
  const addition=graph.skills.filter(skill=>skill.id.startsWith('g2a.add.'));
  assert.ok(addition.every(skill=>/within 100/i.test(skill.title)));
  assert.ok(graph.skills.filter(skill=>skill.id.match(/^g2a\.mul\.facts-/)).every(skill=>!skill.id.match(/facts-(?:10|11|12)$/)));
});
