import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

assert.match(html,/class="triager-lattice"/,'compact demo should use the square lattice composition');
assert.match(html,/AI Version of You speaks with three independent people/,'accessible description should explain the three independent people');
assert.match(html,/class="triager-hub"/,'one stationary AI Version hub should anchor the story');
assert.match(html,/class="triager-hub-title">AI Version</,'hub should identify the experience in plain language');
assert.doesNotMatch(html,/data-conversation-hub-status/,'hub should contain only its one-line role label');
assert.match(html,/class="story-core-title"><span>Your<\/span><br><span>Expertise<\/span>/,'Expertise label should expose separate words for compact one-line layout');
assert.match(html,/data-player="triagers"\] \.story-core-title\{[^}]*display:flex;[^}]*gap:10px/,'compact expertise label should preserve a visible one-line word gap');
assert.match(html,/data-player="triagers"\] \.story-core-title br\{display:none\}/,'Triager player should render Your Expertise on one line');
assert.equal((html.match(/class="conversation-person" data-conversation-index=/g) || []).length,3,'square demo should show exactly three independent people');
assert.equal((html.match(/data-conversation-link-index=/g) || []).length,3,'each person should keep one persistent connector to the hub');
assert.match(html,/class="conversation-brain-link"/,'hub should remain visibly connected to the approved expertise');
assert.match(html,/class="conversation-brain-success" pathLength="1"/,'successful matching should turn the expertise connector green');
assert.match(html,/\.conversation-brain-success,\.conversation-person-success\{[^}]*stroke-dasharray:none;stroke-dashoffset:0/,'success connectors must use complete paths rather than browser-dependent normalized dashes');
assert.match(html,/class="conversation-lead-signal"/,'active buyer activity should visibly travel to the hub');
assert.match(html,/data-player="triagers"\] \.story-core-budget,[^}]*\.conversation-transfer-dot\{display:none\}/,'compact matching demo should hide legacy financial and transfer indicators');
assert.match(html,/\.triager-hub\{position:absolute;left:50%;top:46%/,'hub should occupy the fixed center of the square');
assert.match(html,/\.triager-hub\{[^}]*width:174px;height:174px/,'hub should match the Brain scale and remain circular');
assert.match(html,/\.triager-hub-title\{[^}]*white-space:nowrap/,'AI Version should stay on one line');
assert.match(html,/\.conversation-people\{position:absolute;left:calc\(50% - 300px\);top:69%;width:600px/,'three people should use a stable bottom row');
assert.match(html,/\.conversation-person\{[^}]*height:180px/,'buyer cards should keep stable equal heights through status changes');
assert.match(html,/\.conversation-person-status\{[^}]*white-space:nowrap/,'buyer status should stay on one line below the name');
assert.match(html,/\.conversation-person-status\{[^}]*width:100%;min-width:0;text-align:center/,'buyer status should shrink to and remain centered within every card');
assert.match(html,/\.conversation-person\.is-completed \.conversation-person-status\{[^}]*font-size:var\(--demo-label\)/,'the longest status should use the shared label tier inside its prospect card');
assert.doesNotMatch(html,/conversation-person-result/,'person cards should not display pricing');
assert.match(html,/data-player="triagers"\] \.story-core\{[^}]*display:flex;[^}]*align-items:center;justify-content:center/,'expertise content should use one centered stack');
assert.match(html,/rotateY\(var\(--card-turn\)\)/,'buyer replacement should rotate through the card plane');
assert.match(html,/\.triager-lattice\{position:absolute;left:240px;top:0;width:760px;height:760px\}/,'lattice should use a native square coordinate system inside the legacy renderer');
assert.match(html,/viewBox="0 0 760 760"/,'lattice connector geometry should be authored in square coordinates');
assert.match(html,/d="M 380 263 L 380 220"/,'Brain connector should meet the top edge of the corrected circular hub');
assert.match(html,/d="M 380 525 L 380 437"/,'center buyer connector should meet the bottom edge of the corrected circular hub');
assert.match(html,/\.conversation-person-name\{[^}]*font-size:var\(--demo-title\)/,'desktop names should use the shared demo title tier');
assert.match(html,/@media\(max-width:420px\)\{[\s\S]*\.conversation-person-name\{font-size:var\(--demo-title\)\}[\s\S]*\.conversation-person-status\{font-size:var\(--demo-label\)\}/,'small embeds should preserve the shared name and status tiers before scaling');
assert.match(html,/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*\.conversation-lead-signal,[\s\S]*\.conversation-transfer-dot\{display:none/,'reduced motion should remove moving signals');
assert.doesNotMatch(html,/triager-loop-opacity|loopOpacity/,'continuous buyer rotation should not fade the demo between loops');
assert.doesNotMatch(html,/class="conversation-app"/,'old chat-card shell should not remain in the square adaptation');
assert.doesNotMatch(html,/conversation-inbox-row/,'old stacked cards should not compete with the lattice');

function extractFunction(name){
  const start=html.indexOf(`function ${name}(`);
  assert.notEqual(start,-1,`missing ${name}`);
  const open=html.indexOf('{',start);
  let depth=0;
  for(let i=open;i<html.length;i++){
    if(html[i]==='{') depth++;
    if(html[i]==='}' && --depth===0) return html.slice(start,i+1);
  }
  throw new Error(`unterminated ${name}`);
}

const context={};
vm.runInNewContext([
  'zoomClamp','zoomRange','storyEase','computeConversationActivity',
  'getConversationCopy','getConversationRowState','getConversationEnrollmentCount',
  'getConversationBrainConnectorOpacity','getConversationCrossfade'
].map(extractFunction).join('\n'),context);

const duration=18000;
const atLead=(slot,raw)=>((slot+raw)/3);

assert.match(html,/durations=\{learn:5000,triagers:18000,flywheel:8000,graph:8000\}/,'triager sequence should allow eighteen seconds for three leads');
assert.ok(.001/3*duration<=20,'first moving signal should begin on the first painted frames');
assert.ok(.16/3*duration>=900,'each moving signal should remain easy to follow');

assert.deepEqual({...context.getConversationCopy(0,0)}, {name:'Sandra',initial:'S'});
assert.deepEqual({...context.getConversationCopy(0,1)}, {name:'Mark',initial:'M'});
assert.deepEqual({...context.getConversationCopy(1,0)}, {name:'Michael',initial:'M'});
assert.deepEqual({...context.getConversationCopy(1,1)}, {name:'Emily',initial:'E'});
assert.deepEqual({...context.getConversationCopy(2,0)}, {name:'David',initial:'D'});
assert.deepEqual({...context.getConversationCopy(2,1)}, {name:'James',initial:'J'});

const orientation=context.computeConversationActivity(0);
assert.equal(orientation.orientation,false,'first frame should not insert an opening hold');
assert.equal(orientation.stage,'new');
assert.equal(orientation.incoming,0);
assert.deepEqual({...context.getConversationRowState(0,orientation,0)},{name:'Sandra',initial:'S',status:'Exploring',mode:'active',turn:0});
const started=context.computeConversationActivity(.001);
assert.equal(started.orientation,false,'Triager activity should not remain in an opening hold');
assert.ok(started.incoming>0,'first buyer signal should already be moving');

const incoming=context.computeConversationActivity(atLead(0,.10));
assert.equal(incoming.stage,'new');
assert.ok(incoming.incoming>0 && incoming.incoming<1,'buyer signal should visibly travel to the hub');

const qualifying=context.computeConversationActivity(atLead(0,.20));
assert.equal(qualifying.stage,'qualifying');
assert.equal(context.getConversationRowState(0,qualifying,0).status,'Matching','the first visible status change should arrive before enrollment');

const purchased=context.computeConversationActivity(atLead(0,.28));
assert.equal(purchased.stage,'purchased');
assert.ok(purchased.purchase>.5,'purchase should become a distinct, readable state');
assert.deepEqual({...context.getConversationRowState(0,purchased,0)},{name:'Sandra',initial:'S',status:'Enrolled',mode:'completed',turn:0});
assert.ok(atLead(0,.28)*duration<1700,'the first meaningful enrollment state should not wait several seconds');

const transferring=context.computeConversationActivity(atLead(0,.46));
assert.ok(transferring.transfer>0 && transferring.transfer<1,'successful matching should visibly connect to the expertise layer');

const rotated=context.computeConversationActivity(atLead(0,.96));
assert.equal(rotated.stage,'rotating');
assert.equal(context.getConversationEnrollmentCount(rotated,0),1,'first completed match should raise the enrollment count to one');
assert.deepEqual({...context.getConversationRowState(0,rotated,0)},{name:'Mark',initial:'M',status:'Waiting',mode:'waiting',turn:rotated.cardTurn});

const secondLead=context.computeConversationActivity(atLead(1,.20));
assert.equal(secondLead.activeIndex,1,'Michael should become active after Sandra');
assert.deepEqual({...context.getConversationRowState(0,secondLead,0)},{name:'Mark',initial:'M',status:'Waiting',mode:'waiting',turn:0});
const highlighted=context.computeConversationActivity(atLead(0,.70));
assert.equal(context.getConversationBrainConnectorOpacity(highlighted),1,'expertise connector should become fully green before its card rotates away');
const releasing=context.computeConversationActivity(atLead(0,.96));
assert.ok(context.getConversationBrainConnectorOpacity(releasing)>0 && context.getConversationBrainConnectorOpacity(releasing)<1,'expertise connector should fade near the end of card replacement');
assert.match(html,/conversationBrainSuccess\.style\.strokeDashoffset='0'/,'expertise connector should illuminate its full path instead of drawing a partial green bar');
assert.equal(context.getConversationCrossfade(0),1,'copy should begin fully visible');
assert.ok(context.getConversationCrossfade(.25)>0 && context.getConversationCrossfade(.25)<1,'copy should fade across the first half of a state change');
assert.equal(context.getConversationCrossfade(.5),0,'copy should be hidden at the exact state-change midpoint');
assert.equal(context.getConversationCrossfade(.25),context.getConversationCrossfade(.75),'outgoing and incoming fades should use a balanced rhythm');
assert.equal(context.getConversationCrossfade(1),1,'replacement copy should finish fully visible');
assert.match(html,/conversationLeadSuccessPaths\[i\]\.style\.strokeDashoffset='0'/,'buyer connector should illuminate its full path instead of drawing a partial green bar');
assert.match(html,/linkOpacity=i===state\.activeIndex \? storyEase\(zoomRange\(state\.purchase,\.5,1\)\)\*\(1-storyEase\(zoomRange\(state\.swap,\.62,1\)\)\) : 0/,'person connector should fade the complete path in only after enrollment, then release it during card replacement');
assert.match(html,/view\.node\.style\.opacity=String\(cardOpacity\)/,'buyer replacement should fade through its rotation midpoint');
assert.match(html,/view\.avatar\.style\.opacity=view\.status\.style\.opacity=String\(saleOpacity\)/,'enrollment-state icon and status should crossfade together');
assert.deepEqual({...context.getConversationRowState(1,secondLead,0)},{name:'Michael',initial:'M',status:'Matching',mode:'active',turn:0});

const cycleEnd=context.computeConversationActivity(1);
assert.equal(cycleEnd.stage,'rotating');
assert.equal(context.getConversationEnrollmentCount(cycleEnd,0),3);
assert.deepEqual({...context.getConversationRowState(2,cycleEnd,0)},{name:'James',initial:'J',status:'Waiting',mode:'waiting',turn:0});
const nextCycle=context.computeConversationActivity(0);
assert.equal(context.getConversationEnrollmentCount(nextCycle,1),3,'enrollment count should not reset between loops');
assert.deepEqual({...context.getConversationRowState(0,nextCycle,1)},{name:'Mark',initial:'M',status:'Exploring',mode:'active',turn:0});
assert.match(html,/window\.renderCaptureFrame=function\(chapter,progress,loopNumber\)/,'generic player should pass loop context into the renderer');
assert.match(html,/window\.renderCaptureFrame\(chapter,Math\.min\(1,elapsed\/duration\),loopCount\)/,'player should render each chapter with its current loop count');
assert.doesNotMatch(html,/setConversationLoop/,'Triager loop state should not leak through a chapter-specific global callback');
assert.match(html,/chapter==='triagers'\?\.9:1/,'reduced-motion mode should settle on a coherent completed-enrollment state');
const reducedState=context.computeConversationActivity(.9);
assert.equal(context.getConversationEnrollmentCount(reducedState,0),3,'reduced-motion snapshot should show three completed enrollments');
assert.equal(context.getConversationRowState(2,reducedState,0).mode,'completed','reduced-motion snapshot should keep the third completed enrollment visible');

console.log('triager square lattice sequence valid');
