(() => {
  'use strict';
  const layout = [
    '#####################',
    '#o........#........o#',
    '#.##.####.#.####.##.#',
    '#...................#',
    '#.##.#.#######.#.##.#',
    '#....#....#....#....#',
    '####.#### # ####.####',
    '####.#         #.####',
    '####.# ### ### #.####',
    '#......#     #......#',
    '#.##.# #     # #.##.#',
    '#....# ####### #....#',
    '####.#         #.####',
    '####.# ####### #.####',
    '#.........#.........#',
    '#.##.####.#.####.##.#',
    '#o.#...... ......#.o#',
    '##.#.#.#######.#.#.##',
    '#....#....#....#....#',
    '#.#######.#.#######.#',
    '#...................#',
    '#.#################.#',
    '#####################'
  ];
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const tile = 24, directions = {left:{x:-1,y:0,a:Math.PI},right:{x:1,y:0,a:0},up:{x:0,y:-1,a:-Math.PI/2},down:{x:0,y:1,a:Math.PI/2}};
  const keys = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
  const colors = ['#ff617f','#67e5ee','#ffb4e1','#ffb65c'];
  let board, player, ghosts, score = 0, lives = 3, remaining, state = 'ready', power = 0, chain = 0, elapsed = 0, respawn = 0, best = 0, sound = false, audio;
  try { best = Number(localStorage.getItem('pixel-pacman-best')) || 0; } catch (_) { /* Storage can be disabled for local files. */ }
  function walk(x,y) { return board[y]?.[x] !== undefined && board[y][x] !== '#'; }
  function entity(x,y,dir) { return {x,y,fromX:x,fromY:y,toX:x,toY:y,progress:1,dir}; }
  function position(e) { return {x:e.fromX+(e.toX-e.fromX)*e.progress,y:e.fromY+(e.toY-e.fromY)*e.progress}; }
  function resetActors() {
    player = entity(10,16,'left'); player.next = 'left';
    ghosts = [entity(10,9,'left'),entity(9,9,'right'),entity(11,9,'left'),entity(10,10,'right')];
    ghosts.forEach((g,i) => {g.id=i;g.release=i*0.9;});
    power = 0; chain = 0; respawn = 1.25;
  }
  function updateHud() {
    $('score').textContent = String(score).padStart(5,'0');
    if (score > best) {best=score;try{localStorage.setItem('pixel-pacman-best',String(best));}catch(_){} }
    $('best').textContent = String(best).padStart(5,'0');
    $('lives').textContent = '● '.repeat(lives).trim() || '—';
    $('lives').setAttribute('aria-label',`${lives} vidas`);
  }
  function newGame() {
    board = layout.map(row=>row.split('')); score=0;lives=3;elapsed=0;
    remaining=board.flat().filter(c=>c==='.'||c==='o').length;
    resetActors(); state='playing'; $('overlay').hidden=true; updateHud(); syncControls();
  }
  function syncControls() {
    $('pause').disabled=state!=='playing' && state!=='paused';
    $('pause').textContent=state==='paused'?'▶':'Ⅱ';
    $('pause').setAttribute('aria-label',state==='paused'?'Continuar partida':'Pausar partida');
    $('status').textContent=state==='playing'?(power>0?'ENERGÍA · ¡A POR ELLOS!':'COME TODOS LOS PUNTOS'):state==='paused'?'PARTIDA EN PAUSA':state==='won'?'LABERINTO COMPLETADO':state==='lost'?'FIN DE LA PARTIDA':'LISTO PARA JUGAR';
  }
  function showOverlay(label,title,text,button) {
    $('overlay-label').textContent=label;$('overlay-title').textContent=title;
    $('overlay-text').textContent=text;$('play').textContent=button;
    $('overlay-hint').textContent='Pulsa Enter para '+(state==='paused'?'continuar':'jugar');
    $('overlay').hidden=false;syncControls();
  }
  function pause() {
    if(state==='playing'){state='paused';showOverlay('TÓMATE UN RESPIRO','Pausa', 'Los fantasmas también necesitan descansar.','CONTINUAR →');}
    else if(state==='paused'){state='playing';$('overlay').hidden=true;syncControls();}
  }
  function tone(freq,duration=.055) {
    if(!sound)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)(); audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch(_){}
  }
  function eat() {
    const c=board[player.y][player.x];
    if(c!=='.'&&c!=='o')return;
    board[player.y][player.x]=' ';remaining--;score+=c==='o'?50:10;
    if(c==='o'){power=7;chain=0;tone(220,.2);syncControls();}else tone(440+(remaining%2)*110);
    updateHud();
    if(remaining===0){state='won';showOverlay('PERFECTO. NI UNA MIGA.','¡Lo conseguiste!',`Has limpiado el laberinto. Puntuación: ${score}.`,'VOLVER A JUGAR →');}
  }
  function ghostDirection(g) {
    const options=Object.keys(directions).filter(d=>walk(g.x+directions[d].x,g.y+directions[d].y));
    const forward=options.filter(d=>directions[d].x!==-directions[g.dir].x||directions[d].y!==-directions[g.dir].y);
    const choices=forward.length?forward:options;
    if(!choices.length)return null;
    // A breadth-first distance field makes pursuit work around walls.
    let target={x:player.x,y:player.y};
    if(g.id===1){const d=directions[player.dir];for(let i=1;i<=3;i++){if(walk(player.x+d.x*i,player.y+d.y*i))target={x:player.x+d.x*i,y:player.y+d.y*i};else break;}}
    if(g.id===3 && Math.hypot(g.x-player.x,g.y-player.y)<5)target={x:19,y:20};
    const distances=new Map([[`${target.x},${target.y}`,0]]), queue=[target];
    for(let i=0;i<queue.length;i++){const p=queue[i],dist=distances.get(`${p.x},${p.y}`);for(const d of Object.values(directions)){const x=p.x+d.x,y=p.y+d.y,k=`${x},${y}`;if(walk(x,y)&&!distances.has(k)){distances.set(k,dist+1);queue.push({x,y});}}}
    if(g.id===2&&Math.random()<.2)return choices[Math.floor(Math.random()*choices.length)];
    choices.sort((a,b)=>{const da=directions[a],db=directions[b];const diff=(distances.get(`${g.x+da.x},${g.y+da.y}`)??999)-(distances.get(`${g.x+db.x},${g.y+db.y}`)??999);return power>0?-diff:diff;});
    return choices[0];
  }
  function move(e,dt,speed,choose,onArrival) {
    let budget=dt*speed;
    while(budget>0 && state==='playing') {
      if(e.progress>=1){const dir=choose(e);if(!dir)return;e.dir=dir;const d=directions[dir];if(!walk(e.x+d.x,e.y+d.y))return;e.fromX=e.x;e.fromY=e.y;e.toX=e.x+d.x;e.toY=e.y+d.y;e.progress=0;}
      const amount=Math.min(1-e.progress,budget);e.progress+=amount;budget-=amount;
      if(e.progress>=1){e.x=e.toX;e.y=e.toY;if(onArrival)onArrival();}
    }
  }
  function update(dt) {
    elapsed+=dt;
    if(respawn>0){respawn-=dt;return;}
    if(power>0){power=Math.max(0,power-dt);if(power===0)syncControls();}
    move(player,dt,6.4,e=>{const d=directions[e.next];return walk(e.x+d.x,e.y+d.y)?e.next:e.dir;},eat);
    if(state!=='playing')return;
    for(const g of ghosts){if(g.release>0){g.release-=dt;continue;}move(g,dt,power>0?3.2:4.5+g.id*.12,ghostDirection);}
    const p=position(player);
    for(const g of ghosts){const q=position(g);if(g.release>0||Math.hypot(p.x-q.x,p.y-q.y)>.68)continue;
      if(power>0){score+=200*2**Math.min(chain++,3);const fresh=entity(10,9,'left');Object.assign(g,fresh,{release:2});tone(740,.15);updateHud();}
      else{lives--;tone(110,.35);updateHud();if(lives===0){state='lost';showOverlay('LOS FANTASMAS GANAN ESTA VEZ','Una más, ¿no?',`Has conseguido ${score} puntos. Tu próxima marca te espera.`,'VOLVER A JUGAR →');}else resetActors();break;}
    }
  }
  function draw() {
    ctx.fillStyle='#060a17';ctx.fillRect(0,0,canvas.width,canvas.height);
    // Draw wall surfaces first, then only their exposed edges: no tile seams.
    ctx.fillStyle='#0d1735';
    for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
      if(board[y][x]==='#')ctx.fillRect(x*tile,y*tile,tile,tile);
    }
    ctx.strokeStyle='#355ee0';ctx.lineWidth=1.8;ctx.lineCap='round';
    ctx.beginPath();
    for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
      const c=board[y][x];
      if(c==='#'){
        const left=x*tile,top=y*tile,right=left+tile,bottom=top+tile;
        if(board[y-1]?.[x]!=='#'){ctx.moveTo(left,Math.max(1,top));ctx.lineTo(right,Math.max(1,top));}
        if(board[y+1]?.[x]!=='#'){ctx.moveTo(left,Math.min(canvas.height-1,bottom));ctx.lineTo(right,Math.min(canvas.height-1,bottom));}
        if(board[y]?.[x-1]!=='#'){ctx.moveTo(Math.max(1,left),top);ctx.lineTo(Math.max(1,left),bottom);}
        if(board[y]?.[x+1]!=='#'){ctx.moveTo(Math.min(canvas.width-1,right),top);ctx.lineTo(Math.min(canvas.width-1,right),bottom);}
      }
    }
    ctx.stroke();
    for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
      const c=board[y][x];
      if(c==='.'||c==='o'){ctx.fillStyle='#ffe4b0';ctx.shadowColor=c==='o'?'#ffe4b0':'transparent';ctx.shadowBlur=c==='o'?12:0;ctx.beginPath();ctx.arc(x*tile+12,y*tile+12,c==='o'?5+Math.sin(elapsed*5)*.8:2.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    }
    // Ghost-house gate.
    ctx.strokeStyle='#ffb4e1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10*tile+2,8*tile+12);ctx.lineTo(11*tile-2,8*tile+12);ctx.stroke();
    const p=position(player),px=p.x*tile+12,py=p.y*tile+12;
    const mouth=.14+Math.abs(Math.sin(elapsed*13))*.23;
    ctx.fillStyle='#ffe45c';ctx.shadowColor='#ffe45c';ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py,9,directions[player.dir].a+mouth,directions[player.dir].a+Math.PI*2-mouth);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    for(const g of ghosts){const p=position(g),x=p.x*tile+12,y=p.y*tile+12,frightened=power>0;
      ctx.fillStyle=frightened?(power<2&&Math.floor(elapsed*8)%2?'#eeeefb':'#435ff5'):colors[g.id];ctx.beginPath();ctx.arc(x,y-1,9,Math.PI,0);ctx.lineTo(x+9,y+9);for(let i=3;i>=0;i--)ctx.lineTo(x-9+i*6,y+(i%2?5:9));ctx.closePath();ctx.fill();
      for(const offset of [-3.5,3.5]){ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x+offset,y-1,2.7,3.4,0,0,Math.PI*2);ctx.fill();const d=directions[g.dir];ctx.fillStyle=frightened?'#25316b':'#182553';ctx.beginPath();ctx.arc(x+offset+d.x,y-1+d.y,1.5,0,Math.PI*2);ctx.fill();}
    }
    if(respawn>0&&state==='playing'){ctx.fillStyle='#ffe45c';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('¡PREPÁRATE!',canvas.width/2,13*tile+15);}
  }
  $('play').addEventListener('click',()=>state==='paused'?pause():newGame());
  $('pause').addEventListener('click',pause);$('restart').addEventListener('click',newGame);
  $('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Desactivar sonido':'Activar sonido');tone(660,.1);});
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select'))return;
    if(keys[event.key]){event.preventDefault();if(state==='playing')player.next=keys[event.key];}
    else if(event.key.toLowerCase()==='p'){event.preventDefault();if(!event.repeat)pause();}
    else if(event.key.toLowerCase()==='r'){event.preventDefault();if(!event.repeat)newGame();}
    else if(event.key==='Enter' && event.target.tagName!=='BUTTON' && event.target.tagName!=='A'){event.preventDefault();if(!event.repeat){if(state==='paused')pause();else if(state!=='playing')newGame();}}
  });
  document.querySelectorAll('[data-dir]').forEach(button=>button.addEventListener('pointerdown',event=>{event.preventDefault();if(state==='playing')player.next=button.dataset.dir;}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();});
  board=layout.map(row=>row.split(''));resetActors();updateHud();draw();
  let last=performance.now();
  function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(state==='playing')update(dt);draw();requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();
