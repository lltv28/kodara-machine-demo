import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

assert.match(html,/class="conversation-app"/,'demo should use one recognizable product shell');
assert.match(html,/class="conversation-inbox"/,'product shell should keep all three leads visible');
assert.match(html,/class="conversation-thread"/,'selected lead should open in a dedicated conversation');
assert.match(html,/class="conversation-automation"/,'chat should identify the automatic action instead of faking a composer');
assert.match(html,/AI response completed automatically/,'completed state should explain that the AI handled the response');
assert.match(html,/data-conversation-step="new"/,'state rail should include the new lead state');
assert.match(html,/data-conversation-step="responding"/,'state rail should include the AI response state');
assert.match(html,/data-conversation-step="purchased"/,'state rail should include the purchase state');
assert.match(html,/data-conversation-step="responding">AI responding</,'response state should remain explicit');
assert.match(html,/data-conversation-step="purchased">Purchased</,'purchase state should remain explicit');
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
  'getConversationCopy','getConversationRowState','getConversationBudget'
].map(extractFunction).join('\n'),context);

const atRaw=raw=>raw*.32;

assert.deepEqual({...context.getConversationCopy(0)}, {
  name:'Sandra',initial:'S',question:'Which option fits me best?',reply:'Start with the $8 assessment.'
});
assert.equal(context.computeConversationActivity(atRaw(.04)).stage,'new','conversation should begin as a new lead');
assert.equal(context.computeConversationActivity(atRaw(.12)).stage,'responding','automatic response should be a distinct state');
assert.equal(context.computeConversationActivity(atRaw(.50)).stage,'purchased','purchase should become a distinct state');
assert.ok(context.computeConversationActivity(atRaw(.78)).purchase>.99,'purchase result should remain visible long enough to understand');
assert.ok(context.computeConversationActivity(atRaw(.86)).contentOut>.99,'purchase result should dwell before the next lead replaces it');
assert.ok(context.computeConversationActivity(atRaw(.94)).contentOut>.99,'purchase receipt should remain visible through the end hold');
assert.ok(context.computeConversationActivity(atRaw(.50)).solid>0,'purchase should immediately begin confirming the green revenue route');
assert.ok(context.computeConversationActivity(atRaw(.80)).impact>.99,'purchase should reach the AI brain and increment the ad budget');

const newLead=context.computeConversationActivity(atRaw(.04));
assert.deepEqual({...context.getConversationRowState(0,newLead)},{status:'New lead',result:'',mode:'active'});
assert.deepEqual({...context.getConversationRowState(1,newLead)},{status:'New lead',result:'',mode:'waiting'});

const responding=context.computeConversationActivity(atRaw(.12));
assert.deepEqual({...context.getConversationRowState(0,responding)},{status:'AI responding',result:'',mode:'active'});

const purchased=context.computeConversationActivity(atRaw(.60));
assert.deepEqual({...context.getConversationRowState(0,purchased)},{status:'Purchased',result:'$8',mode:'completed'});
assert.equal(context.getConversationBudget(newLead),0,'the first lead should begin at a $0 ad budget');
assert.equal(context.getConversationBudget(context.computeConversationActivity(atRaw(.80))),8,'the first purchase should add $8');
assert.equal(context.getConversationBudget(context.computeConversationActivity(.32+atRaw(.80))),16,'the second purchase should raise the ad budget to $16');

const secondLead=context.computeConversationActivity(.34);
assert.equal(secondLead.activeIndex,1,'Michael should become the selected lead after Sandra');
assert.deepEqual({...context.getConversationRowState(0,secondLead)},{status:'Purchased',result:'$8',mode:'completed'});
assert.deepEqual({...context.getConversationRowState(1,secondLead)},{status:'New lead',result:'',mode:'active'});
assert.equal(context.computeConversationActivity(1).loopOpacity,0,'loop reset should happen while the demo is hidden');

console.log('triager inbox sequence valid');
