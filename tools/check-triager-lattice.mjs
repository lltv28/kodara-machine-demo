import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

assert.match(html,/class="triager-lattice"/,'compact demo should use the square lattice composition');
assert.match(html,/class="triager-hub"/,'one stationary AI Triager hub should anchor the story');
assert.match(html,/class="triager-hub-title">AI Triagers</,'hub should identify the role in plain language');
assert.match(html,/data-conversation-hub-status/,'hub should explain the current action');
assert.equal((html.match(/class="conversation-person" data-conversation-index=/g) || []).length,3,'square demo should show exactly three independent people');
assert.equal((html.match(/data-conversation-link-index=/g) || []).length,3,'each person should keep one persistent connector to the hub');
assert.match(html,/class="conversation-brain-link"/,'hub should remain visibly connected to the AI Brain');
assert.match(html,/class="conversation-brain-success" pathLength="1"/,'sale revenue should turn the Brain connector green');
assert.match(html,/class="conversation-lead-signal"/,'active buyer activity should visibly travel to the hub');
assert.match(html,/class="conversation-transfer-dot"/,'sale revenue should visibly travel to the Brain');
assert.match(html,/\.triager-hub\{position:absolute;left:50%;top:46%/,'hub should occupy the fixed center of the square');
assert.match(html,/\.conversation-people\{position:absolute;left:calc\(50% - 300px\);top:69%;width:600px/,'three people should use a stable bottom row');
assert.match(html,/\.conversation-person\{[^}]*min-height:116px/,'people should read as independent nodes rather than compressed chat rows');
assert.match(html,/\.triager-lattice\{position:absolute;left:240px;top:0;width:760px;height:760px\}/,'lattice should use a native square coordinate system inside the legacy renderer');
assert.match(html,/viewBox="0 0 760 760"/,'lattice connector geometry should be authored in square coordinates');
assert.match(html,/\.conversation-person-name\{[^}]*font-size:32px/,'desktop names should remain legible after player scaling');
assert.match(html,/@media\(max-width:420px\)\{[\s\S]*\.conversation-person-name\{font-size:36px\}[\s\S]*\.conversation-person-status\{font-size:28px\}/,'small embeds should enlarge person labels before scaling');
assert.match(html,/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*\.conversation-lead-signal,[\s\S]*\.conversation-transfer-dot\{display:none/,'reduced motion should remove moving signals');
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
  'getConversationCopy','getConversationRowState','getConversationBudget','getConversationHubStatus'
].map(extractFunction).join('\n'),context);

const duration=18000;
const atLead=(slot,raw)=>(.10+(slot+raw)*(.775/3));

assert.match(html,/durations=\{learn:5000,triagers:18000,flywheel:8000,graph:8000\}/,'triager sequence should allow eighteen seconds for three leads');
assert.equal(.10*duration,1800,'opening layout should hold for 1.8 seconds');
assert.equal(Math.round((.96-.875)*duration),1530,'completed summary should hold for at least 1.5 seconds before the reset fade');
assert.ok(.22*(.775/3)*duration>=1000,'each moving signal should take at least one second');

assert.deepEqual({...context.getConversationCopy(0)}, {name:'Sandra',initial:'S'});
assert.deepEqual({...context.getConversationCopy(1)}, {name:'Michael',initial:'M'});
assert.deepEqual({...context.getConversationCopy(2)}, {name:'David',initial:'D'});

const orientation=context.computeConversationActivity(.05);
assert.equal(orientation.orientation,true,'first frame should orient the viewer before anything moves');
assert.equal(orientation.stage,'ready');
assert.equal(orientation.incoming,0);

const incoming=context.computeConversationActivity(atLead(0,.23));
assert.equal(incoming.stage,'new');
assert.ok(incoming.incoming>0 && incoming.incoming<1,'buyer signal should visibly travel to the hub');
assert.equal(context.getConversationHubStatus(incoming),'Listening to Sandra');

const qualifying=context.computeConversationActivity(atLead(0,.40));
assert.equal(qualifying.stage,'qualifying');
assert.equal(context.getConversationHubStatus(qualifying),'Recommends the $8 assessment');

const purchased=context.computeConversationActivity(atLead(0,.58));
assert.equal(purchased.stage,'purchased');
assert.ok(purchased.purchase>.5,'purchase should become a distinct, readable state');
assert.deepEqual({...context.getConversationRowState(0,purchased)},{status:'Assessment sold',result:'$8',mode:'completed'});

const transferring=context.computeConversationActivity(atLead(0,.75));
assert.ok(transferring.transfer>0 && transferring.transfer<1,'revenue should visibly travel to the Brain');
assert.equal(context.getConversationHubStatus(transferring),'Adds $8 to ad budget');

const funded=context.computeConversationActivity(atLead(0,.92));
assert.equal(funded.stage,'funded');
assert.equal(context.getConversationBudget(funded),8,'first completed sale should raise the ad budget to $8');
assert.deepEqual({...context.getConversationRowState(1,funded)},{status:'Waiting',result:'',mode:'waiting'});

const secondLead=context.computeConversationActivity(atLead(1,.20));
assert.equal(secondLead.activeIndex,1,'Michael should become active after Sandra');
assert.deepEqual({...context.getConversationRowState(0,secondLead)},{status:'Assessment sold',result:'$8',mode:'completed'});
assert.match(html,/brainProgress=state\.summary \? 1 : state\.transfer/,'each $8 sale should redraw the Brain revenue connector');
assert.deepEqual({...context.getConversationRowState(1,secondLead)},{status:'Talking now',result:'',mode:'active'});

const summary=context.computeConversationActivity(.91);
assert.equal(summary.summary,true,'sequence should finish on a stable completed summary');
assert.equal(context.getConversationBudget(summary),24);
assert.equal(context.getConversationHubStatus(summary),'3 assessments sold');
assert.equal(context.computeConversationActivity(1).loopOpacity,0,'loop reset should happen while hidden');

console.log('triager square lattice sequence valid');
