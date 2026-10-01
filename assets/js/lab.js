/* WildPointer laboratory. One visibility-gated clock for all experiments. */
(() => {
  'use strict';
  const lab = document.querySelector('[data-lab]');
  if (!lab) return;
  const track = lab.querySelector('[data-lab-track]');
  const cards = [...track.querySelectorAll('.exp')];
  const count = lab.querySelector('[data-lab-count]');
  const bar = lab.querySelector('[data-lab-bar]');
  const prev = lab.querySelector('[data-lab-prev]');
  const next = lab.querySelector('[data-lab-next]');
  const pause = lab.querySelector('[data-lab-pause]');
  const resetButton = lab.querySelector('[data-lab-reset]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const C = { navy:'#030D42', blue:'#1C1382', violet:'#5F0689', pink:'#C30D84', orange:'#F74D00', paper:'#F2EFE7', lavender:'#9095B8' };
  const colors = [C.orange,C.pink,C.paper,C.lavender];
  const tau = Math.PI * 2;
  const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
  const mix = (a,b,t) => a+(b-a)*t;
  const random = seed => () => { seed|=0; seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  const line = (c,points,color,width=1,alpha=1) => {
    c.strokeStyle=color; c.lineWidth=width; c.globalAlpha=alpha; c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.stroke(); c.globalAlpha=1;
  };
  const background = (c,s,color=C.navy) => { c.globalAlpha=1; c.fillStyle=color; c.fillRect(0,0,s.w,s.h); };
  const dot = (c,x,y,r,color) => { c.fillStyle=color; c.beginPath(); c.arc(x,y,r,0,tau); c.fill(); };
  let ink, accent;
  const theme = () => { const css=getComputedStyle(document.body); ink=css.getPropertyValue('--ink').trim(); accent=css.getPropertyValue('--accent').trim(); };
  theme();
  const models = [];
  let paused=media.matches, raf=0, last=0, lastInteracted=null;
  const shown = () => cards.filter(c=>!c.hidden);
  const activeIndex = () => {
    const list=shown(), x=track.getBoundingClientRect().left+parseFloat(getComputedStyle(track).paddingLeft);
    let selected=0, distance=Infinity;
    list.forEach((c,i)=>{ const d=Math.abs(c.getBoundingClientRect().left-x); if(d<distance){selected=i;distance=d;} });
    return selected;
  };
  const resetTarget = () => {
    const r=lastInteracted?.getBoundingClientRect(), rail=track.getBoundingClientRect();
    return lastInteracted&&!lastInteracted.hidden&&r.right>rail.left+30&&r.left<rail.right-30?lastInteracted:shown()[activeIndex()];
  };
  const resetLabel = () => { resetButton.textContent='重置 · '+resetTarget().querySelector('h3').textContent; };
  const updateNavigation = () => {
    const list=shown(), i=activeIndex();
    const edge=track.getBoundingClientRect().right-parseFloat(getComputedStyle(track).paddingRight);
    let end=i;list.forEach((c,j)=>{if(j>=i&&c.getBoundingClientRect().right<=edge+2)end=j;});
    const range=String(i+1).padStart(2,'0')+(end>i?'–'+String(end+1).padStart(2,'0'):'');
    count.textContent=range+' / '+String(list.length).padStart(2,'0');
    const distance=track.scrollWidth-track.clientWidth;
    bar.style.setProperty('--p', distance>1?track.scrollLeft/distance:1);
    prev.disabled=track.scrollLeft<2; next.disabled=track.scrollLeft>=distance-2;
    resetLabel();
  };
  const go = delta => {
    const list=shown(), distance=list[0].offsetWidth+parseFloat(getComputedStyle(track).gap);
    track.scrollBy({left:distance*delta,behavior:media.matches?'instant':'smooth'});
  };
  prev.addEventListener('click',()=>go(-1)); next.addEventListener('click',()=>go(1));
  track.addEventListener('scroll',updateNavigation,{passive:true});
  addEventListener('resize',updateNavigation);
  const render = (m, step=0) => { if(m.s.w&&m.s.h){m.s.t+=step;m.draw(m.ctx,m.s,step);} };
  const schedule = () => {
    if(!raf&&!paused&&document.visibilityState==='visible'&&models.some(m=>m.visible&&!m.card.hidden)) raf=requestAnimationFrame(tick);
  };
  const tick = now => {
    raf=0;
    if(now-last>=1000/30){ last=now; models.forEach(m=>{if(m.visible&&!m.card.hidden)render(m,1);}); }
    schedule();
  };
  const syncPause = () => {
    lab.classList.toggle('is-paused',paused);
    pause.textContent=paused?'播放动效':'暂停动效'; pause.setAttribute('aria-pressed',String(paused));
    if(paused&&raf){cancelAnimationFrame(raf);raf=0;} schedule();
  };
  pause.addEventListener('click',()=>{paused=!paused;syncPause();});
  media.addEventListener('change',e=>{paused=e.matches;syncPause();});
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}schedule(); });

  function experiment(kind,s,c) {
    const R=random(31+cards.findIndex(card=>card.dataset.kind===kind)*97);
    const api={draw:()=>{},press:()=>{},move:()=>{}};
    if(kind==='flow') {
      const ps=Array.from({length:Math.min(1300,Math.round(s.w*s.h/130))},(_,i)=>({x:R()*s.w,y:R()*s.h,life:R()*240,color:colors[i%23===0?0:i%11===0?1:i%3===0?3:2]}));
      const draw=(c,s,step)=>{
        c.fillStyle='rgba(3,13,66,.085)';c.fillRect(0,0,s.w,s.h);
        ps.forEach(p=>{
          let a=Math.sin(p.x*.011+s.t*.003)*2+Math.cos(p.y*.014-s.t*.002)*2;
          if(s.inside&&Math.hypot(p.x-s.x,p.y-s.y)<110)a=Math.atan2(p.y-s.y,p.x-s.x)+Math.PI/2;
          const ox=p.x,oy=p.y;p.x+=Math.cos(a)*1.8*step;p.y+=Math.sin(a)*1.8*step;p.life-=step;
          if(p.x<0||p.x>s.w||p.y<0||p.y>s.h||p.life<0){p.x=R()*s.w;p.y=R()*s.h;p.life=80+R()*220;return;}
          line(c,[[ox,oy],[p.x,p.y]],p.color,1,p.color===C.paper?.3:.65);
        });
      };
      background(c,s);for(let i=0;i<70;i++)draw(c,s,1);
      api.draw=draw;api.move=()=>draw(c,s,1);
    } else if(kind==='swarm') {
      const pts=[];for(let y=13;y<s.h;y+=25)for(let x=13;x<s.w;x+=25)pts.push({x,y,a:R()*tau});
      api.draw=(c,s,step)=>{
        c.clearRect(0,0,s.w,s.h);
        const x=s.inside?s.x:s.w*(.5+Math.cos(s.t*.012)*.27), y=s.inside?s.y:s.h*(.5+Math.sin(s.t*.017)*.24);
        pts.forEach(p=>{
          let a=Math.atan2(y-p.y,x-p.x)+(s.down?Math.PI:0), d=Math.hypot(x-p.x,y-p.y);
          const da=Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a));p.a+=da*(step?.2:.65);
          const k=clamp(1-d/170,0,1), z=4+k*3;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=k>.2?accent:ink;c.globalAlpha=.36+k*.64;
          c.beginPath();c.moveTo(z,0);c.lineTo(-z*.7,-z*.55);c.lineTo(-z*.3,0);c.lineTo(-z*.7,z*.55);c.closePath();c.fill();c.restore();
        });
      };
    } else if(kind==='memory') {
      const size=20, cols=Math.ceil(s.w/size), rows=Math.ceil(s.h/size);
      const cells=Array.from({length:cols*rows},()=>({v:R()>.82?R():0,color:colors[Math.floor(R()*3)]}));
      let color=0;
      const paint=()=>{const x=clamp(Math.floor(s.x/size),0,cols-1),y=clamp(Math.floor(s.y/size),0,rows-1);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const p=cells[(y+dy)*cols+x+dx];if(x+dx>=0&&x+dx<cols&&p){p.v=1;p.color=colors[color];}}};
      api.press=()=>{color=(color+1)%3;paint();};api.move=()=>{if(s.inside)paint();};
      api.draw=(c,s,step)=>{
        background(c,s);if(step&&s.t%3===0){const p=cells[Math.floor(R()*cells.length)];p.v=1;p.color=colors[Math.floor(R()*3)];}
        cells.forEach((p,i)=>{const x=(i%cols)*size+2,y=Math.floor(i/cols)*size+2;c.fillStyle='rgba(242,239,231,.06)';c.fillRect(x,y,size-4,size-4);if(p.v>.01){c.globalAlpha=p.v;c.fillStyle=p.color;c.fillRect(x,y,size-4,size-4);}p.v*=step?.98:1;});c.globalAlpha=1;
        const text=s.inside?'0x'+(0x7FF0+(Math.floor(s.y/size)*cols+Math.floor(s.x/size))*8).toString(16).toUpperCase():'heap: '+cells.filter(p=>p.v>.3).length*8+' B in use';
        c.font='500 10px "JetBrains Mono",monospace';c.fillStyle=C.navy;c.fillRect(10,s.h-30,c.measureText(text).width+18,22);c.fillStyle=C.paper;c.fillText(text,18,s.h-15);
      };
    } else if(kind==='ripple') {
      let rings=[{x:s.w*.3,y:s.h*.4,r:25},{x:s.w*.7,y:s.h*.6,r:70},{x:s.w*.47,y:s.h*.32,r:115}];
      api.press=()=>{rings.push({x:s.x,y:s.y,r:paused?45:3});rings=rings.slice(-9);};
      api.draw=(c,s,step)=>{
        background(c,s);rings.forEach((p,i)=>{
          p.r+=step*.9;for(let j=0;j<5;j++){const r=p.r-j*11;if(r<=0)continue;c.beginPath();c.arc(p.x,p.y,r,0,tau);c.strokeStyle=i%2?C.orange:C.paper;c.globalAlpha=clamp(1-r/(s.w*1.1),0,.65)*(1-j*.14);c.lineWidth=j===0?1.6:.8;c.stroke();}
          dot(c,p.x,p.y,2,C.pink);
        });c.globalAlpha=1;rings=rings.filter(p=>p.r<s.w*1.2);
        if(step&&s.t%120===0)rings.push({x:R()*s.w,y:R()*s.h,r:2});
      };
    } else if(kind==='gravity') {
      const ps=Array.from({length:160},(_,i)=>{const a=R()*tau,r=35+R()*s.w*.4;return{x:s.w/2+Math.cos(a)*r,y:s.h/2+Math.sin(a)*r,vx:-Math.sin(a)*1.5,vy:Math.cos(a)*1.5,color:colors[i%4]};});
      api.draw=(c,s,step)=>{
        c.fillStyle='rgba(3,13,66,.12)';c.fillRect(0,0,s.w,s.h);const x=s.inside?s.x:s.w/2,y=s.inside?s.y:s.h/2;
        ps.forEach(p=>{const dx=x-p.x,dy=y-p.y,d=Math.max(24,Math.hypot(dx,dy)),f=(s.down?-1:1)*9/d,ox=p.x,oy=p.y;p.vx=(p.vx+dx/d*f*step)*.997;p.vy=(p.vy+dy/d*f*step)*.997;p.x+=clamp(p.vx,-4,4)*step;p.y+=clamp(p.vy,-4,4)*step;
          if(p.x<0||p.x>s.w||p.y<0||p.y>s.h){const a=R()*tau;p.x=x+Math.cos(a)*s.w*.4;p.y=y+Math.sin(a)*s.h*.4;p.vx=-Math.sin(a)*1.5;p.vy=Math.cos(a)*1.5;}
          line(c,[[ox,oy],[p.x,p.y]],p.color,1.2,.7);
        });c.beginPath();c.arc(x,y,8,0,tau);c.strokeStyle=C.orange;c.stroke();
      };
      background(c,s);for(let i=0;i<65;i++)api.draw(c,s,1);
    } else if(kind==='wireframe') {
      let mode=0;api.press=()=>{mode=1-mode;};
      api.draw=(c,s)=>{
        background(c,s);const ax=s.inside?(s.y/s.h-.5)*2:.35, ay=s.inside?(s.x/s.w-.5)*tau:s.t*.009+.5;
        const project=(u,v)=>{
          let x,y,z;
          if(mode){x=(.68+.27*Math.cos(v))*Math.cos(u);z=(.68+.27*Math.cos(v))*Math.sin(u);y=.27*Math.sin(v);}
          else{x=Math.cos(u)*Math.sin(v);z=Math.sin(u)*Math.sin(v);y=Math.cos(v);}
          const xx=x*Math.cos(ay)-z*Math.sin(ay),zz=x*Math.sin(ay)+z*Math.cos(ay),yy=y*Math.cos(ax)-zz*Math.sin(ax),depth=y*Math.sin(ax)+zz*Math.cos(ax), k=s.w*.34/(1.9-depth*.35);
          return[s.w/2+xx*k*1.5,s.h/2+yy*k*1.5];
        };
        for(let i=0;i<18;i++){const pts=[];for(let j=0;j<=64;j++)pts.push(project(i/18*tau,j/64*(mode?tau:Math.PI)));line(c,pts,i%6===0?C.orange:C.lavender,i%6===0?1.5:.7,.7);}
        for(let i=1;i<13;i++){const pts=[];for(let j=0;j<=64;j++)pts.push(project(j/64*tau,i/13*(mode?tau:Math.PI)));line(c,pts,C.pink,.8,.7);}
      };
    } else if(kind==='kaleidoscope') {
      let strokes=[],color=0, lastPoint;
      const record=()=>{const p=[s.x-s.w/2,s.y-s.h/2];if(lastPoint)strokes.push({a:lastPoint,b:p,color:colors[color]});lastPoint=p;strokes=strokes.slice(-500);};
      for(let i=0;i<100;i++){const a=i*.055,r=s.w*(.13+.13*Math.sin(i*.09));s.x=s.w/2+Math.cos(a)*r;s.y=s.h/2+Math.sin(a)*r;record();}lastPoint=null;s.x=s.w/2;s.y=s.h/2;
      api.press=()=>{color=(color+1)%3;lastPoint=null;record();};api.move=record;
      api.draw=(c,s)=>{
        background(c,s);c.save();c.translate(s.w/2,s.h/2);
        for(let i=0;i<8;i++){c.save();c.rotate(i*tau/8);for(const p of strokes){line(c,[p.a,p.b],p.color,1,.7);line(c,[[p.a[0],-p.a[1]],[p.b[0],-p.b[1]]],p.color,.8,.45);}c.restore();}
        c.restore();dot(c,s.w/2,s.h/2,3,C.orange);
      };
    } else if(kind==='strings') {
      const strings=Array.from({length:15},()=>({y:0,v:0}));
      api.press=()=>{strings.forEach((p,i)=>{p.v=9*Math.exp(-((s.y/s.h*17-i-1)**2)/5);});};
      api.move=()=>{if(s.inside)strings.forEach((p,i)=>{p.y=(s.x/s.w-.5)*95*Math.exp(-((s.y/s.h*17-i-1)**2)/7);});};
      api.draw=(c,s,step)=>{
        background(c,s);
        strings.forEach((p,i)=>{if(step){p.v-=p.y*.055;p.v*=.96;p.y+=p.v;}const y=s.h*(i+1)/16,pts=[];
          for(let j=0;j<=45;j++){const x=20+(s.w-40)*j/45;pts.push([x,y+Math.sin(j/45*Math.PI)*p.y+Math.sin(j/45*Math.PI*3)*p.y*.18]);}
          line(c,pts,i%4===0?C.orange:C.paper,i%4===0?1.7:.9,.6);dot(c,20,y,2,C.pink);dot(c,s.w-20,y,2,C.pink);
        });
      };
      strings.forEach((p,i)=>p.y=Math.sin(i*.8)*25);
    } else if(kind==='moire') {
      let mode=0;api.press=()=>{mode=1-mode;};
      api.draw=(c,s)=>{
        background(c,s,C.blue);const dx=s.inside?(s.x/s.w-.5)*75:Math.cos(s.t*.008)*20,dy=s.inside?(s.y/s.h-.5)*75:Math.sin(s.t*.009)*15;
        for(let layer=0;layer<2;layer++){c.save();c.translate(s.w/2+(layer?dx:0),s.h/2+(layer?dy:0));c.strokeStyle=layer?C.orange:C.paper;c.lineWidth=1;c.globalAlpha=layer?.7:.4;
          if(!mode){for(let r=6;r<s.w*1.2;r+=6){c.beginPath();c.arc(0,0,r,0,tau);c.stroke();}}
          else{c.rotate(layer?dx*.004+.12:-.12);for(let x=-s.w;x<s.w;x+=7){c.beginPath();c.moveTo(x,-s.h);c.lineTo(x,s.h);c.stroke();}}
          c.restore();
        }
      };
    } else if(kind==='spiro') {
      let ratio=3.6,phase=.5;api.press=()=>{phase+=.7;};api.move=()=>{ratio=2+s.x/s.w*5;};
      api.draw=(c,s)=>{
        background(c,s);const r=s.w*.28,d=s.w*.16;
        for(let k=0;k<3;k++){const pts=[];for(let j=0;j<=650;j++){const a=j/650*tau*10;pts.push([s.w/2+r*Math.cos(a+phase)+d*Math.cos(a*ratio+phase+k*.12),s.h/2+r*Math.sin(a+phase)-d*Math.sin(a*ratio+phase+k*.12)]);}line(c,pts,colors[k],k===0?1.1:.65,k===0?.8:.35);}
        if(s.t%2===0)phase+=.002;
      };
    } else if(kind==='life') {
      const size=13,cols=Math.floor(s.w/size),rows=Math.floor(s.h/size);let cells=Array.from({length:cols*rows},()=>R()>.76?1:0),age=cells.slice();let lastCell=-1;
      const paint=toggle=>{const x=clamp(Math.floor(s.x/size),0,cols-1),y=clamp(Math.floor(s.y/size),0,rows-1),i=y*cols+x;if(i===lastCell&&!toggle)return;cells[i]=toggle?1-cells[i]:1;age[i]=cells[i];lastCell=i;};
      api.press=()=>{lastCell=-1;paint(true);};api.move=()=>{if(s.down)paint(false);};
      api.draw=(c,s,step)=>{
        if(step&&s.t%7===0){const out=cells.slice();for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)n+=cells[((y+dy+rows)%rows)*cols+(x+dx+cols)%cols];const i=y*cols+x;out[i]=n===3||(cells[i]&&n===2)?1:0;age[i]=out[i]?age[i]+1:0;}cells=out;}
        background(c,s);cells.forEach((p,i)=>{c.fillStyle=p?(age[i]<3?C.orange:age[i]<8?C.pink:C.lavender):'rgba(242,239,231,.055)';c.fillRect((i%cols)*size+1,Math.floor(i/cols)*size+1,size-2,size-2);});
      };
    }
    return api;
  }

  const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{const m=models.find(m=>m.stage===e.target);if(m){m.visible=e.isIntersecting;m.card.classList.toggle('is-visible',e.isIntersecting);if(e.isIntersecting){if(!m.initialized)m.reset();render(m);}}});schedule();},{threshold:.05});
  cards.forEach(card=>{
    const stage=card.querySelector('.exp__stage'),cv=stage.querySelector('canvas'),kind=card.dataset.kind;
    const m={card,stage,ctx:cv?.getContext('2d'),visible:false,s:{w:0,h:0,x:0,y:0,t:0,inside:false,down:false},draw:()=>{},press:()=>{},move:()=>{}};
    models.push(m);
    const reset=()=>{
      const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
      m.initialized=true;
      Object.assign(m.s,{w,h,x:w/2,y:h/2,t:0,inside:false,down:false});
      if(cv){const dpr=Math.min(devicePixelRatio||1,2);cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);m.ctx.setTransform(dpr,0,0,dpr,0,0);Object.assign(m,experiment(kind,m.s,m.ctx));}
      else if(kind==='type'){
        const el=stage.querySelector('.exp-type');el.style.setProperty('--w',300);el.style.setProperty('--s',0);
        m.draw=()=>{if(m.s.inside){el.style.setProperty('--w',Math.round(100+m.s.x/m.s.w*800));el.style.setProperty('--s',Math.round(m.s.y/m.s.h*100));}};
      }else{
        let angle=0;stage.style.setProperty('--blob-x','0px');stage.style.setProperty('--blob-y','0px');stage.style.setProperty('--blob-r','0deg');
        m.press=()=>{angle+=60;stage.style.setProperty('--blob-r',angle+'deg');};
        m.draw=()=>{if(m.s.inside){stage.style.setProperty('--blob-x',(m.s.x/m.s.w-.5)*60+'px');stage.style.setProperty('--blob-y',(m.s.y/m.s.h-.5)*60+'px');}};
      }
      render(m);schedule();
    };
    m.reset=reset;observer.observe(stage);
    new ResizeObserver(()=>{if(m.initialized&&stage.clientWidth&& (stage.clientWidth!==m.s.w||stage.clientHeight!==m.s.h))reset();}).observe(stage);
    const position=e=>{if(!m.initialized)reset();if(lastInteracted!==card){lastInteracted=card;resetLabel();}const r=stage.getBoundingClientRect();m.s.x=clamp(e.clientX-r.left,0,m.s.w);m.s.y=clamp(e.clientY-r.top,0,m.s.h);m.s.inside=true;};
    let start,dragged=false;
    stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;position(e);m.s.down=true;start=[e.clientX,e.clientY];dragged=false;stage.setPointerCapture(e.pointerId);if(kind!=='wireframe'&&kind!=='moire')m.press();render(m);});
    stage.addEventListener('pointermove',e=>{position(e);if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])>6)dragged=true;m.move();render(m);});
    const end=e=>{if(start&&!dragged&&(kind==='wireframe'||kind==='moire'))m.press();start=null;m.s.down=false;if(e.pointerType!=='mouse')m.s.inside=false;render(m);};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',()=>{start=null;m.s.down=false;m.s.inside=false;render(m);});
    stage.addEventListener('pointerleave',()=>{if(!m.s.down)m.s.inside=false;});
    stage.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))return;
      if(!m.initialized)reset();
      lastInteracted=card;resetLabel();
      e.preventDefault();m.s.inside=true;
      if(e.key==='ArrowLeft')m.s.x-=m.s.w*.08;if(e.key==='ArrowRight')m.s.x+=m.s.w*.08;
      if(e.key==='ArrowUp')m.s.y-=m.s.h*.08;if(e.key==='ArrowDown')m.s.y+=m.s.h*.08;
      m.s.x=clamp(m.s.x,0,m.s.w);m.s.y=clamp(m.s.y,0,m.s.h);
      if(e.key===' '||e.key==='Enter')m.press();else m.move();render(m);
    });
  });
  resetButton.addEventListener('click',()=>models.find(m=>m.card===resetTarget())?.reset());
  lab.querySelectorAll('[data-lab-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    lab.querySelectorAll('[data-lab-filter]').forEach(b=>{const on=b===btn;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',String(on));});
    cards.forEach(card=>card.hidden=btn.dataset.labFilter!=='all'&&card.dataset.group!==btn.dataset.labFilter);
    track.scrollTo({left:0,behavior:'instant'});updateNavigation();schedule();
  }));
  new MutationObserver(()=>{theme();models.filter(m=>m.visible).forEach(m=>render(m));}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  syncPause();updateNavigation();
})();
