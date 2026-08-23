import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

assert.match(html,/class="conversation-app"/,'demo should use one recognizable product shell');
assert.match(html,/class="conversation-app" data-conversation-layout="vertical"/,'AI brain and lead workspace should use a vertical story layout');
assert.match(html,/class="conversation-inbox"/,'product shell should keep all three leads visible');
assert.match(html,/data-conversation-position>Lead 1 of 3</,'lead position should make the three independent conversations explicit');
assert.match(html,/conversation-inbox-copy"><strong>Sandra<\/strong>/,'lead names should remain visible in the horizontal queue');
assert.match(html,/class="conversation-thread"/,'selected lead should open in a dedicated conversation');
assert.match(html,/class="conversation-body"/,'messages and purchase result should share the full conversation body');
assert.match(html,/class="conversation-automation"/,'chat should identify the automatic action instead of faking a composer');
assert.match(html,/Handled automatically/,'completed state should explain that the AI handled the response');
assert.match(html,/class="conversation-state" data-conversation-state>New lead</,'one prominent label should communicate the current state');
assert.doesNotMatch(html,/conversation-steps/,'three-column state rail should not squeeze the conversation');
assert.doesNotMatch(html,/conversation-brain-note/,'redundant activity copy should not compete with the AI brain');
assert.match(html,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\);grid-template-rows:36px/,'horizontal lead queue should keep all three conversations distinct below one position label');
assert.match(html,/\.player-mode\.compact-mode\[data-player="triagers"\] \.story-core-title\{font-size:40px;transform:translateY\(-24px\)\}/,'AI brain title should sit inside the circle with balanced edge clearance');
assert.match(html,/\.conversation-app\{position:absolute;left:23%;top:34%;width:54%;height:63%/,'conversation shell should use the available square without crowding either edge');
assert.match(html,/\.conversation-inbox-row\{[^}]*gap:4px;padding:5px/,'lead tiles should preserve a visible gap around avatar and name');
assert.match(html,/\.conversation-avatar\{width:40px;height:40px/,'lead avatars should fit inside the compact queue without crowding names');
assert.match(html,/\.conversation-agent-copy\{display:flex;align-items:center/,'chat identity should use one horizontal baseline instead of overflowing its header');
assert.match(html,/\.conversation-thread\{[^}]*grid-template-rows:64px 42px minmax\(0,1fr\) 54px/,'chat header, state, message, and activity rows should use a stable vertical rhythm');
assert.match(html,/conversation-inbox-row\.is-completed \.conversation-avatar::after\{content:"\\2713"/,'completed leads should use an unmistakable checkmark');
assert.doesNotMatch(html,/conversation-composer/,'non-interactive demo must not resemble a disabled message composer');

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
  'getConversationCopy','getConversationRowState','getConversationBudget','getConversationPosition'
].map(extractFunction).join('\n'),context);

const duration=25000;
const orientationEnd=.06;
const summaryStart=.90;
const resetStart=.96;
const leadDuration=7000;
const atLead=(slot,raw)=>(1500+(slot+raw)*leadDuration)/duration;

assert.match(html,/durations=\{learn:5000,triagers:25000,flywheel:8000,graph:8000\}/,'triager sequence should have enough time to explain three leads');
assert.equal(orientationEnd*duration,1500,'orientation should hold for 1.5 seconds');
assert.equal(Math.round((resetStart-summaryStart)*duration),1500,'completed summary should hold for 1.5 seconds');
assert.ok(.08*leadDuration>=500,'every meaningful transition should last at least half a second');

assert.deepEqual({...context.getConversationCopy(0)}, {
  name:'Sandra',initial:'S',question:'Which option fits me?',reply:'Start with the $8 assessment.'
});
const orientation=context.computeConversationActivity(.03);
assert.equal(orientation.orientation,true,'first frame should orient the viewer before anything moves');
assert.equal(orientation.stage,'new','orientation should begin with a recognizable new lead');
assert.equal(orientation.contentIn,1,'first conversation should already be open during orientation');
assert.equal(orientation.typing,0,'orientation should not compete with motion');
assert.equal(orientation.purchase,0,'orientation should not compete with purchase feedback');

assert.equal(context.computeConversationActivity(atLead(0,.15)).stage,'new','new lead should hold long enough to read');
assert.equal(context.computeConversationActivity(atLead(0,.30)).stage,'responding','automatic response should be a distinct state');
assert.equal(context.computeConversationActivity(atLead(0,.70)).stage,'purchased','purchase should become a distinct state');
assert.ok(context.computeConversationActivity(atLead(0,.30)).typing>.99,'typing should finish its own reveal before the reply');
assert.ok(context.computeConversationActivity(atLead(0,.42)).aiReply>.99,'AI reply should have a dedicated reveal');
assert.ok(context.computeConversationActivity(atLead(0,.58)).messageOut<.01,'chat copy should clear before the purchase result appears');
assert.ok(context.computeConversationActivity(atLead(0,.66)).purchase>.99,'purchase result should complete before the transfer begins');
assert.ok(context.computeConversationActivity(atLead(0,.78)).transfer>.99,'revenue transfer should complete before the budget changes');
assert.ok(context.computeConversationActivity(atLead(0,.86)).impact>.99,'purchase should reach the AI brain and increment the ad budget');
assert.ok(context.computeConversationActivity(atLead(0,.92)).contentOut>.99,'completed conversation should visibly hold before collapsing');
assert.ok(context.computeConversationActivity(atLead(0,.999)).contentOut<.01,'completed conversation should collapse before the next one opens');
assert.equal(context.computeConversationActivity(atLead(1,0)).contentIn,0,'the next conversation should begin closed');

const newLead=context.computeConversationActivity(atLead(0,.15));
assert.deepEqual({...context.getConversationRowState(0,newLead)},{status:'New lead',result:'',mode:'active'});
assert.deepEqual({...context.getConversationRowState(1,newLead)},{status:'New lead',result:'',mode:'waiting'});

const responding=context.computeConversationActivity(atLead(0,.30));
assert.deepEqual({...context.getConversationRowState(0,responding)},{status:'AI responding',result:'',mode:'active'});

const purchased=context.computeConversationActivity(atLead(0,.70));
assert.deepEqual({...context.getConversationRowState(0,purchased)},{status:'Purchased',result:'$8',mode:'completed'});
assert.equal(context.getConversationBudget(newLead),0,'the first lead should begin at a $0 ad budget');
assert.equal(context.getConversationBudget(context.computeConversationActivity(atLead(0,.86))),8,'the first purchase should add $8');
assert.equal(context.getConversationBudget(context.computeConversationActivity(atLead(1,.86))),16,'the second purchase should raise the ad budget to $16');

const secondLead=context.computeConversationActivity(atLead(1,.15));
assert.equal(secondLead.activeIndex,1,'Michael should become the selected lead after Sandra');
assert.equal(context.getConversationPosition(secondLead),'Lead 2 of 3','lead position should advance with the selected conversation');
assert.deepEqual({...context.getConversationRowState(0,secondLead)},{status:'Purchased',result:'$8',mode:'completed'});
assert.deepEqual({...context.getConversationRowState(1,secondLead)},{status:'New lead',result:'',mode:'active'});
const summary=context.computeConversationActivity(.93);
assert.equal(summary.summary,true,'sequence should finish on a stable completed summary');
assert.equal(context.getConversationBudget(summary),24,'summary should show the full ad-budget increase');
assert.equal(context.getConversationPosition(summary),'3 leads handled','summary should state the completed outcome');
assert.equal(context.computeConversationActivity(1).loopOpacity,0,'loop reset should happen while the demo is hidden');

console.log('triager inbox sequence valid');
