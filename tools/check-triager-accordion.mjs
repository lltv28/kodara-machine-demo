import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./video-capture.html',import.meta.url),'utf8');

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
    aiMessage:{style:{}}, activeStatus:{textContent:''}, tail:{textContent:''}
  };
  return {nodes,card:{style:{}},summary:nodes.summary,active:nodes.active,content:nodes.content,purchase:nodes.purchase,aiMessage:nodes.aiMessage,status:nodes.activeStatus,tail:nodes.tail};
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
    aiReply:Number(item.nodes.aiMessage.style.opacity),
    status:item.nodes.activeStatus.textContent,
    tail:item.nodes.tail.textContent
  }));
}

assert.deepEqual(render(.05),[
  {active:1,summary:0,content:1,aiReply:0,status:'Reading lead',tail:'Assessment sold'},
  {active:0,summary:1,content:0,aiReply:0,status:'Reading lead',tail:'Up next'},
  {active:0,summary:1,content:0,aiReply:0,status:'Reading lead',tail:'Up next'}
]);
assert.equal(render(0)[0].content,1,'initial frame should show a readable conversation before autoplay begins');
assert.equal(render(.09)[0].aiReply,1,'AI reply should appear after the lead message');
assert.equal(render(.09)[0].status,'Reply sent','active status should match the visible conversation beat');
assert.ok(render(.258)[0].content<1,'card content should fade before the shell collapses');
assert.equal(render(.27)[0].content,0,'collapsed shell must not clip visible conversation text');
assert.equal(render(.29).reduce((sum,item)=>sum+item.active,0),0,'all conversations should be collapsed before the next one opens');
assert.ok(render(.307)[1].active>.5,'Michael should open only after Sandra collapses');
for(const progress of [.258,.27,.29,.30,.307]){
  for(const item of render(progress)) assert.equal(item.active*item.summary,0,'a card must never show its active and summary surfaces together');
}
assert.equal(render(.38)[1].active,1,'Michael should become the active card');
assert.equal(render(.70)[2].active,1,'David should become the active card');
assert.equal(context.computeConversationActivity(1).loopOpacity,0,'loop reset should happen while the demo is hidden');
console.log('triager accordion sequence valid');
