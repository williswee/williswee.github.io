import React from 'react';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';

const C = {paper:'#F4F1E9', ink:'#242E28', muted:'#647168', line:'#CDD2C7', green:'#315A43', light:'#E3EADC', white:'#FBFAF5'};
const MEALS = [
  {name:'Tomato chickpea rice', time:'~40 min'},
  {name:'Lemon white bean rice', time:'~30 min'},
  {name:'Ginger tofu noodles', time:'~25 min'},
];
const font = `@font-face{font-family:DM;src:url('${staticFile('fonts/dm-sans-latin-variable.woff2')}') format('woff2');font-weight:100 1000;font-style:normal} @font-face{font-family:Manrope;src:url('${staticFile('fonts/manrope-latin-variable.woff2')}') format('woff2');font-weight:200 800;font-style:normal} *{box-sizing:border-box}`;
const reveal = (f:number, start=0) => ({opacity:interpolate(f,[start,start+12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}), transform:`translateY(${interpolate(f,[start,start+16],[14,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`});
const caps:React.CSSProperties = {fontSize:23,fontWeight:650,letterSpacing:3,textTransform:'uppercase',color:C.green};

const SectionHeader:React.FC<{eyebrow:string;title:string;subtitle?:string}> = ({eyebrow,title,subtitle}) => <>
  <div style={{...caps,marginBottom:22}}>{eyebrow}</div>
  <h1 style={{fontFamily:'Manrope',fontWeight:650,fontSize:62,letterSpacing:-2.1,lineHeight:1.12,margin:'0 0 20px'}}>{title}</h1>
  {subtitle && <div style={{fontSize:28,lineHeight:1.4,color:C.muted}}>{subtitle}</div>}
</>;

const Prompt:React.FC<{second?:boolean;f:number}> = ({second=false,f}) => <div style={{position:'absolute',left:120,right:120,top:325,...reveal(f)}}>
  <div style={{...caps,marginBottom:40}}>You ask</div>
  <div style={{borderLeft:`5px solid ${C.green}`,paddingLeft:45,maxWidth:1540,fontFamily:'Manrope',fontSize:76,fontWeight:550,lineHeight:1.27,letterSpacing:-2.3}}>
    {second ? <>Make Dinner 3 <span style={{color:C.green}}>four portions.</span><br/>Dinners 1 and 2 stay at two.</> : <>Three dinners for two,<br/>using the starter recipes.</>}
  </div>
  <div style={{fontSize:29,color:C.muted,marginTop:42,paddingLeft:50}}>{second?'One change to the plan.':'An edited example using Chef Bob’s open-source skill.'}</div>
</div>;

const MealPlan:React.FC<{updated?:boolean;f:number}> = ({updated=false,f}) => <div style={{position:'absolute',left:120,right:120,top:255,...reveal(f)}}>
  <SectionHeader eyebrow="Chef Bob replies" title={updated?'Dinner 3 now makes four portions.':'Three dinners for two.'} subtitle={updated?'Dinners 1 and 2 stay at two.':'From the starter recipes.'}/>
  <div style={{marginTop:44,borderTop:`2px solid ${C.ink}`}}>
    <div style={{display:'grid',gridTemplateColumns:updated?'200px 1fr 300px':'200px 1fr 230px 260px',fontSize:23,color:C.muted,padding:'22px 24px 20px'}}>
      <span>Dinner</span><span>Recipe</span><span style={{textAlign:'right'}}>{updated?'Portions':'Portions'}</span>{!updated&&<span style={{textAlign:'right'}}>Estimated time</span>}
    </div>
    {MEALS.map((meal,i)=><div key={meal.name} style={{display:'grid',gridTemplateColumns:updated?'200px 1fr 300px':'200px 1fr 230px 260px',alignItems:'center',minHeight:111,padding:'20px 24px',borderTop:`1px solid ${C.line}`,background:updated&&i===2?C.light:'transparent',...reveal(f,8+i*3)}}>
      <div style={{fontSize:29,color:C.muted,fontVariantNumeric:'tabular-nums'}}>0{i+1}</div>
      <div style={{fontFamily:'Manrope',fontSize:40,fontWeight:550,letterSpacing:-.7}}>{meal.name}</div>
      <div style={{textAlign:'right',fontSize:42,fontWeight:updated&&i===2?650:450,fontVariantNumeric:'tabular-nums',color:updated&&i===2?C.green:C.ink}}>{updated&&i===2?<><span style={{fontSize:30,color:C.muted,textDecoration:'line-through',marginRight:22,fontWeight:400}}>2</span><span style={{fontSize:25,marginRight:22}}>→</span>4</>:2}</div>
      {!updated&&<div style={{textAlign:'right',fontSize:34,color:C.muted,fontVariantNumeric:'tabular-nums'}}>{meal.time}</div>}
    </div>)}
    <div style={{borderTop:`1px solid ${C.line}`}}/>
  </div>
  {updated && <div style={{fontSize:26,color:C.muted,marginTop:25}}>Recipe ingredients scale by 2. Cooking time may increase for batches.</div>}
</div>;

const Shopping:React.FC<{f:number}> = ({f}) => {
 const rows = [
   {name:'Dry white rice',q:'300 g',old:null},
   {name:'Dry wheat noodles',q:'360 g',old:'180 g'},
   {name:'Cooked chickpeas, drained',q:'240 g',old:null},
   {name:'Cooked white beans, drained',q:'240 g',old:null},
   {name:'Firm tofu, drained',q:'500 g',old:'250 g'},
 ];
 return <div style={{position:'absolute',left:120,right:120,top:200,...reveal(f)}}>
  <SectionHeader eyebrow="Chef Bob updates the totals" title="Shopping preview" subtitle="Five main ingredients for the updated plan."/>
  <div style={{marginTop:35,borderTop:`2px solid ${C.ink}`}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 470px',fontSize:23,color:C.muted,padding:'18px 24px'}}><span>Ingredient</span><span style={{textAlign:'right'}}>Updated total</span></div>
    {rows.map((r,i)=><div key={r.name} style={{display:'grid',gridTemplateColumns:'1fr 470px',alignItems:'center',padding:'14px 24px',minHeight:80,borderTop:`1px solid ${C.line}`,background:r.old?C.light:'transparent',...reveal(f,6+i*2)}}>
      <div style={{fontSize:33,fontWeight:450,letterSpacing:-.4}}>{r.name}</div>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'flex-end',fontSize:35,fontVariantNumeric:'tabular-nums',color:r.old?C.green:C.ink,fontWeight:r.old?650:450}}>{r.old?<><span style={{fontSize:28,color:C.muted,textDecoration:'line-through',fontWeight:400}}>{r.old}</span><span style={{fontSize:25,margin:'0 27px'}}>→</span></>:<span style={{fontSize:23,fontWeight:400,color:C.muted,marginRight:30}}>unchanged</span>}<span style={{display:'inline-block',textAlign:'right',width:150}}>{r.q}</span></div>
    </div>)}
    <div style={{borderTop:`1px solid ${C.line}`}}/>
  </div>
  <div style={{fontSize:25,color:C.muted,marginTop:23}}>Full ingredients and methods are in the starter recipes.</div>
 </div>;
};

export const ChefBobDemo:React.FC = () => {
 const frame=useCurrentFrame();
 const stage = frame<120?0:frame<390?1:frame<540?2:frame<690?3:4;
 const boundaries=[0,120,390,540,690];
 const local=frame-boundaries[stage];
 return <AbsoluteFill style={{background:C.paper,color:C.ink,fontFamily:'DM',overflow:'hidden'}}>
   <style>{font}</style>
   <div style={{position:'absolute',top:75,left:120,right:120,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
     <div style={{fontFamily:'Manrope',fontSize:42,fontWeight:750,letterSpacing:-1.3}}>Chef Bob<span style={{display:'inline-block',width:10,height:10,background:C.green,borderRadius:5,marginLeft:15,marginBottom:3}}/></div>
     <div style={{fontSize:25,color:C.muted}}>Open-source skill · Sample conversation</div>
   </div>
   <div style={{position:'absolute',top:161,left:120,right:120,height:1,background:C.line}}/>
   {stage===0&&<Prompt f={local}/>}
   {stage===1&&<MealPlan f={local}/>}
   {stage===2&&<Prompt second f={local}/>}
   {stage===3&&<MealPlan updated f={local}/>}
   {stage===4&&<Shopping f={local}/>}
   <div style={{position:'absolute',left:120,right:120,bottom:65,borderTop:`1px solid ${C.line}`,paddingTop:22,display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
     <div style={{fontSize:23,color:C.muted}}>Fictional example · Starter recipes not kitchen-tested</div>
     <div style={{fontSize:23,color:C.green}}>github.com/williswee/chef-bob</div>
   </div>
 </AbsoluteFill>;
};
