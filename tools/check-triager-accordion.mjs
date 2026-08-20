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
    summary:{style:{}}, active:{style:{}}, purchase:{style:{}},
    state:{textContent:''}, tail:{textContent:''}
  };
  return {
    nodes,style:{},
    querySelector(selector){
      return ({
        '.conversation-summary':nodes.summary,
        '.conversation-active':nodes.active,
        '.conversation-purchase':nodes.purchase,
        '[data-conversation-summary-state]':nodes.state,
        '[data-conversation-summary-tail]':nodes.tail
      })[selector];
    }
  };
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
    state:item.nodes.state.textContent
  }));
}

assert.deepEqual(render(.05),[
  {active:1,summary:0,state:'Handled'},
  {active:0,summary:1,state:'Queued'},
  {active:0,summary:1,state:'Queued'}
]);
assert.equal(render(.305).reduce((sum,item)=>sum+item.active,0),0,'all conversations should be collapsed before the next one opens');
assert.ok(render(.325)[1].active>.5,'Michael should open only after Sandra collapses');
for(const progress of [.28,.295,.305,.315,.325]){
  for(const item of render(progress)) assert.equal(item.active*item.summary,0,'a card must never show its active and summary surfaces together');
}
assert.equal(render(.36)[1].active,1,'Michael should become the active card');
assert.equal(render(.69)[2].active,1,'David should become the active card');
console.log('triager accordion sequence valid');
