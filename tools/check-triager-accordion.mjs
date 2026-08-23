import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

assert.match(html,/class="conversation-chat-head"/,'open conversation should have a recognizable messenger header');
assert.match(html,/class="conversation-composer"/,'open conversation should retain a recognizable message composer');
assert.match(html,/class="conversation-typing"/,'AI reply should include a typing state');
assert.match(html,/Replying automatically/,'non-interactive demo should describe automatic replies instead of showing a Send action');
assert.doesNotMatch(html,/conversation-active-status/,'CRM-style status badge should not remain in the messenger header');

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
  'setConversationPanel','setConversationSummary','getConversationAccordionLayout','renderConversationCard'
].map(extractFunction).join('\n'),context);

function card(){
  const nodes={
    summary:{style:{}}, active:{style:{}}, content:{style:{}}, purchase:{style:{}},
    aiRow:{style:{}}, typing:{style:{}}, aiCopy:{style:{}}, preview:{textContent:''}, tail:{textContent:''}
  };
  return {nodes,card:{style:{}},summary:nodes.summary,active:nodes.active,content:nodes.content,purchase:nodes.purchase,aiRow:nodes.aiRow,typing:nodes.typing,aiCopy:nodes.aiCopy,preview:nodes.preview,tail:nodes.tail};
}

function render(progress){
  const state=context.computeConversationActivity(progress);
  const cards=[card(),card(),card()];
  const metric=name=>Number(html.match(new RegExp(`--conversation-${name}:([\\d.]+)px`))[1]);
  const summaryHeight=metric('summary-h'), activeHeight=metric('active-h'), gap=metric('gap');
  const geometry={summaryHeight,activeHeight,gap};
  const layout=context.getConversationAccordionLayout(state,geometry,cards.length);
  cards.forEach((item,index)=>context.renderConversationCard(item,index,state,geometry,layout));
  return cards.map(item=>({
    active:Number(item.nodes.active.style.opacity),
    summary:Number(item.nodes.summary.style.opacity),
    content:Number(item.nodes.content.style.opacity),
    aiReply:Number(item.nodes.aiRow.style.opacity),
    typing:Number(item.nodes.typing.style.opacity),
    preview:item.nodes.preview.textContent,
    tail:item.nodes.tail.textContent
  }));
}

assert.deepEqual(render(.05),[
  {active:1,summary:0,content:1,aiReply:1,typing:1,preview:'Purchased',tail:'$8'},
  {active:0,summary:1,content:0,aiReply:0,typing:0,preview:'Waiting for reply',tail:'Up next'},
  {active:0,summary:1,content:0,aiReply:0,typing:0,preview:'Waiting for reply',tail:'Up next'}
]);
assert.equal(render(0)[0].content,1,'initial frame should show a readable conversation before autoplay begins');
assert.ok(context.computeConversationActivity(.05).typing>.9,'typing indicator should appear before the AI reply');
assert.equal(context.computeConversationActivity(.09).typing,0,'typing indicator should clear once the AI reply appears');
assert.equal(render(.09)[0].aiReply,1,'AI reply should appear after the lead message');
assert.ok(render(.27)[0].content<1,'card content should fade before the shell collapses');
assert.equal(render(.28)[0].content,0,'collapsed shell must not clip visible conversation text');
assert.equal(render(.30).reduce((sum,item)=>sum+item.active,0),0,'all conversations should be collapsed before the next one opens');
assert.ok(render(.31)[1].active>.5,'Michael should open only after Sandra collapses');
for(const progress of [.27,.28,.295,.30,.31]){
  for(const item of render(progress)) assert.equal(item.active*item.summary,0,'a card must never show its active and summary surfaces together');
}
assert.equal(render(.38)[1].active,1,'Michael should become the active card');
assert.equal(render(.70)[2].active,1,'David should become the active card');
assert.equal(context.computeConversationActivity(1).loopOpacity,0,'loop reset should happen while the demo is hidden');
console.log('triager accordion sequence valid');
