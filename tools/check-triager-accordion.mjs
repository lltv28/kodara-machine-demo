import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

assert.match(html,/class="conversation-app"/,'demo should use one recognizable product shell');
assert.match(html,/class="conversation-app" data-conversation-layout="vertical"/,'AI brain and lead workspace should use a vertical story layout');
assert.match(html,/class="conversation-inbox"/,'product shell should keep all three leads visible');
assert.match(html,/class="conversation-selector"/,'one moving selector should visibly hand control to the next person');
assert.match(html,/data-conversation-position>Lead 1 of 3</,'lead position should make the three independent conversations explicit');
assert.match(html,/conversation-inbox-copy"><strong>Sandra<\/strong>/,'lead names should remain visible in the horizontal queue');
assert.match(html,/class="conversation-thread"/,'selected lead should open in a dedicated conversation');
assert.match(html,/class="conversation-body"/,'messages and purchase result should share the full conversation body');
assert.match(html,/class="conversation-automation"/,'chat should identify the automatic action instead of faking a composer');
assert.match(html,/Handled by AI/,'completed state should explain that the AI handled the response');
assert.match(html,/class="conversation-state" data-conversation-state>New lead</,'one prominent label should communicate the current state');
assert.doesNotMatch(html,/conversation-steps/,'three-column state rail should not squeeze the conversation');
assert.doesNotMatch(html,/conversation-brain-note/,'redundant activity copy should not compete with the AI brain');
assert.match(html,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\);grid-template-rows:36px/,'desktop lead queue should keep all three conversations distinct below one position label');
assert.match(html,/\.player-mode\.compact-mode\[data-player="triagers"\] \.story-core-title\{font-size:40px;transform:translateY\(-24px\)\}/,'AI brain title should sit inside the circle with balanced edge clearance');
assert.match(html,/\.conversation-app\{position:absolute;left:21%;top:33%;width:58%;height:65%/,'desktop conversation shell should use the available square without touching its edges');
assert.match(html,/\.player-mode\.compact-mode\[data-player="triagers"\] \.conversation-inbox-row\{grid-template-columns:1fr;justify-items:center/,'compact lead cards should prioritize one centered person identity');
assert.match(html,/\.conversation-inbox-meta\{display:flex/,'each persistent person card should expose its own status');
assert.match(html,/\.player-mode\.compact-mode\[data-player="triagers"\] \.conversation-inbox-status\{display:none\}/,'compact lead cards should not repeat the prominent conversation state');
assert.match(html,/\.conversation-inbox-head strong\{font-size:22px;[^}]*word-spacing:4px/,'desktop lead position should remain clearly separated and readable');
assert.match(html,/\.conversation-inbox-copy strong\{[^}]*font-size:22px/,'desktop lead names should remain effectively at least 18px after square-player scaling');
assert.match(html,/\.conversation-selector\{[^}]*transform:translateX\(var\(--selected-x,0%\)\)/,'selector should move between the three people');
assert.match(html,/\.conversation-avatar\{width:40px;height:40px/,'lead avatars should fit inside the compact queue without crowding names');
assert.match(html,/\.conversation-agent-copy\{display:flex;align-items:center/,'full-size chat identity should use one horizontal baseline instead of overflowing its header');
assert.match(html,/\.conversation-thread\{[^}]*grid-template-rows:76px minmax\(0,1fr\) 62px/,'chat header, message body, and activity footer should use a spacious vertical rhythm');
assert.match(html,/\.player-mode\.compact-mode\[data-player="triagers"\] \.conversation-state\{position:absolute;width:1px;height:1px/,'compact demo should retain the state for assistive technology without repeating it visually');
assert.match(html,/\.conversation-messages\{[^}]*gap:20px;padding:26px 22px 18px/,'chat messages should have enough internal breathing room to scan quickly');
assert.match(html,/@media\(max-width:420px\)\{[\s\S]*\.conversation-inbox-head strong\{font-size:34px\}[\s\S]*\.conversation-inbox-copy strong\{font-size:34px\}[\s\S]*\.conversation-message\{max-width:92%;padding:10px 13px;font-size:34px\}/,'mobile critical Triager text should remain effectively at least 16px after square-player scaling');
assert.match(html,/@media\(max-width:420px\)\{[\s\S]*\.conversation-app\{left:21%;top:35%;width:58%;height:62\.5%;grid-template-rows:138px/,'mobile conversation shell should retain visible side and bottom breathing room while reserving more space for the chat');
assert.match(html,/@media\(max-width:420px\)\{[\s\S]*\.conversation-chat-head\{display:none\}[\s\S]*\.conversation-thread\{grid-template-rows:minmax\(0,1fr\) 48px\}[\s\S]*\.conversation-messages\{gap:14px;padding:20px 18px 12px\}/,'compact chat should remove the duplicate identity header and use the recovered space for readable messages');
assert.match(html,/@media\(max-width:420px\)\{[\s\S]*\.conversation-inbox-result\{display:none\}/,'compact lead tabs should remove redundant mini receipts before they collide with the conversation');
assert.match(html,/conversation-inbox-row\.is-completed \.conversation-avatar::after\{content:"\\2713"/,'completed leads should use an unmistakable checkmark');
assert.match(html,/conversation-inbox-row\.is-completed \.conversation-inbox-result/,'completed person cards should retain the $8 receipt');
assert.match(html,/data-conversation-handoff/,'conversation changes should have an explicit handoff state instead of a blank body');
assert.match(html,/data-conversation-purchase-title/,'purchase result should support a global three-lead summary');
assert.match(html,/conversationThreadName\.textContent=state\.summary \? 'Summary'/,'final frame should use a global summary header');
assert.match(html,/gainOpacity=state\.summary \? 0/,'single-sale gain badge should not compete with the final $24 total');
assert.doesNotMatch(html,/conversationThread\.style\.transform[^;]*scaleY\(/,'conversation text should never be vertically distorted during handoffs');
assert.match(html,/Buyer<\/span>/,'conversation header should identify the selected person as the buyer, not the AI Triager');
assert.match(html,/\.conversation-row:not\(\.is-ai\) \.conversation-avatar\{[^}]*border:1px solid var\(--line-2\)/,'buyer message avatars should look intentional rather than like loose letters');
assert.match(html,/\.player-mode\[data-player="triagers"\] \.cf-note\{display:none\}/,'tiny duplicate disclosure should not clutter the square player');
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
  name:'Sandra',initial:'S',question:'Which option fits me?',reply:'The $8 assessment shows your next step.'
});
assert.equal(context.getConversationCopy(1).reply,'Start with the $8 assessment before full service.','Michael should receive a reply specific to his concern');
assert.equal(context.getConversationCopy(2).reply,'The $8 assessment shows whether it fits your business.','David should receive a reply specific to his ads question');
const orientation=context.computeConversationActivity(.03);
assert.equal(orientation.orientation,true,'first frame should orient the viewer before anything moves');
assert.equal(orientation.stage,'new','orientation should begin with a recognizable new lead');
assert.equal(orientation.contentIn,1,'first conversation should already be open during orientation');
assert.equal(orientation.typing,0,'orientation should not compete with motion');
assert.equal(orientation.purchase,0,'orientation should not compete with purchase feedback');

assert.equal(context.computeConversationActivity(atLead(0,.22)).stage,'new','new lead should hold long enough to read');
assert.equal(context.computeConversationActivity(atLead(0,.36)).stage,'responding','automatic response should be a distinct state');
assert.equal(context.computeConversationActivity(atLead(0,.66)).stage,'purchased','purchase should become a distinct state');
assert.ok(context.computeConversationActivity(atLead(0,.32)).typing>.99,'typing should finish its own reveal before the reply');
assert.ok(context.computeConversationActivity(atLead(0,.40)).aiReply>.99,'AI reply should have a dedicated reveal');
assert.ok(context.computeConversationActivity(atLead(0,.54)).aiReply>.99,'AI reply should remain fully readable for at least 0.8 seconds');
assert.ok(context.computeConversationActivity(atLead(0,.60)).messageOut<.01,'chat copy should clear before the purchase result appears');
assert.ok(context.computeConversationActivity(atLead(0,.66)).purchase>.99,'purchase result should complete before the transfer begins');
assert.ok(context.computeConversationActivity(atLead(0,.80)).transfer>.99,'revenue transfer should complete before the budget changes');
assert.ok(context.computeConversationActivity(atLead(0,.86)).impact>.99,'purchase should reach the AI brain and increment the ad budget');
assert.ok(context.computeConversationActivity(atLead(0,.99)).impact>.99,'the budget gain should remain readable for at least 0.8 seconds');
assert.equal(context.computeConversationActivity(atLead(1,0)).displayIndex,0,'the completed conversation should remain visible when the selector starts moving');
const movingSelection=context.computeConversationActivity(atLead(1,.05));
assert.ok(movingSelection.selectionIndex>0 && movingSelection.selectionIndex<1,'selection should visibly travel between people');
assert.equal(movingSelection.displayIndex,0,'previous purchase should stay visible while selection moves');
assert.deepEqual({...context.getConversationRowState(1,movingSelection)},{status:'Waiting',result:'',mode:'waiting'},'moving selector must not mark the next buyer complete before their conversation opens');
assert.ok(context.computeConversationActivity(atLead(1,.10)).selectionIndex>.99,'selection should arrive before the next chat opens');
assert.equal(context.computeConversationActivity(atLead(1,.101)).displayIndex,1,'the newly selected conversation should replace the completed one after the selector arrives');
assert.ok(context.computeConversationActivity(atLead(1,.16)).contentIn>.99,'selected person conversation should then expand');

const newLead=context.computeConversationActivity(atLead(0,.22));
assert.deepEqual({...context.getConversationRowState(0,newLead)},{status:'New lead',result:'',mode:'active'});
assert.deepEqual({...context.getConversationRowState(1,newLead)},{status:'Waiting',result:'',mode:'waiting'});

const responding=context.computeConversationActivity(atLead(0,.36));
assert.deepEqual({...context.getConversationRowState(0,responding)},{status:'AI responding',result:'',mode:'active'});

const purchased=context.computeConversationActivity(atLead(0,.66));
assert.deepEqual({...context.getConversationRowState(0,purchased)},{status:'Assessment purchased',result:'$8',mode:'completed'});
assert.equal(context.getConversationBudget(newLead),0,'the first lead should begin at a $0 ad budget');
assert.equal(context.getConversationBudget(context.computeConversationActivity(atLead(0,.86))),8,'the first purchase should add $8');
assert.equal(context.getConversationBudget(context.computeConversationActivity(atLead(1,.86))),16,'the second purchase should raise the ad budget to $16');

const secondLead=context.computeConversationActivity(atLead(1,.20));
assert.equal(secondLead.activeIndex,1,'Michael should become the selected lead after Sandra');
assert.equal(context.getConversationPosition(secondLead),'Lead 2 of 3','lead position should advance with the selected conversation');
assert.deepEqual({...context.getConversationRowState(0,secondLead)},{status:'Assessment purchased',result:'$8',mode:'completed'});
assert.deepEqual({...context.getConversationRowState(1,secondLead)},{status:'New lead',result:'',mode:'active'});
const summary=context.computeConversationActivity(.93);
assert.equal(summary.summary,true,'sequence should finish on a stable completed summary');
assert.equal(summary.displayIndex,-1,'summary should not retain one buyer-specific conversation');
assert.equal(context.getConversationBudget(summary),24,'summary should show the full ad-budget increase');
assert.equal(context.getConversationPosition(summary),'3 leads handled','summary should state the completed outcome');
assert.deepEqual({...context.getConversationRowState(0,summary)},{status:'Assessment purchased',result:'$8',mode:'completed'},'summary should preserve every completed receipt');
assert.equal(context.computeConversationActivity(1).loopOpacity,0,'loop reset should happen while the demo is hidden');

console.log('triager inbox sequence valid');
